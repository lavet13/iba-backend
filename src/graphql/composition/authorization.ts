import { ResolversComposition } from '@graphql-tools/resolvers-composition';
import { GraphQLError, GraphQLFieldResolver } from 'graphql';
import { ContextValue } from '@/context';
import { verifyAccessToken } from '@/helpers/auth';
import { ErrorCode } from '@/helpers/error-codes';
import { Role } from '@prisma/client';
import { UserWithRoles } from '@/helpers/create-tokens';

export function userHasRole(user: UserWithRoles, requiredRoles: Role[]): boolean {
  return requiredRoles.some(r => user.roles.map(r => r.role).includes(r));
}

export const isAuthenticated =
  (): ResolversComposition<GraphQLFieldResolver<any, ContextValue, any>> =>
  next =>
  async (parent, args, ctx, info) => {
    if (!ctx.token) {
      throw new GraphQLError('Необходима авторизация!', {
        extensions: { code: ErrorCode.UNAUTHENTICATED },
      });
    }

    try {
      const decoded = verifyAccessToken(ctx.token);
      ctx.me = decoded;
    } catch (err) {
      throw err;
    }

    return next(parent, args, ctx, info);
  };

export const hasRoles =
  (roles: Role[]): ResolversComposition<GraphQLFieldResolver<any, ContextValue, any>> =>
  next =>
  async (parent, args, ctx, info) => {
    const me = ctx.me;

    const user = await ctx.prisma.user.findUnique({
      where: {
        id: me!.id,
      },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new GraphQLError('Вы вне системы!', {
        extensions: { code: ErrorCode.UNAUTHENTICATED },
      });
    }

    if (!userHasRole(user, roles)) {
      throw new GraphQLError('Нет прав!', {
        extensions: { code: ErrorCode.UNAUTHENTICATED },
      });
    }

    return next(parent, args, ctx, info);
  };
