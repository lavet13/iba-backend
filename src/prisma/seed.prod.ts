import prisma from '@/prisma';
import generatePasswordHash from '@/helpers/generate-password-hash';
import { Role } from '@prisma/client';

export default async function seed() {
  const password = 'zECIVumADy5g0l4V';
  const hashedPassword = await generatePasswordHash(password);

  // Create users with different role combinations
  await prisma.user.create({
    data: {
      name: 'iba',
      email: 'iba@iba.com',
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
