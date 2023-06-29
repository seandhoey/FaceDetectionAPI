import express from 'express';

const VERBOSE = false;
const PORT = 3000;

const app = express();
app.listen(3000, () => {
  console.log("Server is listening on port 3000")
});

// Verbose Logger
app.use((req, res, next) => {
  if(VERBOSE){
    console.log("___________________________________________________________________");
    console.log(">>>I heard a client request");
    console.log("\n>>>headers", req.headers);
    console.log("\n>>>method", req.method);
    console.log("\n>>>url", req.url);
    console.log("\n>>>query", req.query);
    next();
  }
});

app.get('/', (req, res) =>{
  res.send('test');
});

app.post('/signin', (req, res) =>{
  res.send('signin');
});

app.post('/register', (req, res) =>{
  res.send('register');
});




// Rough API plan
/*
GET   /                 --> test
POST  /signin           --> success/fail
POST  /register         --> new user object/fail
GET   /profile/:userid  --> user object for userid
PUT   /image            --> update user count
*/