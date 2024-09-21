import { Router } from 'express';

export default function apiV1() {
  const router = Router();

  router
    .use((_, __, next) => {
      console.log('API V1');
      next();
    })
    .get('/', (_, res) => {
      res.json({ message: 'hello (p≧w≦q), this is api version 1' });
    });

  return router;
}
