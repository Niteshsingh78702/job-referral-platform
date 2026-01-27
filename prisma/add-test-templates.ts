/**
 * Migration script to add TestTemplates to existing SkillBuckets
 * that have a Test but no TestTemplate linked.
 * 
 * Run with: npx ts-node prisma/add-test-templates.ts
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Finding skill buckets with Test but no TestTemplate...');

    // Find skill buckets that have testId but no testTemplateId
    const bucketsWithoutTemplate = await prisma.skillBucket.findMany({
        where: {
            testId: { not: null },
            testTemplateId: null,
        },
        include: {
            Test: true,
        },
    });

    console.log(`📦 Found ${bucketsWithoutTemplate.length} skill buckets needing TestTemplate`);

    for (const bucket of bucketsWithoutTemplate) {
        if (!bucket.Test) {
            console.log(`⚠️ Skipping ${bucket.name} - no Test found`);
            continue;
        }

        console.log(`\n🔧 Processing: ${bucket.name} (${bucket.code})`);
        console.log(`   Existing Test: ${bucket.Test.title}`);

        // Create TestTemplate based on existing Test
        const testTemplate = await prisma.testTemplate.create({
            data: {
                id: randomUUID(),
                name: bucket.Test.title,
                description: bucket.Test.description,
                duration: bucket.Test.duration || 20,
                passingCriteria: bucket.Test.passingScore || 70,
                testValidityDays: bucket.Test.validityDays || 7,
                questionPoolSize: bucket.Test.totalQuestions || 20,
                selectionRoleType: bucket.code, // Links to QuestionBank roleType
                isActive: bucket.Test.isActive,
                updatedAt: new Date(),
            },
        });

        console.log(`   ✅ Created TestTemplate: ${testTemplate.id}`);

        // Link TestTemplate to SkillBucket
        await prisma.skillBucket.update({
            where: { id: bucket.id },
            data: { testTemplateId: testTemplate.id },
        });

        console.log(`   ✅ Linked TestTemplate to ${bucket.name}`);
    }

    console.log('\n✨ Migration complete!');

    // Verify
    const verified = await prisma.skillBucket.findMany({
        where: { testTemplateId: { not: null } },
        select: { name: true, code: true, testTemplateId: true },
    });

    console.log('\n📋 Skill buckets with TestTemplate:');
    verified.forEach(b => console.log(`   - ${b.name} (${b.code}): ${b.testTemplateId}`));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
