import { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';

import createToken from '../../utils/auth/create-token';
import validatePassword from '../../utils/auth/validate-password';
import generatePasswordHash from '../../utils/auth/generate-password-hash';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const userExtension = Prisma.defineExtension(client => {
  return client.$extends({
    model: {
      user: {
        async login(login: string, password: string) {
          console.log({ login, password });
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
          });

          console.log({ user });

          if (!user) {
            throw new GraphQLError('Такого пользователя не существует!');
          }

          const isValid = await validatePassword(password, user.password);

          if (!isValid) {
            throw new GraphQLError('Введен неверный пароль!');
          }

          const token = createToken(user, { expiresIn: '24h' });

          return { token };
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

          const token = createToken(newUser, { expiresIn: '24h' });

          return { token };
        },
      },
    },
  });
});

export default userExtension;
