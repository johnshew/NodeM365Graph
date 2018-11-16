import * as http from 'http';
import * as fetch from 'node-fetch';
import { AuthTokens, ServerAuth } from './simpleAuth';

export class GraphHelper {
    // const app reg details  

    constructor(private serverAuth: ServerAuth) { }

    public async get(url: string, authToken: AuthTokens): Promise<[any, AuthTokens | null]> {
        let [accessToken, updatedAuthToken] = await this.serverAuth.getAccessToken(authToken);
        let response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            }
        });
        if (response.status == 200) {
            let data = await response.json();
            return [data,updatedAuthToken];
        }
        return [null,null]
    }

    
    public async patch(url: string, body: any, authToken: AuthTokens): Promise<AuthTokens | null> {
        let [accessToken, updatedAuthToken] = await this.serverAuth.getAccessToken(authToken);
        let response = await fetch(url, {
            method : 'patch',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            },
            body: JSON.stringify(body)
        });
        if (response.status == 200 || response.status == 204) {
            return updatedAuthToken;
        }
        return null;
    }
}
