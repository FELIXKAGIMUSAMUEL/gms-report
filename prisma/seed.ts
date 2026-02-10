import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create GM user
  const gmPassword = await bcrypt.hash('gm123', 12); // Increased to 12 rounds for better security
  await prisma.user.upsert({
    where: { email: 'gm@sak.org' },
    update: {},
    create: {
      email: 'gm@sak.org',
      password: gmPassword,
      name: 'General Manager',
      role: 'GM',
    },
  });

  // Create Trustee users
  const trusteePassword = await bcrypt.hash('trustee123', 12); // Increased to 12 rounds for better security
  await prisma.user.upsert({
    where: { email: 'trustee@sak.org' },
    update: {},
    create: {
      email: 'trustee@sak.org',
      password: trusteePassword,
      name: 'Board Trustee',
      role: 'TRUSTEE',
    },
  });

  // Create Schools
  const schoolNames = ['CPS', 'MENGO', 'NAKASERO', 'KISASI', 'OLD K\'LA', 'WINSTON', 'FAIRWAYS', 'KPM', 'KPS', 'KITINTALE', 'KIRA'];
  for (const schoolName of schoolNames) {
    await prisma.school.upsert({
      where: { name: schoolName },
      update: {},
      create: {
        name: schoolName,
      },
    });
  }

  // Create Weekly Reports for the last 4 weeks
  const currentYear = 2026;
  const weeklyReports = [
    { week: 1, fees: 78, schools: 85, infra: 45, enrollment: 1250, theology: 180, p7: 72, syllabus: 70, admissions: 45, startDate: new Date('2026-01-06'), endDate: new Date('2026-01-12') },
    { week: 2, fees: 82, schools: 88, infra: 50, enrollment: 1265, theology: 185, p7: 75, syllabus: 74, admissions: 52, startDate: new Date('2026-01-13'), endDate: new Date('2026-01-19') },
    { week: 3, fees: 85, schools: 90, infra: 55, enrollment: 1280, theology: 190, p7: 78, syllabus: 78, admissions: 60, startDate: new Date('2026-01-20'), endDate: new Date('2026-01-26') },
  ];

  for (const report of weeklyReports) {
    await prisma.weeklyReport.upsert({
      where: { weekNumber_year_term: { weekNumber: report.week, year: currentYear, term: 1 } },
      update: {},
      create: {
        weekNumber: report.week,
        year: currentYear,
        term: 1,
        weekStartDate: report.startDate,
        weekEndDate: report.endDate,
        publishedAt: new Date(report.endDate),
        isDraft: false,
        feesCollectionPercent: report.fees,
        schoolsExpenditurePercent: report.schools,
        infrastructurePercent: report.infra,
        totalEnrollment: report.enrollment,
        theologyEnrollment: report.theology,
        p7PrepExamsPercent: report.p7,
        syllabusCoveragePercent: report.syllabus,
        admissions: report.admissions,
      },
    });
  }

  // Seed KPI Data for current year (2026)
  const kpiDataPoints = [
    { month: 1, feesCollection: 78, schoolsExpenditure: 85, infrastructure: 45, totalEnroll: 1250, theologyEnroll: 180, p7Prep: 72 },
    { month: 2, feesCollection: 82, schoolsExpenditure: 88, infrastructure: 50, totalEnroll: 1265, theologyEnroll: 185, p7Prep: 75 },
    { month: 3, feesCollection: 85, schoolsExpenditure: 90, infrastructure: 55, totalEnroll: 1280, theologyEnroll: 190, p7Prep: 78 },
    { month: 4, feesCollection: 88, schoolsExpenditure: 87, infrastructure: 60, totalEnroll: 1295, theologyEnroll: 195, p7Prep: 80 },
    { month: 5, feesCollection: 90, schoolsExpenditure: 85, infrastructure: 65, totalEnroll: 1310, theologyEnroll: 200, p7Prep: 82 },
    { month: 6, feesCollection: 92, schoolsExpenditure: 83, infrastructure: 70, totalEnroll: 1325, theologyEnroll: 205, p7Prep: 85 },
  ];

  for (const data of kpiDataPoints) {
    await prisma.kPIData.upsert({
      where: { month_year: { month: data.month, year: currentYear } },
      update: {},
      create: {
        month: data.month,
        year: currentYear,
        feesCollectionPercent: data.feesCollection,
        schoolsExpenditurePercent: data.schoolsExpenditure,
        infrastructurePercent: data.infrastructure,
        totalEnrollment: data.totalEnroll,
        theologyEnrollment: data.theologyEnroll,
        p7PrepExamsPercent: data.p7Prep,
      },
    });
  }

  // Seed Enrollment data by school/class/term/year
  const enrollmentClasses = ["KG1", "KG2", "KG3", "P.1", "P.2", "P.3", "P.4", "P.5", "P.6", "P.7"];
  const enrollmentYears = [2024, 2025, 2026];
  const enrollmentTerm = 1;

  for (const year of enrollmentYears) {
    for (let schoolIndex = 0; schoolIndex < schoolNames.length; schoolIndex += 1) {
      const school = schoolNames[schoolIndex];
      for (let classIndex = 0; classIndex < enrollmentClasses.length; classIndex += 1) {
        const className = enrollmentClasses[classIndex];
        const count = 18 + classIndex * 3 + (year - 2024) * 2 + (schoolIndex % 5);
        await prisma.enrollment.upsert({
          where: {
            school_class_term_year: {
              school,
              class: className,
              term: enrollmentTerm,
              year,
            },
          },
          update: { count },
          create: {
            school,
            class: className,
            term: enrollmentTerm,
            year,
            count,
          },
        });
      }
    }
  }

  // Seed Other Income data (2023-2026)
  const incomeSources = [
    { name: 'Uniforms', isActive: true },
    { name: 'Swimming', isActive: true },
    { name: 'Canteen', isActive: true },
    { name: 'Saving Scheme', isActive: true },
  ];

  for (const source of incomeSources) {
    await prisma.incomeSource.upsert({
      where: { name: source.name },
      update: {},
      create: source,
    });
  }

  const otherIncomeData = [
    { year: 2023, source: 'Uniforms', amount: 45000 },
    { year: 2023, source: 'Swimming', amount: 28000 },
    { year: 2023, source: 'Canteen', amount: 62000 },
    { year: 2023, source: 'Saving Scheme', amount: 38000 },
    { year: 2024, source: 'Uniforms', amount: 52000 },
    { year: 2024, source: 'Swimming', amount: 32000 },
    { year: 2024, source: 'Canteen', amount: 68000 },
    { year: 2024, source: 'Saving Scheme', amount: 42000 },
    { year: 2025, source: 'Uniforms', amount: 58000 },
    { year: 2025, source: 'Swimming', amount: 35000 },
    { year: 2025, source: 'Canteen', amount: 75000 },
    { year: 2025, source: 'Saving Scheme', amount: 48000 },
    { year: 2026, source: 'Uniforms', amount: 65000 },
    { year: 2026, source: 'Swimming', amount: 40000 },
    { year: 2026, source: 'Canteen', amount: 82000 },
    { year: 2026, source: 'Saving Scheme', amount: 55000 },
  ];

  for (const data of otherIncomeData) {
    await prisma.otherIncome.create({ data });
  }

  // Seed P.7 Prep Performance (2023-2025)
  const p7PrepData = [
    { year: 2023, prep1: 62, prep2: 64, prep3: 66, prep4: 68, prep5: 70, prep6: 72, prep7: 74, prep8: 76, prep9: 78 },
    { year: 2024, prep1: 65, prep2: 68, prep3: 70, prep4: 72, prep5: 74, prep6: 76, prep7: 78, prep8: 80, prep9: 82 },
    { year: 2025, prep1: 68, prep2: 70, prep3: 72, prep4: 75, prep5: 77, prep6: 79, prep7: 81, prep8: 83, prep9: 85 },
  ];

  for (const data of p7PrepData) {
    await prisma.p7PrepPerformance.upsert({
      where: { year: data.year },
      update: {},
      create: data,
    });
  }

  // Seed P.7 Prep Results (2023-2026)
  const p7ResultYears = [2023, 2024, 2025, 2026];
  const p7PrepNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  for (let yearIndex = 0; yearIndex < p7ResultYears.length; yearIndex += 1) {
    const year = p7ResultYears[yearIndex];
    for (let schoolIndex = 0; schoolIndex < schoolNames.length; schoolIndex += 1) {
      const school = schoolNames[schoolIndex];
      for (let prepIndex = 0; prepIndex < p7PrepNumbers.length; prepIndex += 1) {
        const prepNumber = p7PrepNumbers[prepIndex];
        const term = prepNumber <= 3 ? 1 : prepNumber <= 6 ? 2 : 3;
        const enrollment = 60 + (year - 2023) * 3 + (schoolIndex % 5) * 2 + prepIndex;
        const divisionI = Math.round(enrollment * 0.18);
        const divisionII = Math.round(enrollment * 0.32);
        const divisionIII = Math.round(enrollment * 0.3);
        const used = divisionI + divisionII + divisionIII;
        const divisionIV = Math.max(0, enrollment - used);
        const averageScore = 62 + (year - 2023) * 2 + (prepIndex % 3) * 3 + (schoolIndex % 4);

        await prisma.p7PrepResult.upsert({
          where: {
            school_prepNumber_term_year: {
              school,
              prepNumber,
              term,
              year,
            },
          },
          update: {
            enrollment,
            divisionI,
            divisionII,
            divisionIII,
            divisionIV,
            averageScore,
          },
          create: {
            school,
            prepNumber,
            term,
            year,
            enrollment,
            divisionI,
            divisionII,
            divisionIII,
            divisionIV,
            averageScore,
          },
        });
      }
    }
  }

  // Seed Upcoming Events
  const upcomingEvents = [
    { date: new Date('2026-02-15'), activity: 'Parent-Teacher Conference', inCharge: 'Mr. Okello', rate: 'High' },
    { date: new Date('2026-03-01'), activity: 'Sports Day', inCharge: 'Ms. Nakato', rate: 'Medium' },
    { date: new Date('2026-03-20'), activity: 'Board Meeting', inCharge: 'GM', rate: 'High' },
    { date: new Date('2026-04-05'), activity: 'End of Term Exams', inCharge: 'Academic Director', rate: 'High' },
  ];

  for (const event of upcomingEvents) {
    await prisma.upcomingEvent.create({ data: event });
  }

  // Seed GM Projects
  const projects = [
    { projectName: 'New Library Construction', progress: 75, projectManager: 'Eng. Mukasa' },
    { projectName: 'ICT Lab Upgrade', progress: 90, projectManager: 'Mr. Kibirige' },
    { projectName: 'Playground Renovation', progress: 45, projectManager: 'Mr. Wasswa' },
    { projectName: 'Dormitory Expansion', progress: 30, projectManager: 'Arch. Nambi' },
  ];

  for (const project of projects) {
    await prisma.gMProject.create({ data: project });
  }

  // Seed Weekly Scorecard
  const schools = ['CPS', 'MENGO', 'NAKASERO', 'KISASI', 'OLD K\'LA', 'WINSTON', 'FAIRWAYS', 'KPM', 'KPS', 'KITINTALE', 'KIRA'];
  for (let week = 1; week <= 4; week++) {
    for (const school of schools) {
      await prisma.weeklyScorecard.upsert({
        where: {
          week_year_term_school: { week, year: 2026, term: 1, school },
        },
        update: {
          academicPercent: 70 + Math.random() * 25,
          financePercent: 75 + Math.random() * 20,
          qualityPercent: 70 + Math.random() * 25,
          tdpPercent: 65 + Math.random() * 30,
          theologyPercent: 70 + Math.random() * 25,
        },
        create: {
          week,
          year: 2026,
          term: 1,
          school,
          academicPercent: 70 + Math.random() * 25,
          financePercent: 75 + Math.random() * 20,
          qualityPercent: 70 + Math.random() * 25,
          tdpPercent: 65 + Math.random() * 30,
          theologyPercent: 70 + Math.random() * 25,
        },
      });
    }
  }

  // Seed Red Issues
  const redIssues = [
    { issue: 'Water supply disruption in Block A', inCharge: 'Maintenance Team', status: 'IN_PROGRESS' as const },
    { issue: 'Delay in textbook delivery', inCharge: 'Procurement Officer', status: 'OPEN' as const },
    { issue: 'Staff transport breakdown', inCharge: 'Transport Manager', status: 'RESOLVED' as const },
    { issue: 'Kitchen equipment malfunction', inCharge: 'Catering Manager', status: 'IN_PROGRESS' as const },
  ];

  for (const issue of redIssues) {
    await prisma.redIssue.create({ data: issue });
  }

  console.log('✅ Database seeded successfully!');
  console.log('👤 GM User: gm@sak.org / gm123');
  console.log('👤 Trustee User: trustee@sak.org / trustee123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
