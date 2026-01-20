/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('PENDING', 'ELIGIBLE', 'PROCESSING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InterviewMode" AS ENUM ('CALL', 'VIDEO', 'ONSITE');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('INTERVIEW_CONFIRMED', 'PAYMENT_PENDING', 'PAYMENT_SUCCESS', 'INTERVIEW_COMPLETED', 'CANDIDATE_NO_SHOW', 'HR_NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('TECHNICAL', 'BEHAVIORAL', 'APTITUDE', 'DOMAIN_SPECIFIC');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('STANDARD', 'RAPID_FIRE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ApplicationStatus" ADD VALUE 'INTERVIEW_REQUESTED';
ALTER TYPE "ApplicationStatus" ADD VALUE 'TEST_REQUIRED';
ALTER TYPE "ApplicationStatus" ADD VALUE 'TEST_IN_PROGRESS';
ALTER TYPE "ApplicationStatus" ADD VALUE 'INTERVIEW_CONFIRMED';
ALTER TYPE "ApplicationStatus" ADD VALUE 'PAYMENT_SUCCESS';
ALTER TYPE "ApplicationStatus" ADD VALUE 'INTERVIEW_COMPLETED';
ALTER TYPE "ApplicationStatus" ADD VALUE 'CANDIDATE_NO_SHOW';
ALTER TYPE "ApplicationStatus" ADD VALUE 'HR_NO_SHOW';
ALTER TYPE "ApplicationStatus" ADD VALUE 'REJECTED';

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_hrId_fkey";

-- DropForeignKey
ALTER TABLE "TestSession" DROP CONSTRAINT "TestSession_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "TestSession" DROP CONSTRAINT "TestSession_testId_fkey";

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "skillBucketId" TEXT,
ALTER COLUMN "hrId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TestSession" ADD COLUMN     "answeredCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "selectedQuestionIds" TEXT[],
ADD COLUMN     "testTemplateId" TEXT,
ALTER COLUMN "applicationId" DROP NOT NULL,
ALTER COLUMN "testId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authProvider" TEXT NOT NULL DEFAULT 'email',
ADD COLUMN     "googleId" TEXT;

-- CreateTable
CREATE TABLE "CommissionTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minReferrals" INTEGER NOT NULL,
    "commissionPercent" DOUBLE PRECISION NOT NULL,
    "bonusPerReferral" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "badgeIcon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeEarning" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "EarningStatus" NOT NULL DEFAULT 'PENDING',
    "bonusAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonusReason" TEXT,
    "tierName" TEXT,
    "commissionRate" DOUBLE PRECISION,
    "processedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "payoutReference" TEXT,
    "payoutMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "mode" "InterviewMode" NOT NULL,
    "preferredTimeWindow" TEXT,
    "hrNotes" TEXT,
    "status" "InterviewStatus" NOT NULL DEFAULT 'PAYMENT_PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'ELIGIBLE',
    "scheduledDate" TIMESTAMP(3),
    "scheduledTime" TEXT,
    "interviewLink" TEXT,
    "callDetails" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRequiredSkillBucket" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "skillBucketId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobRequiredSkillBucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBank" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctAnswer" INTEGER NOT NULL,
    "explanation" TEXT,
    "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "category" "QuestionCategory" NOT NULL DEFAULT 'TECHNICAL',
    "tags" TEXT[],
    "roleType" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillBucket" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayName" TEXT,
    "experienceMin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "experienceMax" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "testId" TEXT,
    "testTemplateId" TEXT,

    CONSTRAINT "SkillBucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTestAttempt" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "skillBucketId" TEXT NOT NULL,
    "isPassed" BOOLEAN NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTill" TIMESTAMP(3),
    "retestAllowedAt" TIMESTAMP(3),
    "testSessionId" TEXT,

    CONSTRAINT "SkillTestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "testType" "TestType" NOT NULL DEFAULT 'RAPID_FIRE',
    "duration" INTEGER NOT NULL DEFAULT 20,
    "passingCriteria" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
    "testValidityDays" INTEGER NOT NULL DEFAULT 7,
    "retestCooldownHours" INTEGER NOT NULL DEFAULT 24,
    "questionPoolSize" INTEGER NOT NULL DEFAULT 100,
    "autoSelect" BOOLEAN NOT NULL DEFAULT true,
    "selectionTags" TEXT[],
    "selectionRoleType" TEXT,
    "allowSkip" BOOLEAN NOT NULL DEFAULT true,
    "showLiveScore" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TestTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommissionTier_name_key" ON "CommissionTier"("name");

-- CreateIndex
CREATE INDEX "CommissionTier_minReferrals_idx" ON "CommissionTier"("minReferrals");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeEarning_referralId_key" ON "EmployeeEarning"("referralId");

-- CreateIndex
CREATE INDEX "EmployeeEarning_createdAt_idx" ON "EmployeeEarning"("createdAt");

-- CreateIndex
CREATE INDEX "EmployeeEarning_employeeId_idx" ON "EmployeeEarning"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeEarning_status_idx" ON "EmployeeEarning"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Interview_applicationId_key" ON "Interview"("applicationId");

-- CreateIndex
CREATE INDEX "Interview_applicationId_idx" ON "Interview"("applicationId");

-- CreateIndex
CREATE INDEX "Interview_paymentStatus_idx" ON "Interview"("paymentStatus");

-- CreateIndex
CREATE INDEX "Interview_status_idx" ON "Interview"("status");

-- CreateIndex
CREATE INDEX "JobRequiredSkillBucket_jobId_idx" ON "JobRequiredSkillBucket"("jobId");

-- CreateIndex
CREATE INDEX "JobRequiredSkillBucket_skillBucketId_idx" ON "JobRequiredSkillBucket"("skillBucketId");

-- CreateIndex
CREATE UNIQUE INDEX "JobRequiredSkillBucket_jobId_skillBucketId_key" ON "JobRequiredSkillBucket"("jobId", "skillBucketId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "QuestionBank_category_idx" ON "QuestionBank"("category");

-- CreateIndex
CREATE INDEX "QuestionBank_createdAt_idx" ON "QuestionBank"("createdAt");

-- CreateIndex
CREATE INDEX "QuestionBank_difficulty_idx" ON "QuestionBank"("difficulty");

-- CreateIndex
CREATE INDEX "QuestionBank_roleType_isActive_idx" ON "QuestionBank"("roleType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SkillBucket_code_key" ON "SkillBucket"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SkillBucket_testId_key" ON "SkillBucket"("testId");

-- CreateIndex
CREATE INDEX "SkillBucket_code_idx" ON "SkillBucket"("code");

-- CreateIndex
CREATE INDEX "SkillBucket_isActive_idx" ON "SkillBucket"("isActive");

-- CreateIndex
CREATE INDEX "SkillTestAttempt_candidateId_idx" ON "SkillTestAttempt"("candidateId");

-- CreateIndex
CREATE INDEX "SkillTestAttempt_candidateId_skillBucketId_idx" ON "SkillTestAttempt"("candidateId", "skillBucketId");

-- CreateIndex
CREATE INDEX "SkillTestAttempt_skillBucketId_idx" ON "SkillTestAttempt"("skillBucketId");

-- CreateIndex
CREATE INDEX "SkillTestAttempt_validTill_idx" ON "SkillTestAttempt"("validTill");

-- CreateIndex
CREATE INDEX "TestTemplate_isActive_idx" ON "TestTemplate"("isActive");

-- CreateIndex
CREATE INDEX "TestTemplate_testType_idx" ON "TestTemplate"("testType");

-- CreateIndex
CREATE INDEX "Job_skillBucketId_idx" ON "Job"("skillBucketId");

-- CreateIndex
CREATE INDEX "TestSession_testTemplateId_idx" ON "TestSession"("testTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_googleId_idx" ON "User"("googleId");

-- AddForeignKey
ALTER TABLE "EmployeeEarning" ADD CONSTRAINT "EmployeeEarning_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEarning" ADD CONSTRAINT "EmployeeEarning_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_hrId_fkey" FOREIGN KEY ("hrId") REFERENCES "HR"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_skillBucketId_fkey" FOREIGN KEY ("skillBucketId") REFERENCES "SkillBucket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequiredSkillBucket" ADD CONSTRAINT "JobRequiredSkillBucket_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequiredSkillBucket" ADD CONSTRAINT "JobRequiredSkillBucket_skillBucketId_fkey" FOREIGN KEY ("skillBucketId") REFERENCES "SkillBucket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillBucket" ADD CONSTRAINT "SkillBucket_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillBucket" ADD CONSTRAINT "SkillBucket_testTemplateId_fkey" FOREIGN KEY ("testTemplateId") REFERENCES "TestTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTestAttempt" ADD CONSTRAINT "SkillTestAttempt_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTestAttempt" ADD CONSTRAINT "SkillTestAttempt_skillBucketId_fkey" FOREIGN KEY ("skillBucketId") REFERENCES "SkillBucket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_testTemplateId_fkey" FOREIGN KEY ("testTemplateId") REFERENCES "TestTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
