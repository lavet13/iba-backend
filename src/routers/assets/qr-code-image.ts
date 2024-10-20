import path from 'path';
import { Router } from 'express';
import allowedFileTypesImagesMiddleware from '@/middlewares/allowed-image-file-types';
import hasRolesMiddleware from '@/middlewares/has-roles-middleware';
import { Role } from '@prisma/client';

// import { getMimeTypeImage } from '../helpers/get-mime-type';
// import fs from 'fs';

export default function qrCodeImage() {
  const router = Router();

  router.get(
    '/:filename',
    hasRolesMiddleware([Role.MANAGER, Role.ADMIN]),
    allowedFileTypesImagesMiddleware,
    async (req, res) => {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'assets', 'qr-codes', filename);

      return res.sendFile(filePath, err => {
        if (err) {
          console.error('Error sending file: ', err);
          res.status(404).json({ message: 'File not found', statusCode: 404 });
        }
      });

      // const { filename } = req.params;
      // const filePath = path.join(process.cwd(), 'assets', 'qr-codes', filename);
      //
      // try {
      //   const fileData = await fs.promises.readFile(filePath);
      //   const mimetype = getMimeTypeImage(filename);
      //
      //   res.setHeader('Content-Type', mimetype);
      //   res.send(fileData);
      // } catch (err) {
      //   res.status(404).send('File not found!');
      // }
    },
  );

  return router;
}
