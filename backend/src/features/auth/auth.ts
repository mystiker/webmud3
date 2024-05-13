import { RPCClient } from '../websockets/rpc-client.js';

export const AuthController = {
  logon: function (req, res) {
    if (req.body) {
      // TODO captcha...
      console.log('AuthController->logon ', req.body.logonname);
      RPCClient.getInstance().logon(
        req.body.logonname,
        req.body.password,
        function (err, result) {
          if (err) {
            res.status(401).send(err); // Bad request.
          } else if (typeof result === 'string') {
            res.status(403).send(result); // Wrong pw/auth error
          } else {
            req.session.user = {
              logonname: result.name,
              adminp: result.adminp,
            };
            res
              .status(201)
              .send({ logonname: result.name, adminp: result.adminp });
          }
        },
      );
    } else {
      // TODO logging icl. real_ip!!
      res.status(400).send({
        // Bad request.
        msgid: 'AUC02',
        msg: 'You need a html body.',
        msgclass: 'htmlError',
      });
    }
  },

  loggedon: function (req, res) {
    req.session.user
      ? res
          .status(201)
          .send({ loggedIn: true, adminp: req.session.user.adminp })
      : res.status(201).send({ loggedIn: false, adminp: false });
  },

  logout: function (req, res) {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).send('Could not log out.');
      } else {
        res.status(201).send({ loggedOut: true });
      }
    });
  },
};