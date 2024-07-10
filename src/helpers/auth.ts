import jwt from 'jsonwebtoken';

import { GraphQLError } from 'graphql';
import { ErrorCode } from './error-codes';

export async function getTokenFromRequest(request: Request) {
  const accessToken = await request.cookieStore?.get({
    name: 'accessToken',
  });

  return accessToken?.value || null;
}

export function decodeToken(token: string) {
  try {
    return jwt.decode(token) as jwt.JwtPayload;
  } catch (error: any) {
    throw new GraphQLError('Failed to decode token', {
      extensions: { code: ErrorCode.INVALID_TOKEN },
    });
  }
}

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

export function decodeRefreshToken(token: string) {
  try {
    const decoded = decodeToken(token);

    return decoded;
  } catch(error) {
    throw error;
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
