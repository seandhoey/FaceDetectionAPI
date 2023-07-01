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
if (TESTING) app.use(cors());
app.listen(PORT, () => {
  console.log("Server is listening on port " + PORT);
});

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
  next();
});

// Placeholder for testing
app.get('/', (req, res) => {
  db.select('name', 'email').from('users').then(users => {
    console.log("\n>>>EXISTING USERS:", users);
    res.status(200).send(users);
  });
});

// Get specific user based on ID.
// Website does not use this endpoint.
app.get('/profile/:id', (req, res) => {
  const { id } = req.params;

  db('users')
    .select('*')
    .where({ id: id })
    .then(user => {
      if (user.length === 0) res.status(404).json('No user found')
      else res.status(200).json(user[0]);
    })
    .catch(err => {
      console.log("\n>>>ERROR: ", err);
      res.status(404).json('Query error')
    });
});

// Update specific users' detectCount
app.put('/detect', (req, res) => {
  console.log("\n>>>BODY: ", req.body);
  const { id } = req.body;

  db('users')
    .increment('entries', 1)
    .where({ id: id })
    .returning('entries')
    .then(entries => {
      if (entries.length === 0) res.status(404).json('No user found')
      else res.status(200).json(entries[0].entries);
    })
    .catch(err => {
      console.log("\n>>>ERROR: ", err);
      res.status(404).json('Query error')
    });
});

// Log In page submission
// Use Post so that the data is in encrypted json over https
app.post('/signin', (req, res) => {
  console.log("\n>>>BODY: ", req.body);
  const { email, password } = req.body;
  const hash = bcrypt.hashSync(password);

  db('users')
    .select('users.*', 'login.hash')
    .join('login', 'users.id', '=', 'login.user_id')
    .where('users.email', '=', email)
    .then(user => {
      // Need bcrypt library to compare the hash
      const isMatch = bcrypt.compareSync(password, user[0].hash)
      if(isMatch){
        // Send the user info back without the hash
        delete user[0].hash;
        res.status(200).json(user[0]);
      }
      else res.status(400).json('Login failure');
    })
    .catch(err => {
      console.log("\n>>>ERROR", err);
      res.status(400).json('Login failure');
    })
})

// Register page submission
app.post('/register', (req, res) => {
  // Should not actually log the password anywhere
  console.log("\n>>>BODY: ", req.body);
  const { email, name, password } = req.body;
  const hash = bcrypt.hashSync(password);

  // Returns a select of the successful insert for us to send to client
  // Inserts into users and login tables within one transaction
  // If the entire commit fails, changes roll back and send error.
  db.transaction(trx => {
    trx.insert({
      name: name,
      email: email,
      joined: new Date()
    })
      .into('users')
      .returning('id')
      .then(id => {
        return (
          trx('login')
            .insert({
              hash: hash,
              user_id: id[0].id
            })
        )
      })
      .then(trx.commit)
      .then(dbres => {
        console.log("\n>>>COMMIT RESPONSE: ", dbres);
        res.status(200).json("Registered");
      })
      .catch(err => {
        console.log("\n>>>ERROR: ", err);
        trx.rollback;
        res.status(400).json('Registration failure');
      })
  });
})