import express, { Express } from 'express';
import path from 'path';
import { Environment } from '../environment/environment.js';

export const useStaticFiles = (app: Express, folder: string) => {
  app.use(
    express.static(path.join(Environment.getInstance().projectRoot, folder)),
  );
};
