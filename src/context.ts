import { YogaInitialContext } from 'graphql-yoga';
import prisma from './prisma/prisma';
import { getTokenFromRequest } from './helpers/auth';
import jwt from 'jsonwebtoken';

export type ContextValue = {
  prisma: typeof prisma;
  token: string | null;
  me: jwt.JwtPayload | null;
} & YogaInitialContext;

export async function createContext({
  request,
}: YogaInitialContext): Promise<ContextValue> {
  return { prisma, token: await getTokenFromRequest(request) } as ContextValue;
}
