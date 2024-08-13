import { RequestHandler } from 'express';
import { verifyAccessToken } from '../helpers/auth';
import { createCookieHandler } from '../utils/express/create-cookie-handler';
import { Role } from '@prisma/client';

export function hasRoles(roles: Role[], requiredRoles: Role[]): boolean {
  return requiredRoles.some(r => roles.includes(r));
}

const hasRolesMiddleware = (roles: Role[]): RequestHandler  => async (req, res, next) => {
  const { cookieStore } = createCookieHandler(req, res);

  const accessToken = await cookieStore.get({ name: 'accessToken' });
  const token = accessToken?.value;

  if (!token) {
    return res.status(401).send('Unauthorized: No token provided');
  }

  let verified = null;

  try {
    verified = verifyAccessToken(token);

    if (hasRoles(verified?.roles, roles)) {
      return next();
    } else {
      return res.status(403).send('Forbidden: No privileges');
    }
  } catch (error: unknown) {
    return res.send(error);
  }
};

export default hasRolesMiddleware;
