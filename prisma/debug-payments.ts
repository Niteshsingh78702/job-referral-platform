/**
 * Debug Payment Status Script
 * 
 * Lists all payments and their statuses to understand the current state
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugPayments() {
    console.log('🔍 Listing all payments...\n');

    const payments = await prisma.payment.findMany({
        include: {
            JobApplication: {
                include: {
                    Interview: true,
                    Candidate: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    console.log(`Total payments: ${payments.length}\n`);

    for (const payment of payments) {
        const interview = payment.JobApplication?.Interview;
        const candidate = payment.JobApplication?.Candidate;

        console.log('━'.repeat(50));
        console.log(`Payment ID: ${payment.id}`);
        console.log(`  Status: ${payment.status}`);
        console.log(`  Amount: ₹${payment.amount}`);
        console.log(`  Created: ${payment.createdAt}`);
        console.log(`  Paid At: ${payment.paidAt || 'NOT PAID'}`);
        console.log(`  Razorpay Order ID: ${payment.razorpayOrderId}`);
        console.log(`  Razorpay Payment ID: ${payment.razorpayPaymentId || 'NOT SET'}`);
        console.log(`  Candidate: ${candidate?.firstName} ${candidate?.lastName}`);
        if (interview) {
            console.log(`  Interview Status: ${interview.status}`);
            console.log(`  Interview Payment Status: ${interview.paymentStatus}`);
        } else {
            console.log(`  Interview: NOT FOUND`);
        }
    }

    // Also list interviews
    console.log('\n\n🔍 Listing all interviews...\n');

    const interviews = await prisma.interview.findMany({
        include: {
            JobApplication: {
                include: {
                    Candidate: true,
                },
            },
        },
    });

    console.log(`Total interviews: ${interviews.length}\n`);

    for (const interview of interviews) {
        const candidate = interview.JobApplication?.Candidate;
        console.log('━'.repeat(50));
        console.log(`Interview ID: ${interview.id}`);
        console.log(`  Status: ${interview.status}`);
        console.log(`  Payment Status: ${interview.paymentStatus}`);
        console.log(`  Candidate: ${candidate?.firstName} ${candidate?.lastName}`);
        console.log(`  Paid At: ${interview.paidAt || 'NOT PAID'}`);
    }
}

debugPayments()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
