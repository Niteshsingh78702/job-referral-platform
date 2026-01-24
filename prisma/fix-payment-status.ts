/**
 * Fix Payment Status Script
 * 
 * This script fixes existing Interview records where:
 * - Payment status is SUCCESS
 * - But Interview.status is still INTERVIEW_CONFIRMED (should be PAYMENT_SUCCESS)
 * 
 * Run with: npx ts-node prisma/fix-payment-status.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPaymentStatus() {
    console.log('🔍 Finding interviews with payment mismatch...\n');

    // Find all payments with SUCCESS status
    const successfulPayments = await prisma.payment.findMany({
        where: {
            status: 'SUCCESS',
        },
        include: {
            JobApplication: {
                include: {
                    Interview: true,
                },
            },
        },
    });

    console.log(`Found ${successfulPayments.length} successful payments\n`);

    let fixedCount = 0;

    for (const payment of successfulPayments) {
        const interview = payment.JobApplication?.Interview;

        if (!interview) {
            console.log(`⚠️ Payment ${payment.id} has no interview`);
            continue;
        }

        // Check if interview status needs fixing
        if (interview.status === 'INTERVIEW_CONFIRMED' || interview.paymentStatus !== 'SUCCESS') {
            console.log(`🔧 Fixing Interview ${interview.id}:`);
            console.log(`   Current status: ${interview.status}`);
            console.log(`   Current paymentStatus: ${interview.paymentStatus}`);

            // Update interview status
            await prisma.interview.update({
                where: { id: interview.id },
                data: {
                    status: 'PAYMENT_SUCCESS',
                    paymentStatus: 'SUCCESS',
                    paidAt: payment.paidAt || new Date(),
                },
            });

            // Also update application status
            await prisma.jobApplication.update({
                where: { id: payment.applicationId },
                data: {
                    status: 'PAYMENT_SUCCESS',
                    contactUnlockedAt: payment.paidAt || new Date(),
                },
            });

            console.log(`   ✅ Fixed to PAYMENT_SUCCESS\n`);
            fixedCount++;
        } else {
            console.log(`✓ Interview ${interview.id} already correct (status: ${interview.status})`);
        }
    }

    console.log(`\n✅ Fixed ${fixedCount} interview(s)`);
}

fixPaymentStatus()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
