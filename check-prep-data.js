const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Checking P.7 Prep Results in Database...\n');
  
  // Get all results grouped by year
  const results = await prisma.p7PrepResult.findMany({
    orderBy: [
      { year: 'desc' },
      { term: 'asc' },
      { prepNumber: 'asc' },
    ],
  });

  console.log(`Total records: ${results.length}\n`);

  // Group by year
  const byYear = {};
  results.forEach(r => {
    if (!byYear[r.year]) byYear[r.year] = [];
    byYear[r.year].push(r);
  });

  Object.keys(byYear).sort((a, b) => b - a).forEach(year => {
    const yearResults = byYear[year];
    console.log(`📅 Year ${year}: ${yearResults.length} records`);
    
    // Group by term
    const byTerm = {};
    yearResults.forEach(r => {
      if (!byTerm[r.term]) byTerm[r.term] = [];
      byTerm[r.term].push(r);
    });
    
    Object.keys(byTerm).sort().forEach(term => {
      const termResults = byTerm[term];
      const preps = [...new Set(termResults.map(r => r.prepNumber))].sort((a, b) => a - b);
      const schools = [...new Set(termResults.map(r => r.school))].sort();
      console.log(`  Term ${term}: ${termResults.length} records - Preps: [${preps.join(', ')}] - Schools: [${schools.join(', ')}]`);
    });
    console.log('');
  });

  // Specific check for 2026
  const results2026 = await prisma.p7PrepResult.findMany({
    where: { year: 2026 },
    orderBy: [{ term: 'asc' }, { prepNumber: 'asc' }, { school: 'asc' }],
  });

  if (results2026.length > 0) {
    console.log('🚨 Detailed 2026 Data:');
    results2026.forEach(r => {
      console.log(`  ${r.school} - Prep ${r.prepNumber} (Term ${r.term}): Enrollment=${r.enrollment}, Div I=${r.divisionI}`);
    });
  } else {
    console.log('✅ No 2026 data found in database');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
