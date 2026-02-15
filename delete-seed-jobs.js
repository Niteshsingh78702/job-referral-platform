// Quick script to delete all seed/demo jobs from the database
const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    try {
        // Find all active jobs
        const jobs = await prisma.job.findMany({
            select: { id: true, title: true, companyName: true, status: true },
        });

        console.log(`Found ${jobs.length} jobs in database:`);
        jobs.forEach(j => console.log(`  - ${j.title} at ${j.companyName} [${j.status}]`));

        if (jobs.length === 0) {
            console.log('No jobs to delete.');
            return;
        }

        // Delete all related records for each job
        for (const job of jobs) {
            console.log(`\nDeleting job: ${job.title} (${job.id})...`);

            // Get applications for this job
            const apps = await prisma.jobApplication.findMany({
                where: { jobId: job.id },
                include: {
                    Interview: true,
                    Payment: { include: { Refund: true } },
                    Referral: { include: { EmployeeEarning: true } },
                    TestSession: true,
                },
            });

            for (const app of apps) {
                if (app.Interview) {
                    await prisma.interview.delete({ where: { id: app.Interview.id } });
                }
                if (app.TestSession.length > 0) {
                    const sessionIds = app.TestSession.map(s => s.id);
                    await prisma.testAnswer.deleteMany({ where: { sessionId: { in: sessionIds } } });
                    await prisma.testEvent.deleteMany({ where: { sessionId: { in: sessionIds } } });
                    await prisma.testSession.deleteMany({ where: { id: { in: sessionIds } } });
                }
                for (const payment of app.Payment) {
                    if (payment.Refund) {
                        await prisma.refund.delete({ where: { id: payment.Refund.id } });
                    }
                }
                await prisma.payment.deleteMany({ where: { applicationId: app.id } });
                if (app.Referral) {
                    if (app.Referral.EmployeeEarning) {
                        await prisma.employeeEarning.delete({ where: { id: app.Referral.EmployeeEarning.id } });
                    }
                    await prisma.referral.delete({ where: { id: app.Referral.id } });
                }
            }

            await prisma.jobApplication.deleteMany({ where: { jobId: job.id } });
            await prisma.jobSkill.deleteMany({ where: { jobId: job.id } });
            await prisma.job.delete({ where: { id: job.id } });
            console.log(`  ✅ Deleted: ${job.title}`);
        }

        console.log(`\n🎉 All ${jobs.length} jobs deleted successfully!`);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
