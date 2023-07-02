// Website does not use this endpoint.
// Returns the current list of users in database.
export function getAllUsers(req, res, db) {
  db.select('name', 'email').from('users').then(users => {
    console.log("\n>>>EXISTING USERS:", users);
    res.status(200).send(users);
  });
}

// Website does not use this endpoint.
// Get specific user based on ID.
export function getProfileByID(req, res, db) {
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
};

// Increment the entries count for a specific user
export function putIncrementDetect(req, res, db) {
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
};

// Authenticates a user
export function postAuthenticateUser(req, res, db, bcrypt) {
  // Use Post so that the data is in encrypted json over https
  console.log("\n>>>BODY: ", req.body);
  const { email, password } = req.body;

  db('users')
    .select('users.*', 'login.hash')
    .join('login', 'users.id', '=', 'login.user_id')
    .where('users.email', '=', email)
    .then(user => {
      // Need bcrypt library to compare the hash
      const isMatch = bcrypt.compareSync(password, user[0].hash)
      if (isMatch) {
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
}

// Register a user
export function postRegisterUser(req, res, db, bcrypt) {
  // Should not actually log the password anywhere
  console.log("\n>>>BODY: ", req.body);
  const { email, name, password } = req.body;
  const hash = bcrypt.hashSync(password);

  // Ensure no empty fields
  if(!email || !name || !password){
    return res.status(400).json('Bad form submission');
  }

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
}

export default {
  getAllUsers,
  getProfileByID,
  putIncrementDetect,
  postAuthenticateUser,
  postRegisterUser
}