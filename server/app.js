const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const cookies = require('./middleware/cookieParser.js');

const app = express();

//sets and uses functions for all of the app.get and app.post endpoints
app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookies);
app.use(Auth.createSession);

app.get('/',
(req, res) => {
  res.render('index');
});

app.get('/create',
(req, res) => {
  res.render('index');
});

// app.get('/signup',
// (req, res) => {
//   res.render('signup');
// });

// app.get('/login',
// (req, res) => {
//   res.render('login');
// });

app.get('/links',
(req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post('/links',
(req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

// DOCS FOR ROUTING IN EXPRESS
// ------------------------------------------
// https://expressjs.com/en/guide/routing.html
//
// WE WILL NEED TO ADD AN app.post FOR /signup
// parameter
// Inside of this method we will need to use a models.Users method
// We will need to check if they already have an account
//
//  if they dont we can run models.Users.create
//  models.Users is in a Promise format (we can use .then())
//  this means that will be returning models.users.create
//  the format for this method is create({username, password})
//
//  We should keep in mind that res.redirect is a thing and will // // probably nee to be implemented in here for a few edge cases
//
// possible end conditions for res.redirect or res.send
// -------------------------------------
// 0 The user finishes signing up without error - redirect to index
// 1 there is an error - send an error response
// 2 there is already a user by that name - redirect to signup

app.post('/signup', (req, res, next) =>{
  var username = req.body.username;
  var password = req.body.password;

  models.Users.get({username})
  .then((data) => {
    if (data) {
      // user has an account already
      throw data;
    }
    models.Users.create({username: username, password: password})
    .then((data) => {
      return models.Sessions.update({hash: req.session.hash}, {userId: data.insertId})
    })
    .then((data2) => {
      res.redirect('/');
      next();
    })
  })
  .catch((data) => {
    res.redirect('/signup');
    next();
  })
});

app.post('/login', (req, res, next) => {
  var username = req.body.username;
  var password = req.body.password;

  models.Users.get({username})
  .then((user) => {

    //if user doesn't exist or if pw is invalid
    if (!user || !models.Users.compare(password, user.password, user.salt)) {
      res.status(403).redirect('/login');
    } else {
        return models.Sessions.update({hash: req.session.hash}, {userId: user.id})
        .then((data) => {
          var hash = req.session.hash;
          return models.Sessions.get({hash})
        })
        .then((data) => {
          req.session = data;
          res.redirect('/');
          next();
        })
      }
  });
});
// AND AN app.post for /login
//
//  models.Users.get is a promise type method
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//  we will need to use models.Users.get to retrieve the correct
//  user data from the system. This should be send in the req.body
//
//  the action above will give us some kind of user data
//  we can then use models.users.compare to see if the login
//   credentials match what is in the record
//
//  possible end conditions for response
// ----------------------------------------------------------------
// 0 The user has successfull credentials and is redirected to home
// 1 the user has incorrect credentials and is redirected to login  // again with an res.status of (look up correct error code later    // mike)



/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
