const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const results = await prisma.p7PrepResult.findMany({
    orderBy: [
      { year: 'asc' },
      { prepNumber: 'asc' },
      { school: 'asc' }
    ]
  });
  
  console.log('\n=== P7 Prep Results Data ===\n');
  
  // Group by year and prep
  const grouped = {};
  results.forEach(r => {
    const key = `${r.year}-Prep${r.prepNumber}`;
    if (!grouped[key]) {
      grouped[key] = { enrollment: 0, divisionI: 0, schools: [] };
    }
    grouped[key].enrollment += r.enrollment || 0;
    grouped[key].divisionI += r.divisionI || 0;
    grouped[key].schools.push(r.school);
  });
  
  // Display grouped data
  Object.entries(grouped).forEach(([key, data]) => {
    const pct = data.enrollment > 0 ? ((data.divisionI / data.enrollment) * 100).toFixed(1) : 0;
    console.log(`${key}: ${data.divisionI}/${data.enrollment} = ${pct}% Div1 (Schools: ${data.schools.join(', ')})`);
  });
  
  console.log('\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
