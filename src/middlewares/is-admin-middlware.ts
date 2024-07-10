import { RequestHandler } from 'express';
import { verifyAccessToken } from '../helpers/auth';
import { createCookieHandler } from '../utils/express/create-cookie-handler';

const isAdminMiddleware: RequestHandler = async (req, res, next) => {
  const { cookieStore } = createCookieHandler(req, res);

  const accessToken = await cookieStore.get({ name: 'accessToken' });
  const token = accessToken?.value;

  if (!token) {
    return res.status(401).send('Unauthorized: No token provided');
  }

  let verified = null;

  try {
    verified = verifyAccessToken(token);

    if (verified?.role === 'ADMIN') {
      return next();
    } else {
      return res.status(403).send('Forbidden: Admin access required');
    }
  } catch (error: unknown) {
    return res.send(error);
  }
};

export default isAdminMiddleware;
