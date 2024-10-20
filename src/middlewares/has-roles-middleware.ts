import { RequestHandler } from 'express';
import { verifyAccessToken } from '@/helpers/auth';
import { createCookieHandler } from '@/utils/express/create-cookie-handler';
import { Role } from '@prisma/client';

export function hasRoles(roles: Role[], requiredRoles: Role[]): boolean {
  return requiredRoles.some(r => roles.includes(r));
}

const hasRolesMiddleware =
  (roles: Role[]): RequestHandler =>
  async (req, res, next) => {
    const { cookieStore } = createCookieHandler(req, res);

    const accessToken = await cookieStore.get({ name: 'accessToken' });
    const token = accessToken?.value;

    if (!token) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: No token provided', statusCode: 401 });
    }

    let verified = null;

    try {
      verified = verifyAccessToken(token);

      if (hasRoles(verified?.roles, roles)) {
        return next();
      } else {
        return res
          .status(403)
          .json({ message: 'Forbidden: No privileges', statusCode: 403 });
      }
    } catch (error: unknown) {
      return res.send(error);
    }
  };

export default hasRolesMiddleware;
