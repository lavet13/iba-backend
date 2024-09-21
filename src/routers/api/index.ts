import { Router } from 'express';
import apiV1 from './v1';

export default function api() {
  const router = Router();

  router.use('/v1', apiV1());

  return router;
}
