import { RequestHandler } from 'express';
import { verify } from '../helpers/authenticate-user';
import jwt from 'jsonwebtoken';
import { createCookieHandler } from '../utils/express/create-cookie-handler';

const isAdminMiddleware: RequestHandler = async (req, res, next) => {
  const { cookieStore, applyChanges } = createCookieHandler(req, res);

  const authorization = await cookieStore.get({ name: 'authorization' });
  const token = authorization?.value;

  if (!token) {
    return res.status(401).send('Unauthorized: No token provided');
  }

  let verified = null;

  try {
    verified = (await verify(
      token as string,
      import.meta.env.VITE_SECRET,
    )) as jwt.JwtPayload;

    if (verified?.role === 'ADMIN') {
      return next();
    } else {
      return res.status(403).send('Forbidden: Admin access required');
    }
  } catch (error: unknown) {
    console.log({ error });
    await cookieStore.delete('authorization');
    applyChanges();

    return res.status(403).send('Forbidden: Verification failed');
  }
};

export default isAdminMiddleware;
