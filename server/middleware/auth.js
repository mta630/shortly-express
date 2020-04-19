const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {

  Promise.resolve(req.cookies.shortlyid)
  .then((hash) => {
    if (!hash) {
      throw hash;
    }
    return models.Sessions.get({hash});
  })
  .then((sessionData) => {
    if (!sessionData) {
      throw sessionData;
    }
    req.session = sessionData;
  })
  .then(() => {
    next();
  })
  .catch(() => {
    models.Sessions.create()
    .then((data) => {
      return models.Sessions.get({id: data.insertId})
    })
    .then((sessionData) => {
      res.cookie('shortlyid', sessionData.hash);
      req.session = sessionData;
      console.log("req.session =========", req.session);
    })
    .then(() => {
      next();
    })
  })
};

  // we will have to access req.cookies

  //cookies do not exist
  // if (!req.cookies.shortlyid) {
  //   models.Sessions.create()
  //   .then((newSession) => {
  //     return models.Sessions.get({id: newSession.insertId});
  //   })
  //   .then((data) => {
  //     req.session = data;
  //     res.cookie('shortlyid', req.session.hash);
  //   })
  //   .then(() => {
  //     next();
  //   })
  // } else {
  //   var hash = req.cookies.shortlyid;
  //   return models.Sessions.get({hash})
  //   .then((data) => {
  //     if (!data) {
  //       return models.Sessions.create()
  //       .then((data) => {
  //         var id = data.insertId;
  //         return models.Sessions.get({id})
  //       })
  //       .then((sessionRow) => {
  //         res.cookie('shortlyid', sessionRow.hash);
  //         req.session = sessionRow;
  //         next();
  //       })
  //     }
  //     req.session = data;
  //     next();
  //   })
  // }



  // if


/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/


module.exports.verifySession = (req, res, next) => {

  if(!models.Sessions.isLoggedIn(req.session)) {
    res.redirect('/login')
  } else {
    next();
  }
};