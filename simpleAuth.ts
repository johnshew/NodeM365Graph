import { EventEmitter } from 'events';
import { isDeepStrictEqual } from 'util';
import { randomBytes } from 'crypto';

import * as fetch from 'node-fetch';

class AuthTokens {
    auth_secret: string;
    access_token: string;
    expires_on: Date;
    refresh_token: string;
    id_token: string;

    constructor(data: any) {
        if (!data.access_token || !data.expires_on || !data.id_token || !data.refresh_token || !data.auth_secret) throw new Error('Missing values for AuthToken');
        this.auth_secret = data.auth_secret;
        this.access_token = data.access_token;
        this.id_token = data.id_token;
        this.refresh_token = data.refresh_token;
        this.expires_on = data.expires_on;
    }
}

export class AuthManager extends EventEmitter {

    private _tokensMap = new Map<string, AuthTokens>(); // UserAuthSecret to AuthTokens

    constructor(private appId: string, private appPassword: string, private defaultRedirectUri: string, private scopes: string[] = []) { super(); }

    getTokensFromUserAuthSecret(authSecret: string): AuthTokens | null {
        let tokens = this._tokensMap.get(authSecret);
        if (!tokens) return null;
        return tokens;
    }

    setTokensForUserAuthSecret(authSecret: string, value: AuthTokens) {
        if (authSecret !== value.auth_secret) throw new Error('UserAuthSecret does not match');
        if (isDeepStrictEqual(this._tokensMap.get(authSecret), value)) {
            return
        }
        this._tokensMap.set(authSecret, value);
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

    async getAccessToken(authSecret: string, resource?: string): Promise<string> {
        let tokens = this._tokensMap.get(authSecret);
        if (!tokens) throw new Error('No tokens for user. Not logged in.');
        if (tokens.access_token && tokens.expires_on && tokens.expires_on.valueOf() > Date.now()) { return tokens.access_token }
        if (tokens.refresh_token) {
            let tokens = await this.refreshTokens(authSecret);
            return tokens.access_token;
        }
        throw new Error('No access token available');
    }

    async generateSecretKey(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            randomBytes(48, (err, buf) => {
                if (err) reject('Could not generate secret');
                resolve(buf.toString('hex'));
            });
        });
    }

    // gets tokens from authorization code
    async getUserAuthSecretFromCode(code: string): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            try {
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
                if (res.status !== 200) { reject('get token failed.'); }
                var data = await res.json();
                if (data['expires_in']) {
                    let expires = new Date(Date.now() + data['expires_in'] * 1000);
                    data['expires_on'] = expires.getTime();
                }
                data['auth_secret'] = await this.generateSecretKey();
                let tokens = new AuthTokens(data);
                this.setTokensForUserAuthSecret(tokens.auth_secret, tokens);
                resolve( tokens.auth_secret);
            }
            catch (err) { reject(err);  }
        });
    }


    // updates access token using refresh token
    async refreshTokens(authSecret: string): Promise<AuthTokens> {
        return new Promise<AuthTokens>(async (resolve, reject) => {
            try {
                let tokens = this.getTokensFromUserAuthSecret(authSecret);
                if (!tokens) throw new Error('No token for that authSecret.');
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
                if (res.status !== 200) { reject('get token failed.'); }
                var data = await res.json();
                if (data['expires_in']) {
                    let expires = new Date(Date.now() + data['expires_in'] * 1000);
                    data['expires_on'] = expires.getTime();
                }
                data['auth_secret'] = tokens.auth_secret;
                let refreshedTokens = new AuthTokens(data);
                this.setTokensForUserAuthSecret(refreshedTokens.auth_secret, refreshedTokens);
                resolve(refreshedTokens);
            }
            catch (err) { reject(err); }
        });
    }
}

export declare interface AuthManager {
    on(event: 'refreshed', listener: () => void): this;
    emit(event: 'refreshed'): boolean
    // on(event: string, listener: Function): this;
    // emit(event: string | symbol, ...args : any[]) : boolean;
}
