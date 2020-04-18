


const parseCookies = (req, res, next) => {

// we can check for cookies in the header
// we should probably find a way to console log the cookies
// so that we can figure out how to get the data we want
//
// during this function we will be assigning an object to the
// cookie property on the request
//
// some documentation can be found in req.cookies below
// https://expressjs.com/en/api.html
//
// if we get stuck we can look up cookie parser middleware examples

if (!req.headers.cookie) {
  req.cookies = {};
  next();
  return;
} else {
  var result = {};
  var cookArr = req.headers.cookie.split('; ');
  cookArr.forEach((cook) => {
    var cookiePair = cook.split('=');
    result[cookiePair[0]] = cookiePair[1];
  })

  req.cookies = result;

  // console.log(req.cookies);
  next();
}
};

module.exports = parseCookies;