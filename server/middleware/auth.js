const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // we will have to access req.cookies
  req.session = {};
  // console.log('cookies', req.cookies);

  //cookies do not exist
  if (!req.cookies.shortlyid) {
    models.Sessions.create()
    .then((newSession) => {
      // console.log("data from sessions create = ", data);
      return models.Sessions.get({id: newSession.insertId});
    })
    .then((data) => {
      console.log('req.session', req.session);
      req.session = data;
      res.cookie('shortlyid', req.session.hash);
    })
    .then(() => {
      console.log('req.body', req.body);
      // req.session.username
      // req.session.userId
      next();
    })
    // create hash using Sessions.create()
  } else {
    //cookies exist
    var hash = req.cookies.shortlyid;

    //get user info
    models.Sessions.get({hash})
    .then((data) => {
      if (data) {
        // if data exists then we know its stored in our database
        req.session = data;
      } else {
        // if it doesn't exist then it is not a valid session
        // create a session (this is the user's info)
        models.Sessions.create()
        .then((data) => {
          // console.log('data', data.insertId);
          return models.Sessions.get({id: data.insertId});
        })
        .then((sessionRow) => {
          //clear and reassign a new cookie
          req.session = sessionRow;
          res.cookie('shortlyid', req.session.hash);
        })
        .done(() => {
          next();
        });
      }
      next();
    })
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

