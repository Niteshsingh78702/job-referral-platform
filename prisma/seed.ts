// Seed script for Job Referral Platform
// Run with: npx ts-node prisma/seed.ts

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...\n');

    // 1. Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@jobrefer.com' },
        update: {},
        create: {
            email: 'admin@jobrefer.com',
            passwordHash: adminPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });
    console.log('✅ Admin user created:', admin.email);

    // 2. Create HR User
    const hrPassword = await bcrypt.hash('hr123456', 10);
    const hrUser = await prisma.user.upsert({
        where: { email: 'hr@google.com' },
        update: {},
        create: {
            email: 'hr@google.com',
            passwordHash: hrPassword,
            role: 'HR',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    const hr = await prisma.hR.upsert({
        where: { userId: hrUser.id },
        update: {},
        create: {
            userId: hrUser.id,
            companyName: 'Google',
            companyEmail: 'hr@google.com',
            companyWebsite: 'https://google.com',
            designation: 'HR Manager',
            approvalStatus: 'APPROVED',
            approvedAt: new Date(),
        },
    });
    console.log('✅ HR user created:', hrUser.email);

    // 3. Create a Test with Questions
    const test = await prisma.test.upsert({
        where: { id: 'test-software-engineer-1' },
        update: {},
        create: {
            id: 'test-software-engineer-1',
            title: 'Software Engineer Assessment',
            description: 'Technical assessment for software engineering roles',
            duration: 30,
            passingScore: 70,
            totalQuestions: 10,
            shuffleQuestions: true,
            maxTabSwitches: 3,
            difficulty: 'MEDIUM',
        },
    });

    // Create test questions
    const questions = [
        {
            question: 'What is the time complexity of binary search?',
            options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
            correctAnswer: 1,
            explanation: 'Binary search divides the search space in half each time, giving O(log n) complexity.',
        },
        {
            question: 'Which data structure uses LIFO (Last In First Out) principle?',
            options: ['Queue', 'Stack', 'Array', 'Linked List'],
            correctAnswer: 1,
            explanation: 'Stack follows LIFO - the last element added is the first to be removed.',
        },
        {
            question: 'What does REST stand for?',
            options: ['Representational State Transfer', 'Remote Execution State Transfer', 'Reliable State Transaction', 'Request State Transfer'],
            correctAnswer: 0,
            explanation: 'REST stands for Representational State Transfer, an architectural style for APIs.',
        },
        {
            question: 'Which of the following is NOT a JavaScript framework?',
            options: ['React', 'Angular', 'Django', 'Vue'],
            correctAnswer: 2,
            explanation: 'Django is a Python web framework, not JavaScript.',
        },
        {
            question: 'What is the purpose of a primary key in a database?',
            options: ['To encrypt data', 'To uniquely identify each record', 'To join tables', 'To sort data'],
            correctAnswer: 1,
            explanation: 'A primary key uniquely identifies each record in a database table.',
        },
        {
            question: 'Which HTTP method is used to update a resource?',
            options: ['GET', 'POST', 'PUT', 'DELETE'],
            correctAnswer: 2,
            explanation: 'PUT is used to update/replace a resource on the server.',
        },
        {
            question: 'What is the output of: console.log(typeof null)?',
            options: ['"null"', '"undefined"', '"object"', '"boolean"'],
            correctAnswer: 2,
            explanation: 'This is a known quirk in JavaScript - typeof null returns "object".',
        },
        {
            question: 'Which sorting algorithm has the best average-case time complexity?',
            options: ['Bubble Sort', 'Quick Sort', 'Selection Sort', 'Insertion Sort'],
            correctAnswer: 1,
            explanation: 'Quick Sort has O(n log n) average case, better than O(n²) for others.',
        },
        {
            question: 'What does SQL stand for?',
            options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'System Query Language'],
            correctAnswer: 0,
            explanation: 'SQL stands for Structured Query Language.',
        },
        {
            question: 'Which of the following is a NoSQL database?',
            options: ['MySQL', 'PostgreSQL', 'MongoDB', 'Oracle'],
            correctAnswer: 2,
            explanation: 'MongoDB is a document-based NoSQL database.',
        },
    ];

    for (let i = 0; i < questions.length; i++) {
        await prisma.testQuestion.upsert({
            where: { id: `question-${i + 1}` },
            update: {},
            create: {
                id: `question-${i + 1}`,
                testId: test.id,
                question: questions[i].question,
                options: questions[i].options,
                correctAnswer: questions[i].correctAnswer,
                explanation: questions[i].explanation,
                points: 1,
                orderIndex: i,
            },
        });
    }
    console.log('✅ Test created with', questions.length, 'questions');

    // 4. Create Sample Jobs
    const jobs = [
        {
            slug: 'senior-software-engineer-google',
            title: 'Senior Software Engineer',
            description: 'Join our team to build world-class products that impact billions of users. We are looking for experienced engineers who can design and implement scalable solutions.',
            requirements: '5+ years of experience in software development. Strong knowledge of data structures and algorithms.',
            responsibilities: 'Design and develop large-scale distributed systems. Mentor junior engineers. Participate in code reviews.',
            companyName: 'Google',
            location: 'Bangalore',
            isRemote: false,
            salaryMin: 4000000,
            salaryMax: 6000000,
            experienceMin: 5,
            experienceMax: 8,
            skills: ['React', 'Node.js', 'TypeScript', 'System Design', 'AWS'],
            isHot: true,
        },
        {
            slug: 'product-manager-microsoft',
            title: 'Product Manager',
            description: 'Lead product strategy and roadmap for our cloud services. Work with engineering and design teams to deliver impactful products.',
            requirements: '3+ years of product management experience. MBA preferred.',
            responsibilities: 'Define product vision and strategy. Work with stakeholders to prioritize features. Analyze market trends.',
            companyName: 'Microsoft',
            location: 'Hyderabad',
            isRemote: false,
            salaryMin: 3500000,
            salaryMax: 5000000,
            experienceMin: 3,
            experienceMax: 6,
            skills: ['Product Strategy', 'Agile', 'SQL', 'User Research'],
            isHot: false,
        },
        {
            slug: 'data-scientist-amazon',
            title: 'Data Scientist',
            description: 'Apply machine learning and statistical techniques to solve complex business problems. Work with large datasets to derive insights.',
            requirements: '2+ years experience in data science. Strong Python skills.',
            responsibilities: 'Build ML models. Analyze data patterns. Present findings to stakeholders.',
            companyName: 'Amazon',
            location: 'Remote',
            isRemote: true,
            salaryMin: 2500000,
            salaryMax: 4000000,
            experienceMin: 2,
            experienceMax: 4,
            skills: ['Python', 'Machine Learning', 'AWS', 'TensorFlow'],
            isHot: false,
        },
        {
            slug: 'frontend-developer-flipkart',
            title: 'Frontend Developer',
            description: 'Build amazing user experiences for India\'s leading e-commerce platform. Work with modern JavaScript frameworks.',
            requirements: '2+ years experience in frontend development. React expertise required.',
            responsibilities: 'Develop responsive web applications. Optimize for performance. Collaborate with designers.',
            companyName: 'Flipkart',
            location: 'Bangalore',
            isRemote: false,
            salaryMin: 2000000,
            salaryMax: 3500000,
            experienceMin: 2,
            experienceMax: 5,
            skills: ['React', 'JavaScript', 'CSS', 'HTML5'],
            isHot: false,
        },
        {
            slug: 'devops-engineer-swiggy',
            title: 'DevOps Engineer',
            description: 'Manage infrastructure and CI/CD pipelines for high-traffic food delivery platform. Ensure 99.99% uptime.',
            requirements: '3+ years in DevOps. Strong Kubernetes experience.',
            responsibilities: 'Manage cloud infrastructure. Automate deployments. Monitor system health.',
            companyName: 'Swiggy',
            location: 'Bangalore',
            isRemote: false,
            salaryMin: 2500000,
            salaryMax: 4500000,
            experienceMin: 3,
            experienceMax: 6,
            skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform'],
            isHot: true,
        },
        {
            slug: 'backend-engineer-zomato',
            title: 'Backend Engineer',
            description: 'Build scalable backend services for food delivery and restaurant discovery platform.',
            requirements: '2+ years backend experience. Go or Python preferred.',
            responsibilities: 'Design APIs. Optimize database queries. Build microservices.',
            companyName: 'Zomato',
            location: 'Delhi NCR',
            isRemote: false,
            salaryMin: 1800000,
            salaryMax: 3000000,
            experienceMin: 2,
            experienceMax: 4,
            skills: ['Go', 'PostgreSQL', 'Redis', 'gRPC'],
            isHot: false,
        },
    ];

    for (const jobData of jobs) {
        const job = await prisma.job.upsert({
            where: { slug: jobData.slug },
            update: {},
            create: {
                slug: jobData.slug,
                title: jobData.title,
                description: jobData.description,
                requirements: jobData.requirements,
                responsibilities: jobData.responsibilities,
                companyName: jobData.companyName,
                location: jobData.location,
                isRemote: jobData.isRemote,
                salaryMin: jobData.salaryMin,
                salaryMax: jobData.salaryMax,
                experienceMin: jobData.experienceMin,
                experienceMax: jobData.experienceMax,
                status: 'ACTIVE',
                testId: test.id,
                hrId: hr.id,
                referralFee: 499,
                postedAt: new Date(),
            },
        });

        // Add skills
        for (const skill of jobData.skills) {
            await prisma.jobSkill.upsert({
                where: { jobId_name: { jobId: job.id, name: skill } },
                update: {},
                create: {
                    jobId: job.id,
                    name: skill,
                    isRequired: true,
                },
            });
        }
    }
    console.log('✅ Created', jobs.length, 'jobs with skills');

    // 5. Create a test candidate
    const candidatePassword = await bcrypt.hash('test123456', 10);
    const candidateUser = await prisma.user.upsert({
        where: { email: 'candidate@test.com' },
        update: {},
        create: {
            email: 'candidate@test.com',
            passwordHash: candidatePassword,
            role: 'CANDIDATE',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    await prisma.candidate.upsert({
        where: { userId: candidateUser.id },
        update: {},
        create: {
            userId: candidateUser.id,
            firstName: 'Test',
            lastName: 'User',
            headline: 'Software Engineer',
            city: 'Bangalore',
            country: 'India',
            totalExperience: 3,
        },
    });
    console.log('✅ Test candidate created:', candidateUser.email);

    // 6. Create a test employee
    const employeePassword = await bcrypt.hash('emp123456', 10);
    const employeeUser = await prisma.user.upsert({
        where: { email: 'employee@google.com' },
        update: {},
        create: {
            email: 'employee@google.com',
            passwordHash: employeePassword,
            role: 'EMPLOYEE',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });

    await prisma.employee.upsert({
        where: { userId: employeeUser.id },
        update: {},
        create: {
            userId: employeeUser.id,
            companyName: 'Google',
            companyEmail: 'employee@google.com',
            designation: 'Senior Software Engineer',
            isVerified: true,
        },
    });
    console.log('✅ Test employee created:', employeeUser.email);

    // 7. Create Commission Tiers
    console.log('📊 Seeding Commission Tiers...');

    const tiers = [
        {
            name: 'Bronze',
            minReferrals: 0,
            commissionPercent: 10.0,
            bonusPerReferral: 0,
            description: 'Starting tier for new employees',
            badgeIcon: '🥉',
        },
        {
            name: 'Silver',
            minReferrals: 5,
            commissionPercent: 15.0,
            bonusPerReferral: 100,
            description: 'Achieved after 5 successful referrals',
            badgeIcon: '🥈',
        },
        {
            name: 'Gold',
            minReferrals: 15,
            commissionPercent: 20.0,
            bonusPerReferral: 250,
            description: 'Elite tier for top referrers',
            badgeIcon: '🥇',
        },
        {
            name: 'Platinum',
            minReferrals: 30,
            commissionPercent: 25.0,
            bonusPerReferral: 500,
            description: 'Legendary tier for referral champions',
            badgeIcon: '💎',
        },
    ];

    for (const tier of tiers) {
        await prisma.commissionTier.upsert({
            where: { name: tier.name },
            update: {},
            create: tier,
        });
    }

    console.log('✅ Commission Tiers seeded successfully!');

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('--- Login Credentials ---');
    console.log('Admin:     admin@jobrefer.com / admin123');
    console.log('HR:        hr@google.com / hr123456');
    console.log('Employee:  employee@google.com / emp123456');
    console.log('Candidate: candidate@test.com / test123456');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
