import { ResolversComposition } from '@graphql-tools/resolvers-composition';
import { GraphQLError, GraphQLFieldResolver } from 'graphql';
import { ContextValue } from '../../context';
import { verifyAccessToken } from '../../helpers/auth';
import { ErrorCode } from '../../helpers/error-codes';

export const isAuthenticated =
  (): ResolversComposition<GraphQLFieldResolver<any, ContextValue, any>> =>
  next =>
  async (parent, args, ctx, info) => {
    if(!ctx.token) {
      throw new GraphQLError('Необходима авторизация!', { extensions: { code: ErrorCode.UNAUTHENTICATED } });
    }

    try {
      const decoded = verifyAccessToken(ctx.token);
      ctx.me = decoded;
    } catch(err) {
      throw err;
    }

    return next(parent, args, ctx, info);
  };

export const isAdmin =
  (): ResolversComposition<GraphQLFieldResolver<any, ContextValue, any>> =>
  next =>
  async (parent, args, ctx, info) => {
    const me = ctx.me;

    const user = await ctx.prisma.user.findUnique({
      where: {
        id: me!.id,
      },
    });

    if (user!.role !== 'ADMIN') {
      throw new GraphQLError('Нет прав!', { extensions: { code: ErrorCode.UNAUTHENTICATED } });
    }

    return next(parent, args, ctx, info);
  };

export const isManager =
  (): ResolversComposition<GraphQLFieldResolver<any, ContextValue, any>> =>
  next =>
  async (parent, args, ctx, info) => {
    const me = ctx.me;
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: me!.id,
      },
    });

    if (user!.role !== 'MANAGER') {
      throw new GraphQLError('Нет прав!', { extensions: { code: ErrorCode.UNAUTHENTICATED } });
    }

    return next(parent, args, ctx, info);
  };
