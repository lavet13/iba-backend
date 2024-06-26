import { getMimeTypeImage } from '../helpers/get-mime-type';
import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import allowedFileTypesImagesMiddleware from '../middlewares/allowed-image-file-types';
import isAdminMiddleware from '../middlewares/is-admin-middlware';

const router = Router();

router.get(
  '/:filename',
  isAdminMiddleware,
  allowedFileTypesImagesMiddleware,
  (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'assets', 'qr-codes', filename);

    try {
      const fileData = fs.readFileSync(filePath);
      const mimetype = getMimeTypeImage(filename);

      res.setHeader('Content-Type', mimetype);
      res.send(fileData);
    } catch (err) {
      res.status(404).send('File not found!');
    }
  },
);

export default router;
