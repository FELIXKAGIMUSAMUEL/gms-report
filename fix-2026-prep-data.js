const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n🔧 2026 P.7 Prep Data Repair Tool\n');
  
  const results2026 = await prisma.p7PrepResult.findMany({
    where: { year: 2026 },
    orderBy: [{ prepNumber: 'asc' }],
  });

  console.log(`Found ${results2026.length} records for 2026\n`);
  
  console.log('Options:');
  console.log('1. Delete ALL 2026 prep data');
  console.log('2. Fix term classification (Prep 4-6 → Term 2, Prep 7-9 → Term 3)');
  console.log('3. Cancel\n');
  
  const choice = await ask('Enter your choice (1, 2, or 3): ');
  
  if (choice === '1') {
    const confirm = await ask(`\n⚠️  This will DELETE all ${results2026.length} records for 2026. Type 'DELETE' to confirm: `);
    if (confirm === 'DELETE') {
      const result = await prisma.p7PrepResult.deleteMany({
        where: { year: 2026 },
      });
      console.log(`\n✅ Deleted ${result.count} records for 2026`);
    } else {
      console.log('\n❌ Deletion cancelled');
    }
  } else if (choice === '2') {
    console.log('\n🔄 Fixing term classification...');
    
    // Update preps 4-6 to Term 2
    const term2Result = await prisma.p7PrepResult.updateMany({
      where: {
        year: 2026,
        prepNumber: { in: [4, 5, 6] },
      },
      data: { term: 2 },
    });
    console.log(`✅ Updated ${term2Result.count} records (Preps 4-6) to Term 2`);
    
    // Update preps 7-9 to Term 3
    const term3Result = await prisma.p7PrepResult.updateMany({
      where: {
        year: 2026,
        prepNumber: { in: [7, 8, 9] },
      },
      data: { term: 3 },
    });
    console.log(`✅ Updated ${term3Result.count} records (Preps 7-9) to Term 3`);
    
    console.log('\n✅ Term classification fixed!');
  } else {
    console.log('\n❌ Operation cancelled');
  }
  
  rl.close();
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    rl.close();
  });
