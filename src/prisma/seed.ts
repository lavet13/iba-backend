import prisma from './prisma';
import generatePasswordHash from '../helpers/generate-password-hash';

let countDown = 0;

export default async function seed() {
  console.log({ NODE_ENV: process.env.NODE_ENV });
  if (countDown > 0) {
    return;
  }

  countDown++;

  const password = 'password';
  const hashedPassword = await generatePasswordHash(password);

  const users = prisma.user.deleteMany({});
  await prisma.$transaction([users]);

  await prisma.user.create({
    data: {
      name: 'user',
      email: 'user@mail.com',
      role: 'ADMIN',
      password: hashedPassword,
    },
  });
}

seed();
