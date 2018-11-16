import * as http from 'http';
import * as fetch from 'node-fetch';
import { EventEmitter } from 'events';

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

export class ServerAuth extends EventEmitter {
    // const app reg details  

    public authTokens = new AuthTokens({});

    constructor(private appId: string, private appPassword: string, private defaultRedirectUri: string, private scopes: string[] = []) {
        super();

    }

    // gets code authorization redirect
    authUrl(): string {
        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${this.appId}&response_type=code&redirect_uri=${this.defaultRedirectUri}&scope=${this.scopes.join('%20')}`;
    }

    addScopes(scopes: string[]) {
        this.scopes.concat(scopes);
    }

    updateAuthTokens(data : Object) {
        this.authTokens = new AuthTokens(data);
    }

    async getAccessToken(resource?: string): Promise<string> {
        if (this.authTokens.access_token && this.authTokens.expires_on && this.authTokens.expires_on > Date.now()) { return this.authTokens.access_token }
        if (this.authTokens.refresh_token) {
            await this.refreshAuthTokens();
            this.emit('refreshed');
            return this.authTokens.access_token;
        }
        throw new Error('No access token available');
    }

    // gets tokens from authorization code
    async handleAuthCode(code: string): Promise<void> {
        var body = `client_id=${this.appId}`;
        body += `&scope=${this.scopes.join('%20')}`;
        body += `&code=${code}`;
        body += `&redirect_uri=${this.defaultRedirectUri}`;
        body += `&grant_type=authorization_code&client_secret=${this.appPassword}`;

        var res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });
        if (res.status !== 200) { throw new Error('get token failed.'); }
        var data = await res.json();
        if (data['expires_in']) {
            let expires = new Date(Date.now() + data['expires_in'] * 1000);
            data['expires_on'] = expires.getTime();
        }
        this.authTokens = new AuthTokens(data);
        this.emit('refreshed');
    }

    // gets new access token using refresh token
    async refreshAuthTokens() {
        var body = `client_id=${this.appId}`;
        body += `&scope=${this.scopes.join('%20')}`;
        body += `&refresh_token=${this.authTokens.refresh_token}`;
        body += `&redirect_uri=${this.defaultRedirectUri}`;
        body += `&grant_type=refresh_token&client_secret=${this.appPassword}`;

        var res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });
        if (res.status !== 200) { throw new Error('get token failed.'); }
        var data = await res.json();
        if (data['expires_in']) {
            let expires = new Date(Date.now() + data['expires_in'] * 1000);
            data['expires_on'] = expires.getTime();
        }
        this.authTokens = new AuthTokens(data);
        this.emit('refreshed');
    }
}

export declare interface ServerAuth {
    on(event: 'refreshed', listener: () => void): this;
    // on(event: string, listener: Function): this;
}

