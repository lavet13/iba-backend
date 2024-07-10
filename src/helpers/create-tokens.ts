import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

export const ACCESS_TOKEN_TTL = 5 * 1000; // 10 minutes
export const REFRESH_TOKEN_TTL = 10 * 1000; // 7 days

const createTokens = (user: User) => {
  const { id, role } = user;

  const jwtSecret = import.meta.env.VITE_JWT_SECRET;
  const refreshSecret = import.meta.env.VITE_REFRESH_TOKEN_SECRET;

  const accessToken = jwt.sign({ id, role }, jwtSecret, { expiresIn: '5s' });

  const refreshToken = jwt.sign({ id }, refreshSecret, { expiresIn: '10s' });

  return { accessToken, refreshToken };
};

export default createTokens;
