
import * as httpServer from './server';
export let server = httpServer.create(process.env.port || process.env.PORT || 8080);
