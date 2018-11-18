import * as http from 'http';
import * as fetch from 'node-fetch';
import { EventEmitter } from 'events';
import { isDeepStrictEqual } from 'util';

export class AuthTokens {
    access_token: string;
    expires_on: Date;
    refresh_token: string;
    id_token: string;

    constructor(data: any) {
        this.access_token = data.access_token;
        this.id_token = data.id_token;
        this.refresh_token = data.refresh_token;
        this.expires_on = data.expires_on ? new Date(parseInt(data.expires_on)) : new Date(0);
    }
}

export class ServerAuth extends EventEmitter {

    private _tokensMap = new Map<string, AuthTokens>();

    constructor(private appId: string, private appPassword: string, private defaultRedirectUri: string, private scopes: string[] = []) {
        super();

    }

    getTokensForUser(userId: string): AuthTokens {
        let tokens = this._tokensMap.get(userId);
        if (tokens === undefined) throw new Error('Request for a token for unknown user.')
        return tokens;
    }

    setTokensForUser(userId: string, value: AuthTokens) {
        if (isDeepStrictEqual(this.getTokensForUser(userId), value)) {
            return
        }
        this._tokensMap.set(userId, value);
        this.emit('refreshed');
    }

    // load(userId: string, data: Object) { this.setTokensForUser(userId, new AuthTokens(data)); }

    // gets code authorization redirect
    authUrl(): string {
        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${this.appId}&response_type=code&redirect_uri=${this.defaultRedirectUri}&scope=${this.scopes.join('%20')}`;
    }

    addScopes(scopes: string[]) {
        this.scopes.concat(scopes);
    }

    async getAccessToken(userId: string, resource?: string): Promise<string> {
        let tokens = this._tokensMap.get(userId);
        if (!tokens) throw new Error('No tokens for user.  Not logged in.');
        if (tokens.access_token && tokens.expires_on && tokens.expires_on.valueOf() > Date.now()) { return tokens.access_token }
        if (tokens.refresh_token) {
            let tokens = await this.refreshAuth(userId);
            this.emit('refreshed');
            return tokens.access_token;
        }
        throw new Error('No access token available');
    }
  
    // gets tokens from authorization code
    async getUserIdFromCode(code: string): Promise<string> {
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
        let tokens = new AuthTokens(data);
        this._tokensMap.set(tokens.id_token, tokens);
        return tokens.id_token;
    }

    // gets new access token using refresh token
    async refreshAuth(userId: string): Promise<AuthTokens> {
        let tokens = this.getTokensForUser(userId);
        var body = `client_id=${this.appId}`;
        body += `&scope=${this.scopes.join('%20')}`;
        body += `&refresh_token=${tokens.refresh_token}`;
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
        tokens = new AuthTokens(data);
        this._tokensMap.set(tokens.id_token, tokens);
        if (tokens && tokens.id_token) return tokens;
        throw new Error('Should not have an authToken without an id_token');
    }
}

export declare interface ServerAuth {
    on(event: 'refreshed', listener: () => void): this;
    emit(event: 'refreshed'): boolean
    // on(event: string, listener: Function): this;
    // emit(event: string | symbol, ...args : any[]) : boolean;
}
