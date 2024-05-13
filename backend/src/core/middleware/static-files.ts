import express, { Express } from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const useStaticFiles = (app: Express) => {
  app.use(express.static(path.join(__dirname, 'dist')));
};
