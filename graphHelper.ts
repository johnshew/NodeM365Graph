import * as fetch from 'node-fetch';

export class GraphHelper {
    // const app reg details  

    public async get(accessToken : string, url: string): Promise<any> {
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
        throw new Error ('get failed');
    }

    
    public async patch(accessToken : string, url: string, body: any): Promise<void> {
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
          return;    
        }
        throw new Error('patch failed');
    }
}
