import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const schools = [
    'KIRA',
    'OLD KAMPALA',
    'MENGO',
    'KPS',
    'KPM',
    'FAIRWAYS',
    'WINSTON',
    'KITINTALE',
    'NAMIREMBE'
  ];

  const departments = [
    'Finance',
    'Academic',
    'Quality',
    'TDP',
    'Theology'
  ];

  console.log('Seeding schools...');
  for (const name of schools) {
    await prisma.school.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Seeding departments...');
  for (const name of departments) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
