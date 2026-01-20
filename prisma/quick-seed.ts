/**
 * Quick Seed Script for E2E Testing
 * Run: npx ts-node prisma/quick-seed.ts
 */

import { PrismaClient, UserRole, UserStatus, JobStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Quick seeding for E2E tests...\n');

    // Create Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@jobrefer.com' },
        update: {},
        create: {
            id: randomUUID(),
            email: 'admin@jobrefer.com',
            passwordHash: adminPassword,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            emailVerified: true,
            updatedAt: new Date(),
        },
    });
    console.log('✅ Admin created:', admin.email);

    // Create HR User
    const hrPassword = await bcrypt.hash('hr123', 10);
    const hrUser = await prisma.user.upsert({
        where: { email: 'hr@test.com' },
        update: {},
        create: {
            id: randomUUID(),
            email: 'hr@test.com',
            passwordHash: hrPassword,
            role: UserRole.HR,
            status: UserStatus.ACTIVE,
            emailVerified: true,
            updatedAt: new Date(),
        },
    });
    console.log('✅ HR User created:', hrUser.email);

    // Create HR Profile (using correct model name 'HR')
    const hrProfile = await prisma.hR.upsert({
        where: { userId: hrUser.id },
        update: {},
        create: {
            id: randomUUID(),
            userId: hrUser.id,
            companyName: 'Test Company',
            companyEmail: 'hr@testcompany.com',
            designation: 'HR Manager',
            approvalStatus: 'APPROVED',
            updatedAt: new Date(),
        },
    });
    console.log('✅ HR Profile created');

    // Create Skill Bucket
    const skillBucket = await prisma.skillBucket.upsert({
        where: { code: 'JAVA_BACKEND' },
        update: {},
        create: {
            id: randomUUID(),
            code: 'JAVA_BACKEND',
            name: 'Java Backend',
            description: 'Java Backend Development Skills',
            displayName: 'Java Backend Test',
            experienceMin: 1,
            experienceMax: 3,
            isActive: true,
            updatedAt: new Date(),
        },
    });
    console.log('✅ Skill Bucket created:', skillBucket.code);

    // Create a Job (using hrId field)
    const job = await prisma.job.upsert({
        where: { slug: 'java-backend-developer-test' },
        update: {},
        create: {
            id: randomUUID(),
            slug: 'java-backend-developer-test',
            title: 'Java Backend Developer',
            description: 'E2E Test Job for Java developers',
            companyName: 'Test Company',
            location: 'Remote',
            status: JobStatus.ACTIVE,
            salaryMin: 500000,
            salaryMax: 1000000,
            experienceMin: 1,
            experienceMax: 3,
            referralFee: 1000,
            hrId: hrProfile.id,
            skillBucketId: skillBucket.id,
            postedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
        },
    });
    console.log('✅ Job created:', job.title);

    console.log('\n📋 Test Credentials:');
    console.log('  Admin: admin@jobrefer.com / admin123');
    console.log('  HR: hr@test.com / hr123');
    console.log('\n✨ Quick seed complete!');
}

main()
    .catch(e => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

