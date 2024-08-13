import jwt from 'jsonwebtoken';
import ms from 'ms';
import { User, Role } from '@prisma/client';

export type UserWithRoles = User & {
  roles: { role: Role }[];
};

export const ACCESS_TOKEN_TTL = 10 * 60 * 1000; // 10 minutes
export const REFRESH_TOKEN_TTL = 1000 * 60 * 60 * 24 * 30.44; // 1 month

const createTokens = (user: UserWithRoles) => {
  const { id, roles } = user;
  const userRoles = roles.map(r => r.role);
  console.log({ userRoles });

  const jwtSecret = import.meta.env.VITE_JWT_SECRET;
  const refreshSecret = import.meta.env.VITE_REFRESH_TOKEN_SECRET;

  const accessToken = jwt.sign({ id, roles: userRoles }, jwtSecret, {
    expiresIn: ms(ACCESS_TOKEN_TTL),
  });

  const refreshToken = jwt.sign({ id }, refreshSecret, {
    expiresIn: ms(REFRESH_TOKEN_TTL),
  });

  return { accessToken, refreshToken };
};

export default createTokens;
