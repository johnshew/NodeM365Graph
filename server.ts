import * as _debug from 'debug';
let debug = _debug('server');

import * as restify from 'restify';
import * as uuid from 'uuid';

// Setup restify server
export function create(config: any, callback?: () => void) {

    console.log ('Setup server at ' + config);

    let server = restify.createServer();

    server.use(restify.plugins.bodyParser());
    server.use(restify.plugins.queryParser())

    // Make it a web server
    server.get('/', (req, res, next) => {
        res.redirect('./public/test.html', next);
    });


    server.get('/api/v1.0/hello', async (req, res, next) => {
        res.send('hello');
        return next();
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

    server.get("/public/*", 
        restify.plugins.serveStatic({directory: __dirname + '/..'})
    );

    server.listen(
        config, () => {
        console.log(`Server listening on ${server.url}`);
        if (callback) callback();
    });

    return server;
}
