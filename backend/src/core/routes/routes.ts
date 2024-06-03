import { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// import authRoutes from '../../features/auth/auth-routes.js';
import { logger } from '../../features/logger/winston-logger.js';
import { MudConfig } from '../../shared/types/mud_config.js';
import { Environment } from '../environment/environment.js';

export const useRoutes = (app: Express, mudConfig: MudConfig) => {
  // app.use('/api/auth', authRoutes);

  app.get('/socket.io-client/dist/*', (req: Request, res: Response) => {
    const mypath = req.path.substr(0);

    const ip =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.socket ? req.socket.remoteAddress : null);

    logger.debug('Socket-Path:', { real_ip: ip, path: mypath });

    res.sendFile(path.join(__dirname, 'node_modules' + mypath));
  });

  app.get('/manifest.webmanifest', function (req: Request, res: Response) {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.socket ? req.socket.remoteAddress : null);

    let manif = 'manifest.webmanifest';

    switch (process.env.WEBMUD3_DISTRIBUTION_TYPE) {
      case 'unitopia-prod':
        manif = 'manifest.unitopia.webmanifest';

        break;
      case 'unitopia-test':
        manif = 'manifest.unitopia-test.webmanifest';

        break;
      case 'seifenblase':
        manif = 'manifest.seifenblase.webmanifest';

        break;
      default:
    }

    logger.debug('Manifest:', { real_ip: ip, manifest: manif });

    fs.readFile(path.join(__dirname, 'dist', manif), function (err, data) {
      if (err) {
        res.sendStatus(404);
      } else {
        res.send(data);
      }
    });
  });

  app.get('/config/mud_config.json', (req: Request, res: Response) => {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.socket ? req.socket.remoteAddress : null);

    logger.debug('mud_config.json', { real_ip: ip });

    res.json(mudConfig);

    res.status(200);
  });

  app.get('/ace/*', (req: Request, res: Response) => {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.socket ? req.socket.remoteAddress : null);

    const mypath = req.path.substr(5);

    logger.debug('ACE Path:', { real_ip: ip, path: mypath });

    res.sendFile(
      path.join(
        __dirname,
        'node_modules/ace-builds/src-min-noconflict/' + mypath,
      ),
    );
  });

  app.get('*', (req: Request, res: Response) => {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.socket ? req.socket.remoteAddress : null);

    logger.debug('wwwroot/index.html Path:', { real_ip: ip, path: req.path });

    res.sendFile(
      path.join(Environment.getInstance().projectRoot, 'wwwroot/index.html'),
    );
  });
};
