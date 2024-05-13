import { Router } from 'express';
import { AuthController } from './auth.js';

const router = Router();

// middleware that is specific to this router
router.use(function (req, res, next) {
  const ip =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.socket ? req.socket.remoteAddress : null);
  console.log(ip, '/api/auth', req.method, req.url);
  next();
});

router.route('/login').post(AuthController.logon).get(AuthController.loggedon);

router.route('/logout').post(AuthController.logout);

export default router;
