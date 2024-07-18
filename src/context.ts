import jwt from 'jsonwebtoken';
import { YogaInitialContext } from 'graphql-yoga';
import prisma from './prisma/prisma';
import { getTokenFromRequest } from './helpers/get-token-from-request';
import { pubSub } from './pubsub';

export type ContextValue = {
  prisma: typeof prisma;
  token: string | null;
  me: jwt.JwtPayload | null;
  pubSub: typeof pubSub;
} & YogaInitialContext;

export async function createContext({
  request,
}: YogaInitialContext): Promise<ContextValue> {
  return {
    prisma,
    token: await getTokenFromRequest(request),
    pubSub,
  } as ContextValue;
}
