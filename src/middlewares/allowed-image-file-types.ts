import { RequestHandler } from 'express';
import { getMimeTypeImage, mimeTypesImages } from '@/helpers/get-mime-type';

const ALLOWED_MIME_TYPES_IMAGES = Object.values(mimeTypesImages);

const allowedFileTypesImagesMiddleware: RequestHandler = (req, res, next) => {
  const { filename } = req.params;
  const mimetype = getMimeTypeImage(filename);

  if (ALLOWED_MIME_TYPES_IMAGES.includes(mimetype)) {
    next();
  } else {
    res
      .status(403)
      .json({ message: 'Forbidden: File type not allowed', statusCode: 403 });
  }
};

export default allowedFileTypesImagesMiddleware;
