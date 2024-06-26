import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { type SignOptions } from 'jsonwebtoken';

const createToken = (
  user: User,
  options?: SignOptions,
) => {
  const { id, role } = user;

  const signingKey = import.meta.env.VITE_SECRET;

  return jwt.sign({ id, role }, signingKey, options);
};

export default createToken;
