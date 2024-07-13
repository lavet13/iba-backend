import jwt from 'jsonwebtoken';
import ms from 'ms';
import { User } from '@prisma/client';

export const ACCESS_TOKEN_TTL = 10 * 60 * 1000; // 10 minutes
export const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const createTokens = (user: User) => {
  const { id, role } = user;

  const jwtSecret = import.meta.env.VITE_JWT_SECRET;
  const refreshSecret = import.meta.env.VITE_REFRESH_TOKEN_SECRET;

  const accessToken = jwt.sign({ id, role }, jwtSecret, {
    expiresIn: ms(ACCESS_TOKEN_TTL),
  });

  const refreshToken = jwt.sign({ id }, refreshSecret, {
    expiresIn: ms(REFRESH_TOKEN_TTL),
  });

  return { accessToken, refreshToken };
};

export default createTokens;
