import prisma from './prisma';
import generatePasswordHash from '../helpers/generate-password-hash';
import { Prisma, Role } from '@prisma/client';

let countDown = 0;

export default async function seed() {
  if (countDown > 0) {
    return;
  }

  countDown++;

  const password = 'password';
  const hashedPassword = await generatePasswordHash(password);

  const deletedUsers = prisma.user.deleteMany({});
  const deletedRoles = prisma.userRole.deleteMany({});
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

  await prisma.$transaction([
    deletedUsers,
    deletedRoles,
    deletedWbOrders,
    wbOrders,
  ]);

  // Create users with different role combinations
  await prisma.user.create({
    data: {
      name: 'Regular User',
      email: 'user@mail.com',
      password: hashedPassword,
      roles: {
        create: { role: Role.USER },
      },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@mail.com',
      password: hashedPassword,
      roles: {
        create: [{ role: Role.USER }, { role: Role.ADMIN }],
      },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Manager User',
      email: 'manager@mail.com',
      password: hashedPassword,
      roles: {
        create: [{ role: Role.USER }, { role: Role.MANAGER }],
      },
    },
  });

  await prisma.user.create({
    data: {
      name: 'Super User',
      email: 'super@mail.com',
      password: hashedPassword,
      roles: {
        create: [
          { role: Role.USER },
          { role: Role.ADMIN },
          { role: Role.MANAGER },
        ],
      },
    },
  });

  console.log('Seed completed successfully');
}

seed().catch(error => console.error('Error seeding database: ', error));
