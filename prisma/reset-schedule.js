/**
 * Script to reset scheduledDate for interviews that have PAYMENT_SUCCESS
 * Run with: node prisma/reset-schedule.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Resetting scheduledDate for PAID interviews...\n');

    // Find all interviews with PAYMENT_SUCCESS that have scheduledDate set
    const interviews = await prisma.interview.findMany({
        where: {
            OR: [
                { status: 'PAYMENT_SUCCESS' },
                { paymentStatus: 'SUCCESS' }
            ],
            scheduledDate: { not: null }
        }
    });

    console.log(`Found ${interviews.length} interviews to reset\n`);

    for (const interview of interviews) {
        console.log(`📋 Resetting Interview ID: ${interview.id}`);
        console.log(`   Old Date: ${interview.scheduledDate}`);
        console.log(`   Old Time: ${interview.scheduledTime}`);

        await prisma.interview.update({
            where: { id: interview.id },
            data: {
                scheduledDate: null,
                scheduledTime: null,
                scheduledAt: null,
                interviewLink: null,
                callDetails: null,
                updatedAt: new Date()
            }
        });

        console.log(`   ✅ Reset to null\n`);
    }

    console.log('✅ Done! HR can now use "Schedule Interview" button.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
