import * as http from 'http';
import * as fetch from 'node-fetch';
import { AuthTokens, ServerAuth} from './simpleAuth';

export class GraphHelper {
    // const app reg details  
    constructor (private serverAuth : ServerAuth) {}

    private async  graphFetchHelper(url: string, accessToken: string): Promise<any> {
        let response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            }
        });
        let data = await response.json();
        return data;
    }

    public async get(url: string, authResult: AuthTokens): Promise<[any, AuthTokens | null]> {
        let [accessToken, updatedAuthResult] = await this.serverAuth.getAccessToken(authResult);
        let data = accessToken ? await this.graphFetchHelper(url, accessToken) : null;
        return [data, updatedAuthResult]
    }
}
