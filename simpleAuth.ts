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

    private _tokens : AuthTokens = new AuthTokens({});

    constructor(private appId: string, private appPassword: string, private defaultRedirectUri: string, private scopes: string[] = []) {
        super();

    }

    public get tokens(): AuthTokens {
        return this._tokens;
    }

    public set tokens(value: AuthTokens) {
        if (isDeepStrictEqual(this.tokens, value)) { 
            return 
        }
        this._tokens = value;
        this.emit('refreshed');
    }

    public load(data : Object) { this.tokens = new AuthTokens(data); }

    // gets code authorization redirect
    authUrl(): string {
        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${this.appId}&response_type=code&redirect_uri=${this.defaultRedirectUri}&scope=${this.scopes.join('%20')}`;
    }

    addScopes(scopes: string[]) {
        this.scopes.concat(scopes);
    }

    async getAccessToken(resource?: string): Promise<string> {
        if (this.tokens.access_token && this.tokens.expires_on && this.tokens.expires_on.valueOf() > Date.now()) { return this.tokens.access_token }
        if (this.tokens.refresh_token) {
            await this.refreshAuth();
            this.emit('refreshed');
            return this.tokens.access_token;
        }
        throw new Error('No access token available');
    }

    updateAuthFromObject(data : Object) {
        this.tokens = new AuthTokens(data);
    }

    // gets tokens from authorization code
    async updateAuthFromCode(code: string): Promise<void> {
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
        this.tokens = new AuthTokens(data);
    }

    // gets new access token using refresh token
    async refreshAuth() {
        var body = `client_id=${this.appId}`;
        body += `&scope=${this.scopes.join('%20')}`;
        body += `&refresh_token=${this.tokens.refresh_token}`;
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
        this.tokens = new AuthTokens(data);
    }
}

export declare interface ServerAuth {
    on(event: 'refreshed', listener: () => void): this;
    emit(event: 'refreshed') : boolean
    // on(event: string, listener: Function): this;
    // emit(event: string | symbol, ...args : any[]) : boolean;
}
