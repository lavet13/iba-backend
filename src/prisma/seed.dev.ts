import prisma from './prisma';
import generatePasswordHash from '../helpers/generate-password-hash';
import { Prisma } from '@prisma/client';

let countDown = 0;

export default async function seed() {
  if (countDown > 0) {
    return;
  }

  countDown++;

  const password = 'password';
  const hashedPassword = await generatePasswordHash(password);

  const deletedUsers = prisma.user.deleteMany({});
  const deletedWbOrders = prisma.wbOrder.deleteMany({});

  const mockedWbOrders: Prisma.WbOrderCreateManyInput[] = Array.from(
    { length: 20 },
    () => ({
      name: 'test name',
      phone: '+79494124596',
      orderCode: '11111',
      wbPhone: '+79494124596',
    }),
  );
  const wbOrders = prisma.wbOrder.createMany({
    data: mockedWbOrders,
  });

  await prisma.$transaction([deletedUsers, deletedWbOrders, wbOrders]);

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
