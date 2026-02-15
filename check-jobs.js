const { PrismaClient } = require('@prisma/client');
async function main() {
    const p = new PrismaClient();
    const count = await p.job.count();
    console.log('Total jobs in DB:', count);
    const jobs = await p.job.findMany({ select: { id: true, title: true, companyName: true, status: true } });
    jobs.forEach(j => console.log(`  [${j.status}] ${j.title} @ ${j.companyName}`));
    await p.$disconnect();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
