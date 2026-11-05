import { isString } from '@ircam/sc-utils';

export const kWsToken = Symbol('soundworks:helpers:ws-token');

export const httpAuthentication = (server) => {
  const auth = server.config.env.auth;

  if (!isString(auth.login)) {
    throw new Error('Invalid login for HTTP authentication: login is not a string');
  }

  if (!isString(auth.password)) {
    throw new Error('Invalid password for HTTP authentication: password is not a string');
  }

  return (req, res, next) => {
    // parse login and password from headers
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (login === auth.login && password === auth.password) {
      // generate token to be send to the client and pass it to next middleware
      res[kWsToken] = server.generateAuthToken(req);
      return next();
    }

    // show login / password modal
    res.writeHead(401, {
      'WWW-Authenticate':'Basic',
      'Content-Type':'text/plain',
    });

    res.end('Authentication required.');
  };
};
