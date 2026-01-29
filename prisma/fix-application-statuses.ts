/**
 * Fix Application Statuses Script
 * 
 * This script updates existing applications where:
 * - Candidate has passed a skill test (skillTestAttempt.isPassed = true)
 * - But application status is still APPLIED, TEST_PENDING, or TEST_REQUIRED
 * 
 * Run: npx ts-node prisma/fix-application-statuses.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixApplicationStatuses() {
    console.log('🔧 Starting application status fix...\n');

    // Get all passed skill test attempts
    const passedAttempts = await prisma.skillTestAttempt.findMany({
        where: {
            isPassed: true,
        },
        select: {
            candidateId: true,
            skillBucketId: true,
            score: true,
            attemptedAt: true,
        },
    });

    console.log(`Found ${passedAttempts.length} passed test attempts`);

    let updatedCount = 0;

    for (const attempt of passedAttempts) {
        // Find applications for this candidate with matching skill bucket that need updating
        const applicationsToUpdate = await prisma.jobApplication.findMany({
            where: {
                candidateId: attempt.candidateId,
                Job: {
                    skillBucketId: attempt.skillBucketId,
                },
                status: {
                    in: ['APPLIED', 'TEST_PENDING', 'TEST_REQUIRED', 'TEST_IN_PROGRESS'],
                },
            },
            select: {
                id: true,
                status: true,
                Job: {
                    select: {
                        title: true,
                        companyName: true,
                    },
                },
            },
        });

        if (applicationsToUpdate.length > 0) {
            console.log(`\nCandidate ${attempt.candidateId} - ${applicationsToUpdate.length} applications to update:`);

            for (const app of applicationsToUpdate) {
                console.log(`  - ${app.Job.title} at ${app.Job.companyName}: ${app.status} → TEST_PASSED_WAITING_HR`);
            }

            // Update all matching applications
            await prisma.jobApplication.updateMany({
                where: {
                    id: { in: applicationsToUpdate.map(a => a.id) },
                },
                data: {
                    status: 'TEST_PASSED_WAITING_HR',
                    testPassedAt: attempt.attemptedAt,
                    testScore: attempt.score,
                },
            });

            updatedCount += applicationsToUpdate.length;
        }
    }

    console.log(`\n✅ Updated ${updatedCount} application(s) to TEST_PASSED_WAITING_HR`);

    // Also check for failed attempts that need status update
    const failedAttempts = await prisma.skillTestAttempt.findMany({
        where: {
            isPassed: false,
        },
        select: {
            candidateId: true,
            skillBucketId: true,
            score: true,
        },
    });

    let failedUpdatedCount = 0;

    for (const attempt of failedAttempts) {
        // Check if there's a passed attempt for this candidate/skill (if so, skip)
        const hasPassedAttempt = passedAttempts.some(
            p => p.candidateId === attempt.candidateId && p.skillBucketId === attempt.skillBucketId
        );

        if (hasPassedAttempt) continue;

        // Find applications still showing as pending test
        const applicationsToUpdate = await prisma.jobApplication.findMany({
            where: {
                candidateId: attempt.candidateId,
                Job: {
                    skillBucketId: attempt.skillBucketId,
                },
                status: {
                    in: ['APPLIED', 'TEST_PENDING', 'TEST_REQUIRED', 'TEST_IN_PROGRESS'],
                },
            },
            select: { id: true },
        });

        if (applicationsToUpdate.length > 0) {
            await prisma.jobApplication.updateMany({
                where: {
                    id: { in: applicationsToUpdate.map(a => a.id) },
                },
                data: {
                    status: 'TEST_FAILED',
                    testScore: attempt.score,
                },
            });
            failedUpdatedCount += applicationsToUpdate.length;
        }
    }

    console.log(`✅ Updated ${failedUpdatedCount} application(s) to TEST_FAILED`);
    console.log('\n🎉 Done!');
}

fixApplicationStatuses()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
