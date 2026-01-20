import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('Adding Candidate user...\n');

    const password = await bcrypt.hash('test123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'candidate@test.com' },
        update: { passwordHash: password },
        create: {
            id: randomUUID(),
            email: 'candidate@test.com',
            passwordHash: password,
            role: UserRole.CANDIDATE,
            status: UserStatus.ACTIVE,
            emailVerified: true,
            updatedAt: new Date()
        }
    });
    console.log('✅ Candidate user:', user.email);

    const candidate = await prisma.candidate.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            id: randomUUID(),
            userId: user.id,
            firstName: 'Test',
            lastName: 'Candidate',
            updatedAt: new Date()
        }
    });
    console.log('✅ Candidate profile created');

    // Also add an Employee
    const empPassword = await bcrypt.hash('emp123', 10);
    const empUser = await prisma.user.upsert({
        where: { email: 'employee@test.com' },
        update: { passwordHash: empPassword },
        create: {
            id: randomUUID(),
            email: 'employee@test.com',
            passwordHash: empPassword,
            role: UserRole.EMPLOYEE,
            status: UserStatus.ACTIVE,
            emailVerified: true,
            updatedAt: new Date()
        }
    });
    console.log('✅ Employee user:', empUser.email);

    const employee = await prisma.employee.upsert({
        where: { userId: empUser.id },
        update: {},
        create: {
            id: randomUUID(),
            userId: empUser.id,
            companyName: 'Test Company',
            companyEmail: 'employee@testcompany.com',
            designation: 'Software Engineer',
            isVerified: true,
            updatedAt: new Date()
        }
    });
    console.log('✅ Employee profile created');

    console.log('\n📋 All Test Credentials:');
    console.log('  Admin:     admin@jobrefer.com / admin123');
    console.log('  HR:        hr@test.com / hr123');
    console.log('  Candidate: candidate@test.com / test123');
    console.log('  Employee:  employee@test.com / emp123');
    console.log('\n✨ Done!');
}

main()
    .catch(e => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
