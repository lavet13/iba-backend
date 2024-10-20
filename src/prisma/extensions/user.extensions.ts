import { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';

import createTokens from '@/helpers/create-tokens';
import validatePassword from '@/helpers/validate-password';
import generatePasswordHash from '@/helpers/generate-password-hash';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const userExtension = Prisma.defineExtension(client => {
  return client.$extends({
    model: {
      user: {
        async login(login: string, password: string) {
          const user = await client.user.findFirst({
            where: {
              OR: [
                {
                  name: login,
                },
                {
                  email: login,
                },
              ],
            },
            include: {
              roles: true,
            },
          });

          if (!user) {
            throw new GraphQLError('Такого пользователя не существует!');
          }

          const isValid = await validatePassword(password, user.password);

          if (!isValid) {
            throw new GraphQLError('Введен неверный пароль!');
          }

          const { accessToken, refreshToken } = createTokens(user);

          await client.refreshToken.create({
            data: {
              token: refreshToken,
              userId: user.id,
            },
          });

          return { accessToken, refreshToken };
        },

        async signup(email: string, name: string, password: string) {
          const hashedPassword = await generatePasswordHash(password);

          const newUser = await client.user
            .create({
              data: {
                email,
                name,
                password: hashedPassword,
              },
              include: {
                roles: true,
              },
            })
            .catch((err: unknown) => {
              if (
                err instanceof PrismaClientKnownRequestError &&
                err.code === 'P2002'
              ) {
                return Promise.reject(
                  new GraphQLError(
                    `Пользователь с таким E-mail ${email} уже существует!`
                  )
                );
              }

              return Promise.reject(err);
            });

          const { accessToken, refreshToken } = createTokens(newUser);

          await client.userRole.create({
            data: {
              userId: newUser.id
            },
          });
          await client.refreshToken.create({
            data: {
              token: refreshToken,
              userId: newUser.id,
            },
          });

          return { accessToken, refreshToken };
        },
      },
    },
  });
});

export default userExtension;
