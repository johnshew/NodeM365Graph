import * as http from 'http';
import * as fetch from 'node-fetch';
import { AuthTokens, ServerAuth } from './simpleAuth';

export class GraphHelper {
    // const app reg details  
    constructor(private serverAuth: ServerAuth) { }

    private async  graphFetchHelper(url: string, accessToken: string): Promise<any> {
        let response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            }
        });
        if (response.status == 200) {
            let data = await response.json();
            return data;
        }
        return null;
    }

    public async get(url: string, authToken: AuthTokens): Promise<[any, AuthTokens | null]> {
        let [accessToken, updatedAuthToken] = await this.serverAuth.getAccessToken(authToken);
        let data = accessToken ? await this.graphFetchHelper(url, accessToken) : null;
        return [data, updatedAuthToken]
    }
}
