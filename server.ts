import * as _debug from 'debug';
let debug = _debug('server');

import * as restify from 'restify';
import * as uuid from 'uuid';

import { AuthManager } from './simpleAuth';
import { GraphHelper } from './graphHelper';
import { Server } from 'http';

var id = process.env.AppClientId;
var pwd = process.env.AppClientSecret;
if (!id || !pwd) { throw new Error('No app credentials.'); process.exit(); }

var serverUrl = 'http://localhost:8080';
var authUri = serverUrl + '/auth';
var defaultScopes = ['openid', 'offline_access', 'mail.read', 'tasks.read', 'user.readwrite'];

let authManager = new AuthManager(id, pwd, authUri, defaultScopes);
let graphHelper = new GraphHelper();

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

    server.get("/public/*", restify.plugins.serveStatic({ directory: __dirname + '/..' }));

    server.get('/login', (req, res, next) => {
        console.log('Request for ' + req.url);
        res.redirect(authManager.authUrl(), next);
    });

    server.get('/auth', async (req, res, next) => {
        console.log("Request for " + req.url);

        try {
            // look for authorization code coming in (indicates redirect from interative login/consent)
            var code = req.query['code'];
            if (code) {
                let userAuthSecret = await authManager.getUserAuthSecretFromCode(code)
                res.header('Set-Cookie', 'userId=' + userAuthSecret + '; expires=' + new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString());
                var location = req.query['state'] ? decodeURI(req.query['state']) : '/';
                res.redirect(location, next);
                res.end();
                return;
            }
        }
        catch (reason) { console.log('Error in /auth processing: ' + reason) }
        res.setHeader('Content-Type', 'text/html');
        res.end('<html><head></head><body>Request to authorize failed<br/><a href="/">Continue</a></body></html>');
        next();
        return;
    });

    server.get('/mail', async (req, res, next) => {
        try {
            console.log("Request for " + req.url);
            let accessToken = await authManager.getAccessToken(getCookie(req, 'userId'));            
            let data = await graphHelper.get(accessToken, 'https://graph.microsoft.com/v1.0/me/messages');
            if (data) {
                res.header('Content-Type', 'text/html');
                res.write(`<html><head></head><body><h1>Mail</h1>`);
                data.value.forEach(i => {
                    res.write(`<p>${i.subject}</p>`);
                });
                res.end(`</body></html>`);
                next();
                return;
            }
            res.setHeader('Content-Type', 'text/html');
            res.end('<html><head></head><body>Request to graph failed<br/><a href="/">Continue</a></body></html>');
            next();
            return;
        }
        catch (err) { }
        res.setHeader('Content-Type', 'text/html');
        res.end('<html><head></head><body>Not authorized<br/><a href="/">Continue</a></body></html>');
        next();
        // Could also send them back to authorize.
    });

    server.get('/tasks', async (req, res, next) => {
        try {
            console.log("Request for " + req.url);
            let accessToken = await authManager.getAccessToken(getCookie(req, 'userId'));            
            let data = await graphHelper.get(accessToken, 'https://graph.microsoft.com/beta/me/outlook/tasks');
            if (data && data.value) {
                res.header('Content-Type', 'text/html');
                res.write(`<html><head></head><body><h1>Tasks</h1>`);
                data.value.forEach(i => {
                    res.write(`<p>${i.subject}</p>`);
                });
                res.end(`</body></html>`);
                next();
                return;
            }
            // if you get here there was a send problem
            res.setHeader('Content-Type', 'text/html');
            res.end('<html><head></head><body>Request to graph failed<br/><a href="/">Continue</a></body></html>');
            next();
            return;
        } catch (err) { }
        res.setHeader('Content-Type', 'text/html');
        res.end('<html><head></head><body>You need to be logged in. <a href="/login">login</a></body></html>');
        next();
        // Could also send them back to authorize.
    });

    server.get('/profile', async (req, res, next) => {
        try {
            console.log("Request for " + req.url);
            let accessToken = await authManager.getAccessToken(getCookie(req, 'userId'));            
            let data = await graphHelper.get(accessToken,'https://graph.microsoft.com/v1.0/me/extensions/net.shew.nagger');
            if (data) {
                res.header('Content-Type', 'text/html');
                res.write(`<html><head></head><body><h1>User extension net.shew.nagger</h1>`);
                res.write(`<p> ${JSON.stringify(data)} </p>`);
                res.end(`</body></html>`);
                next();
                return;
            }
            // if you get here there was a send problem
            res.setHeader('Content-Type', 'text/html');
            res.end('<html><head></head><body>Request to graph failed<br/><a href="/">Continue</a></body></html>');
            next();
            return;
        } catch (err) { }
        res.setHeader('Content-Type', 'text/html');
        res.end('<html><head></head><body>Not authorized<br/><a href="/">Continue</a></body></html>');
        next();
        // Could also send them back to authorize.
    });

    server.get('/update', async (req, res, next) => {
        try {
            console.log("Request for " + req.url);
            let accessToken = await authManager.getAccessToken(getCookie(req, 'userId'));            
            await graphHelper.patch(accessToken, 'https://graph.microsoft.com/v1.0/me/extensions/net.shew.nagger', { time: new Date().toISOString() });
            res.end(`<html><head></head><body><h1>User extension net.shew.nagger</h1><p>Updated</p></body></html>`);
            next();
            return;
        }
        catch (err) { }
        res.setHeader('Content-Type', 'text/html');
        res.end('<html><head></head><body>Not authorized<br/><a href="/">Continue</a></body></html>');
        next();
        // Could also send them back to authorize.
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
    var rc = req.header('cookie');

    rc && rc.split(';').forEach(cookie => {
        var parts = cookie.split('=');
        var name = parts.shift();
        if (name) list[name] = decodeURI(parts.join('='));
    })

    return (key && key in list) ? list[key] : null;
}