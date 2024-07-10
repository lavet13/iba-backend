import { Resolvers } from '../../__generated__/types';

import {
  ResolversComposerMapping,
  composeResolvers,
} from '@graphql-tools/resolvers-composition';
import { isAuthenticated } from '../../composition/authorization';
import { GraphQLError } from 'graphql';
import { decodeRefreshToken, verifyRefreshToken } from '../../../helpers/auth';
import createTokens, {
  REFRESH_TOKEN_TTL,
} from '../../../helpers/create-tokens';
import { ErrorCode } from '../../../helpers/error-codes';
import jwt from 'jsonwebtoken';

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
        throw new GraphQLError('Refresh token not found', {
          extensions: { code: ErrorCode.INVALID_TOKEN },
        });
      }

      const tokenRecord = await ctx.prisma.refreshToken.findUnique({
        where: {
          token: refreshToken.value,
        },
        include: {
          user: true,
        },
      });

      if (!tokenRecord) {
        throw new GraphQLError('Cannot find token in database', {
          extensions: { code: ErrorCode.INVALID_TOKEN },
        });
      }

      try {
        verifyRefreshToken(refreshToken.value);
      } catch(error: any) {
        console.log({ error });
        if(error instanceof GraphQLError && error.extensions.code === ErrorCode.AUTHENTICATION_REQUIRED) {
          await ctx.prisma.refreshToken.delete({
            where: { id: tokenRecord.id },
          });

          await ctx.request.cookieStore?.delete('accessToken');
          await ctx.request.cookieStore?.delete('refreshToken');
        }
        throw error;
      }

      const { accessToken, refreshToken: newRefreshToken } = createTokens(
        tokenRecord.user,
      );

      await ctx.prisma.refreshToken.update({
        where: {
          token: refreshToken.value,
        },
        data: {
          token: newRefreshToken,
          expiredAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        },
      });

      try {
        await ctx.request.cookieStore?.set({
          name: 'accessToken',
          value: accessToken,
          sameSite: 'none',
          secure: true,
          httpOnly: true,
          domain: null,
          expires: null,
          path: '/',
        });

        await ctx.request.cookieStore?.set({
          name: 'refreshToken',
          value: newRefreshToken,
          sameSite: 'none',
          secure: true,
          httpOnly: true,
          domain: null,
          expires: null,
          path: '/',
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
          sameSite: 'none',
          secure: true,
          httpOnly: true,
          domain: null,
          expires: null,
          path: '/',
        });

        await ctx.request.cookieStore?.set({
          name: 'refreshToken',
          value: refreshToken,
          sameSite: 'none',
          secure: true,
          httpOnly: true,
          domain: null,
          expires: null,
          path: '/',
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
          sameSite: 'none',
          secure: true,
          httpOnly: true,
          domain: null,
          expires: null,
          path: '/',
        });
        await ctx.request.cookieStore?.set({
          name: 'refreshToken',
          value: refreshToken,
          sameSite: 'none',
          secure: true,
          httpOnly: true,
          domain: null,
          expires: null,
          path: '/',
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
        await ctx.prisma.refreshToken.delete({
          where: {
            token: refreshToken.value,
          },
        });
      }

      await ctx.request.cookieStore?.delete('accessToken');
      await ctx.request.cookieStore?.delete('refreshToken');

      return true;
    },
  },
};

const resolversComposition: ResolversComposerMapping<any> = {
  'Query.me': [isAuthenticated()],
};

export default composeResolvers(resolvers, resolversComposition);
