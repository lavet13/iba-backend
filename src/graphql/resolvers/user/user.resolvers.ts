import { Resolvers } from '@/graphql/__generated__/types';

import {
  ResolversComposerMapping,
  composeResolvers,
} from '@graphql-tools/resolvers-composition';
import { isAuthenticated } from '@/graphql/composition/authorization';
import { GraphQLError } from 'graphql';
import { verifyRefreshToken } from '@/helpers/auth';
import createTokens from '@/helpers/create-tokens';
import { ErrorCode } from '@/helpers/error-codes';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { cookieOpts } from '@/helpers/cookie-opts';

const resolvers: Resolvers = {
  Query: {
    me(_, __, ctx) {
      return ctx.prisma.user.findFirst({
        where: {
          id: ctx.me!.id,
        },
      });
    },
  },
  Mutation: {
    async refreshToken(_, __, ctx) {
      const refreshToken = await ctx.request.cookieStore?.get('refreshToken');
      if (!refreshToken) {
        await ctx.request.cookieStore?.delete('accessToken');
        await ctx.request.cookieStore?.delete('refreshToken');
        console.log('tokens are deleted');

        throw new GraphQLError('Refresh token not found', {
          extensions: { code: ErrorCode.AUTHENTICATION_REQUIRED },
        });
      }

      const tokenRecord = await ctx.prisma.refreshToken.findUnique({
        where: {
          token: refreshToken.value,
        },
        include: {
          user: {
            include: {
              roles: true,
            },
          },
        },
      });

      if (!tokenRecord) {
        await ctx.request.cookieStore?.delete('accessToken');
        await ctx.request.cookieStore?.delete('refreshToken');
        console.log('tokens deleted from database');

        throw new GraphQLError('Cannot find token in database', {
          extensions: { code: ErrorCode.AUTHENTICATION_REQUIRED },
        });
      }

      try {
        verifyRefreshToken(refreshToken.value);
      } catch (error: any) {
        console.log({ error });
        if (
          error instanceof GraphQLError &&
          error.extensions.code === ErrorCode.AUTHENTICATION_REQUIRED
        ) {
          await ctx.prisma.refreshToken.delete({
            where: { token: tokenRecord.token, userId: tokenRecord.userId },
          });

          await ctx.request.cookieStore?.delete('accessToken');
          await ctx.request.cookieStore?.delete('refreshToken');
          console.log('tokens deleted from database');
        }
        throw error;
      }

      const { accessToken, refreshToken: newRefreshToken } = createTokens(
        tokenRecord.user,
      );

      await ctx.prisma.refreshToken
        .update({
          where: {
            token: tokenRecord.token,
          },
          data: {
            token: newRefreshToken,
          },
        })
        .catch(async err => {
          if (err instanceof PrismaClientKnownRequestError) {
            if (err.code === 'P2025') {
              return Promise.reject(
                new GraphQLError(`Refresh token was not found. Can\'t update`),
              );
            }
          }

          return Promise.reject(err);
        });

      try {
        await ctx.request.cookieStore?.set({
          name: 'accessToken',
          value: accessToken,
          ...cookieOpts,
        });

        await ctx.request.cookieStore?.set({
          name: 'refreshToken',
          value: newRefreshToken,
          ...cookieOpts,
        });
      } catch (reason) {
        console.error(`It failed: ${reason}`);
        throw new GraphQLError(`Failed while setting the cookie`);
      }

      return { accessToken, refreshToken: newRefreshToken };
    },
    async login(_, args, ctx) {
      const { login, password } = args.loginInput;
      const { refreshToken, accessToken } = await ctx.prisma.user.login(
        login,
        password,
      );

      try {
        await ctx.request.cookieStore?.set({
          name: 'accessToken',
          value: accessToken,
          ...cookieOpts,
        });

        await ctx.request.cookieStore?.set({
          name: 'refreshToken',
          value: refreshToken,
          ...cookieOpts,
        });
      } catch (reason) {
        console.error(`It failed: ${reason}`);
        throw new GraphQLError(`Failed while setting the cookie`);
      }

      return { accessToken, refreshToken };
    },
    async signup(_, args, ctx) {
      const { email, name, password } = args.signupInput;

      const { refreshToken, accessToken } = await ctx.prisma.user.signup(
        email,
        name,
        password,
      );

      try {
        await ctx.request.cookieStore?.set({
          name: 'accessToken',
          value: accessToken,
          ...cookieOpts,
        });
        await ctx.request.cookieStore?.set({
          name: 'refreshToken',
          value: refreshToken,
          ...cookieOpts,
        });
      } catch (reason) {
        console.error(`It failed: ${reason}`);
        throw new GraphQLError(`Failed while setting the cookie`);
      }

      // console.log({ authorization: await ctx.request.cookieStore?.get('authorization') });
      // console.log({ cookies: await ctx.request.cookieStore?.getAll()});

      return { accessToken, refreshToken };
    },
    async logout(_, __, ctx) {
      const refreshToken = await ctx.request.cookieStore?.get('refreshToken');

      if (refreshToken) {
        await ctx.prisma.refreshToken
          .delete({
            where: {
              token: refreshToken.value,
            },
          })
          .catch(async err => {
            if (err instanceof PrismaClientKnownRequestError) {
              if (err.code === 'P2025') {
                await ctx.request.cookieStore?.delete('accessToken');
                await ctx.request.cookieStore?.delete('refreshToken');

                return Promise.reject(
                  new GraphQLError(
                    `Refresh token was not found. Can\'t delete`,
                    {
                      extensions: { code: ErrorCode.AUTHENTICATION_REQUIRED },
                    },
                  ),
                );
              }
            }

            return Promise.reject(err);
          });
      }

      await ctx.request.cookieStore?.delete('accessToken');
      await ctx.request.cookieStore?.delete('refreshToken');
      console.log('token deleted after logging out');

      return true;
    },
  },
  User: {
    async roles(parent, _, ctx) {
      const userRole = await ctx.prisma.userRole.findMany({
        where: {
          userId: parent.id,
        },
        select: {
          role: true,
        },
      });

      const roles = userRole.map(r => r.role);

      console.log({ roles });

      return roles;
    }
  },
};

const resolversComposition: ResolversComposerMapping<any> = {
  'Query.me': [isAuthenticated()],
};

export default composeResolvers(resolvers, resolversComposition);
