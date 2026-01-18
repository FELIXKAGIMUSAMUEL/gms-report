import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@gms.com' },
    update: {},
    create: {
      email: 'admin@gms.com',
      password: hashedPassword,
      name: 'Admin User',
    },
  });

  // Create historical data from 2020 to 2026
  const reports = [];
  
  for (let year = 2020; year <= 2026; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      // Generate realistic data with some growth trends
      const baseYear = year - 2020;
      const baptisms = Math.floor(15 + Math.random() * 10 + baseYear * 2);
      const professionOfFaith = Math.floor(10 + Math.random() * 8 + baseYear * 1.5);
      const tithes = parseFloat((5000 + Math.random() * 2000 + baseYear * 500).toFixed(2));
      const combinedOfferings = parseFloat((3000 + Math.random() * 1500 + baseYear * 400).toFixed(2));
      const membership = Math.floor(450 + baseYear * 25 + quarter * 5);
      const sabbathSchoolAttendance = Math.floor(300 + baseYear * 20 + quarter * 3);

      reports.push({
        year,
        quarter,
        baptisms,
        professionOfFaith,
        tithes,
        combinedOfferings,
        membership,
        sabbathSchoolAttendance,
      });
    }
  }

  // Insert all reports
  for (const report of reports) {
    await prisma.report.upsert({
      where: {
        year_quarter: {
          year: report.year,
          quarter: report.quarter,
        },
      },
      update: report,
      create: report,
    });
  }

  console.log('Database seeded successfully!');
  console.log('Default user: admin@gms.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
