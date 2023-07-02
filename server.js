import bcrypt from 'bcrypt-nodejs'; // Purposely using deprecated package for simplicity
import express from 'express';
import cors from 'cors';
import knex from 'knex';
import userEndpoints from './endpoints/userEndpoints.js'
import clarifaiEndpoints from './endpoints/clarifaiEndpoints.js'

// Server Configuration
const TESTING = true;
const PORT = 3001;
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
if (TESTING) app.use(cors());
app.listen(PORT, () => {
  console.log("Server is listening on port " + PORT);
});

// Database Connection
const db = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1', //localhost
    user: 'postgres', //default user
    port: 5432, //default port
    password: 'brainiac', //should this be here in plain text?
    database: 'facedetect'
  }
});

// Verbose logger for testing
app.use((req, res, next) => {
  if (TESTING) {
    console.log("___________________________________________________________________");
    console.log(">>>I heard a client request");
    console.log("\n>>>HEADERS: ", req.headers);
    console.log("\n>>>METHOD: ", req.method);
    console.log("\n>>>URL: ", req.url);
    console.log("\n>>>QUERY: ", req.query);
  }
  // Would do some SQL injection prevention here
  next();
});

// User Endpoints
app.get('/', (req, res) => { userEndpoints.getAllUsers(req, res, db); });

app.get('/profile/:id', (req, res) => { userEndpoints.getProfileByID (req, res, db); });

app.put('/detect', (req, res) => { userEndpoints.putIncrementDetect(req, res, db); });

app.post('/signin', (req, res) => { userEndpoints.postAuthenticateUser(req, res, db, bcrypt); });

app.post('/register', (req, res) => { userEndpoints.postRegisterUser(req, res, db, bcrypt); });

// Clarifai Endpoints
app.post('/facedetect', (req, res) => { clarifaiEndpoints.postClarifaiFaceDetection(req, res); });