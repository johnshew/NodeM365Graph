import * as _debug from 'debug';
let debug = _debug('server');

import * as restify from 'restify';
import * as uuid from 'uuid';

import { ServerAuth } from './simpleAuth';

var id = '84f9f67f-71e5-447b-9d4b-140fb58c6cc7';
var pwd = 'prrhHHX688#$smrVZMO40;:';
var uri = 'http://127.0.0.1:8080/';
var scp = ['openid', 'offline_access', 'mail.read'];

let serverAuth = new ServerAuth(id, pwd, uri);

// Setup restify server
export function create(config: any, callback?: () => void) {

    console.log('Setup server at ' + config);

    let server = restify.createServer();

    server.use(restify.plugins.bodyParser());
    server.use(restify.plugins.queryParser())



    // Make it a web server
    server.get('/', (req, res, next) => {
        res.redirect('./public/test.html', next);
    });

    server.get("/public/*",
        restify.plugins.serveStatic({ directory: __dirname + '/..' })
    );

    server.get('/api/v1.0/hello', async (req, res, next) => {
        res.send('hello');
        return next();
    });


    server.get('/*', async (req, res, next) => {
        if (req.url != "/favicon.ico") {
            console.log("Request for " + req.url);

            // look for authorization code coming in (indicates redirect from interative login/consent)
            var code = req.query['code'];
            if (code) {
                serverAuth.getTokenByAuthCode(code, scp).then(authResult => {
                    // cache the token and redirect to root
                    // NOTE: only caching refresh token, meaning we will go to server each time we need access token...not ideal
                    // NOTE: cookie token cache not ideal
                    // NOTE: cookie expiration set to 24 hours...this should likely be based on token expiration
                    res.writeHead(301, {
                        'Location': '/',
                        'Set-Cookie': 'tokenCache=' + authResult.refresh_token + '; expires=' + new Date(new Date().getTime() + 86409000).toUTCString()
                    }); 
                    res.end();
                });
            }
            else {
                // check token cache
                var refreshToken = getCookie(req, 'tokenCache');
                if (refreshToken != null) {
                    // check if cache is still good
                    serverAuth.getAccessTokenSilent(refreshToken, scp).then(authResult => {
                        // use the access token to call the graph for last high importance email
                        fetch('https://graph.microsoft.com/v1.0/me/messages', {
                            headers: {
                                'Accept': 'application/json',
                                'Authorization': 'Bearer ' + authResult.access_token
                            }
                        }).then(d => {
                            d.json().then((data) => {
                                res.writeHead(200, {
                                    'Content-Type': 'text/html',
                                    'Set-Cookie': 'tokenCache=' + authResult.refresh_token + '; expires=' + new Date(new Date().getTime() + 86409000).toUTCString()
                                });
                                res.end(`<html><head></head><body>Last email: ${data.value[0].subject}</body></html>`);
                            });
                        }, (err) => {
                            res.writeHead(200, {
                                'Content-Type': 'text/html'
                            });
                            res.end('<html><head></head><body>BAD</body></html>');
                        });

                    }, (err) => {
                        // refresh token is bad...redirect the user to interactive login for authorization code
                        res.writeHead(301, { 'Location': serverAuth.getAuthUrl(scp) });
                        res.end();
                    });
                }
                else {
                    // redirect the user to interactive login for authorization code
                    res.writeHead(301, { 'Location': serverAuth.getAuthUrl(scp) });
                    res.end();
                }
            }
        }
    });

    /*     
        server.post('/api/v1.0/something', async (req, res, next) => {
        //    let update = await remindersStore.update(reminder);
            res.header("Location", `/api/v1.0/reminders/something/new`);
            res.send(201, 'did something');
            next();
        });
    
        server.get('/api/v1.0/something/:id', async (req, res, next) => {
            if (!req.params.hasOwnProperty('id') || typeof req.params.id != "string") {
                res.send(400, "id not found");
                next();
                return;
            }
            // let result = await remindersStore.get(req.params.id);
            let result = undefined;
            if (!result) {
                res.send(404, "Not found.");
            } else {
                res.send('did something');
            }
            next();
        });
    
        server.put('/api/v1.0/reminders/:id', async (req, res, next) => {
            let id = undefined;
            if (!req.params.hasOwnProperty('id') && typeof req.params.id != "string") {
                res.send(400, "id not found");
                next();
                return;
            } else {
                id = req.params.hasOwnProperty('id');
            }
            let exists = id ? true : false;
            res.header("Location", `/api/v1.0/reminders/${id}`);
            res.send(exists ? 200 : 201, id);
            next();
        });
    
        server.patch('/api/v1.0/reminders/:id', async (req, res, next) => {
            let user = "j@s.c";
            if (!req.params.hasOwnProperty('id') && typeof req.params.id != "string") {
                res.send(400, "id not found");
                next();
                return;
            }
            let reminder = await remindersStore.get(req.params.id);
            let created = false;
            if (!reminder) {
                created = true;
                let result = null;
                reminder = new reminders.Reminder(req.body, true);
            } else {
                reminder.update(req.body);
            }
            let update = await remindersStore.update(reminder);
            res.send(created ? 201 : 200, reminder);
            next();
        });
    
        server.del('/api/v1.0/reminders/:id', async (req, res, next) => {
            let user = "j@s.c";
            if (!req.params.hasOwnProperty('id') && typeof req.params.id != "string") {
                res.send(400, "id not found");
                next();
                return;
            }
            let reminder = await remindersStore.get(req.params.id);
            if (!reminder) {
                res.send(401, "Not found")
            } else {
                await remindersStore.delete(reminder);
                res.send(200);
            }
            next();
        });
    
    */


    //    server.get(/\/public\/?.*/


    server.listen(
        config, () => {
            console.log(`Server listening on ${server.url}`);
            if (callback) callback();
        });

    return server;
}

function getCookie(req: restify.Request, key: string): string {
    var list = {};
    var rc = req.header['cookie'];

    rc && rc.split(';').forEach(cookie => {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    })

    return (key && key in list) ? list[key] : null;
}