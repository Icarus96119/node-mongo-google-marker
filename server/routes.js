import express from 'express';

// Controller imports
import locationController from './controllers/locationController';

const routes = express();

// Location routes
routes.post('/post', locationController.post);
routes.get('/get', locationController.get);

export default routes;

console.log('Executing Server: routes.js ...');
