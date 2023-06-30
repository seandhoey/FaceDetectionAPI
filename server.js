// Purposely using deprecated package "bcrypt-nodejs" for simplicity
import bcrypt from 'bcrypt-nodejs';
import express from 'express';
import cors from 'cors';
import knex from 'knex';

const TESTING = true;
const PORT = 3001;

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
if(TESTING) app.use(cors());
app.listen(PORT, () => {
  console.log("Server is listening on port " + PORT);
});

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1', //localhost
    user : 'postgres', //default user
    port: 5432, //default port
    password : 'brainiac', //should this be here in plain text?
    database : 'facedetect'
  }
});

// TODO test
var result = db.select('id','name').from('users');
console.log('users', result);

// TODO replace with real postgresql
const tempDatabase = {
  users: [
    {
      id: 321,
      name: "Anthony",
      email: "a@test.com",
      password: "123",
      detectCount: 0,
      joined: new Date()
    },
    {
      id: 654,
      name: "Bob",
      email: "b@test.com",
      password: "456",
      detectCount: 0,
      joined: new Date()
    },
  ]
};

// Verbose logger for testing
app.use((req, res, next) => {
  if (TESTING) {
    console.log("___________________________________________________________________");
    console.log(">>>I heard a client request");
    console.log("\n>>>headers", req.headers);
    console.log("\n>>>method", req.method);
    console.log("\n>>>url", req.url);
    console.log("\n>>>query", req.query);
  }
  next();
});

// Placeholder for testing
app.get('/', (req, res) => {
  res.status(200).send(tempDatabase.users[0]);
  // res.status(200).send('test');
});

// Get specific user based on ID
app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  console.log(id);
  let found = false;
  tempDatabase.users.forEach(user => {
    if (user.id.toString() === id) {
      found = true;
      return res.status(200).json(user);
    }
  });
  if (!found) res.status(404).json('No user found');
});

// Update specific users' detectCount
app.put('/detect', (req, res) => {
  console.log("\n>>>body", req.body);
  const { id } = req.body;
  let found = false;
  tempDatabase.users.forEach(user => {
    if (user.id === id) {
      found = true;
      user.detectCount++;
      return res.status(200).json(user.detectCount);
    }
  });
  if (!found) res.status(404).json('No user found');
});

// Log In page submission
// Use Post so that the data is in encrypted json over https
app.post('/signin', (req, res) => {
  console.log("\n>>>body", req.body);
  // TODO Load hash from db
  // TODO implement bcrypt
  // bcrypt.compare("bacon", hash, function (err, res) {
  //   // res = true
  // });
  // TODO change to database, iterate over list
  if (req.body.email === tempDatabase.users[0].email
    && req.body.password === tempDatabase.users[0].password) {
      res.status(200).json(tempDatabase.users[0]);
  }
  else {
    res.status(400).json('Bad credentials');
  }
});

// Register page submission
app.post('/register', (req, res) => {
  try {
    // Should not actually log the password anywhere
    console.log("\n>>>body", req.body);
    const { email, name, password } = req.body;
    // TODO implement bcrypt
    // bcrypt.hash(password, null, null, function (err, hash) {
    //   console.log(hash);
    //   // TODO Store hash in db
    // });
    tempDatabase.users.push({
      id: 987,
      user: name,
      email: email,
      password: password,
      detectCount: 0,
      joined: new Date()
    });
    res.status(200).json(tempDatabase.users[tempDatabase.users.length - 1]);
  }
  catch (error) {
    res.status(400).json('Registration failure');
  }
});