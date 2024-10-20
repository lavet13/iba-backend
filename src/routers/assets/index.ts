import { Router } from 'express';
import qrCodeImage from '@/routers/assets/qr-code-image';

export default function assets() {
  const router = Router();

  router.use('/qr-codes', qrCodeImage());

  return router;
}
