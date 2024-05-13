import { Express, Request, Response } from 'express';

import fs from 'fs';
import path from 'path';
import authRoutes from '../../features/auth/authRoutes.js';
import { NGXLogger } from '../../ngxlogger/ngxlogger.js';
import { DefaultMudConfig } from '../config/default-mud-config.js';

export const useRoutes = (app: Express, mudConfig: typeof DefaultMudConfig) => {
  const logger = NGXLogger.getInstance();

  app.use('/api/auth', authRoutes);

  app.get('/socket.io-client/dist/*', (req: Request, res: Response) => {
    const mypath = req.path.substr(0);
    const ip =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.socket ? req.socket.remoteAddress : null);
    logger.addAndShowLog('SRV:' + ip, 'DEBUG', 'socket-Path:', [mypath]);
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
    logger.addAndShowLog('SRV:' + ip, 'DEBUG', 'manifest:', [manif]);
    fs.readFile(path.join(__dirname, 'dist', manif), function (err, data) {
      if (err) {
        res.sendStatus(404);
      } else {
        // modify the data here, then send it
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
    logger.addAndShowLog('SRV:' + ip, 'DEBUG', 'mud_config.json', []);
    res.json(mudConfig);
    res.status(200);
  });

  app.get('/ace/*', (req, res) => {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.socket ? req.socket.remoteAddress : null);
    const mypath = req.path.substr(5);
    logger.addAndShowLog('SRV:' + ip, 'DEBUG', 'ace-Path:', [mypath]);
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
    logger.addAndShowLog('SRV:' + ip, 'DEBUG', 'dist/index.html-Path:', [
      req.path,
    ]);
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });
};
