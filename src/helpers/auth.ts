import jwt from 'jsonwebtoken';

import { GraphQLError } from 'graphql';
import { ErrorCode } from '@/helpers/error-codes';

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, import.meta.env.VITE_JWT_SECRET) as jwt.JwtPayload;
  } catch (error: any) {
    if(error instanceof jwt.TokenExpiredError && error.message === 'jwt expired') {
      throw new GraphQLError('Access token has expired', {
        extensions: { code: ErrorCode.TOKEN_EXPIRED },
      });
    }
    throw new GraphQLError(error.message, {
      extensions: { code: ErrorCode.INVALID_TOKEN },
    });
  }
}

export function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(
      token,
      import.meta.env.VITE_REFRESH_TOKEN_SECRET,
    ) as jwt.JwtPayload;
  } catch (error: any) {
    if(error instanceof jwt.TokenExpiredError && error.message === 'jwt expired') {
      throw new GraphQLError('Refresh token has expired', {
        extensions: { code: ErrorCode.AUTHENTICATION_REQUIRED },
      });
    }
    throw new GraphQLError(error.message, {
      extensions: { code: ErrorCode.INVALID_TOKEN },
    });
  }
}
