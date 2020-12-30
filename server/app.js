import express from 'express';
import mongoose from 'mongoose';
import routes from './routes';
import bodyParser from 'body-parser';
import path from 'path';

// Check alternative_db.js for localhost connection

const uri = 'mongodb://localhost:27017/google-marker';

mongoose.connect(uri, () => {
  console.log('Connected to MongoDB...');
  console.log('');
});

const app = express();

app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

// Middelware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
console.log('here');
console.log(express.static(__dirname + '/assets'));
app.use('/assets', express.static(__dirname + '/assets'));
app.use('/api', routes);
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/views/index.html'));
});

export default app;

console.log('Executing Server: app.js ...');
