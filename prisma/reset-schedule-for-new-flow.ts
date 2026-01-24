/**
 * Script to reset scheduledDate for interviews that have PAYMENT_SUCCESS
 * but were scheduled under the old flow (before payment).
 * 
 * This allows testing the new flow where HR schedules AFTER payment.
 * 
 * Run with: npx ts-node prisma/reset-schedule-for-new-flow.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetScheduleForPaidInterviews() {
    console.log('🔧 Resetting scheduledDate for PAYMENT_SUCCESS interviews...\n');

    // Find all interviews with PAYMENT_SUCCESS that have scheduledDate set
    const interviews = await prisma.interview.findMany({
        where: {
            OR: [
                { status: 'PAYMENT_SUCCESS' },
                { paymentStatus: 'SUCCESS' }
            ],
            scheduledDate: { not: null }
        },
        include: {
            JobApplication: {
                include: {
                    Candidate: {
                        include: { User: true }
                    },
                    Job: true
                }
            }
        }
    });

    console.log(`Found ${interviews.length} interviews to reset:\n`);

    for (const interview of interviews) {
        const candidateName = interview.JobApplication?.Candidate?.User?.name || 'Unknown';
        const jobTitle = interview.JobApplication?.Job?.title || 'Unknown';

        console.log(`📋 Interview ID: ${interview.id}`);
        console.log(`   Candidate: ${candidateName}`);
        console.log(`   Job: ${jobTitle}`);
        console.log(`   Old scheduledDate: ${interview.scheduledDate}`);
        console.log(`   Old scheduledTime: ${interview.scheduledTime}`);

        // Reset the schedule fields
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

        console.log(`   ✅ Reset to null - HR can now schedule\n`);
    }

    console.log('✅ Done! HR can now use the "Schedule Interview" button for these interviews.');
}

resetScheduleForPaidInterviews()
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
