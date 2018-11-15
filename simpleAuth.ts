import * as http from 'http';
import * as fetch from 'node-fetch';

export class AuthTokens {
    access_token: string;
    id_token: string;
    refresh_token: string;
    expires_on: Number;

    constructor(data: any) {
        this.access_token = data.access_token;
        this.id_token = data.id_token;
        this.refresh_token = data.refresh_token;
        this.expires_on = data.expires_on ? parseInt(data.expires_on) : 0;
    }
}

export class ServerAuth {
    // const app reg details  

    constructor(private id: string, private password: string, private defaultUri: string) { }

    // gets code authorization redirect
    authUrl(scope: string[], uri?: string): string {
        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${this.id}&response_type=code&redirect_uri=${uri || this.defaultUri}&scope=${scope.join('%20')}`;
    }


    async getAccessToken(authTokens: AuthTokens, resource?: string, scopes?: string[]): Promise<[string | null, AuthTokens | null]> {
        if (!authTokens) { return [null, null]; }
        if (authTokens.access_token && authTokens.expires_on && authTokens.expires_on > Date.now()) { return [authTokens.access_token, null] }
        if (authTokens.refresh_token) {
            console.log('No access token or expired. Acquiring updated access_token using the refresh_token');
            var authResult = await this.getAccessTokenSilent(authTokens.refresh_token, scopes ? scopes : []);
            return [authResult.access_token, authResult]
        }
        return [null, null];
    }

    // gets tokens from authorization code
    async getTokenByAuthCode(code: string, scope: string[]): Promise<AuthTokens> {
        var body = `client_id=${this.id}`;
        body += `&scope=${scope.join('%20')}`;
        body += `&code=${code}`;
        body += `&redirect_uri=${this.defaultUri}`;
        body += `&grant_type=authorization_code&client_secret=${this.password}`;

        var res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });
        if (res.status !== 200) { throw new Error ('get token failed.'); }
        var data = await res.json();
        if (data['expires_in']) {
            let expires = new Date(Date.now() + data['expires_in'] * 1000);
            data['expires_on'] = expires.getTime();
        }
        return new AuthTokens(data);
    }

    // gets new access token using refresh token
    async getAccessTokenSilent(refreshToken: string, scope: string[]) {
        var body = `client_id=${this.id}`;
        body += `&scope=${scope.join('%20')}`;
        body += `&refresh_token=${refreshToken}`;
        body += `&redirect_uri=${this.defaultUri}`;
        body += `&grant_type=refresh_token&client_secret=${this.password}`;

        var res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });
        if (res.status !== 200) { throw new Error ('get token failed.'); }
        var data = await res.json();
        if (data['expires_in']) {
            let expires = new Date(Date.now() + data['expires_in'] * 1000);
            data['expires_on'] = expires.getTime();
        }
        return new AuthTokens(data);
    }
}