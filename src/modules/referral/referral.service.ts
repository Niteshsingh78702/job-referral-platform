import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfirmReferralDto, UpdateReferralStatusDto } from './dto';
import {
  ReferralStatus,
  ReferralType,
  ApplicationStatus,
} from '../../common/constants';

@Injectable()
export class ReferralService {
  constructor(private prisma: PrismaService) {}

  // Get pending referrals for HR
  async getPendingReferralsForHR(hrUserId: string) {
    const hr = await this.prisma.hR.findUnique({
      where: { userId: hrUserId },
    });

    if (!hr) {
      throw new NotFoundException('HR profile not found');
    }

    return this.prisma.referral.findMany({
      where: {
        status: { in: [ReferralStatus.PENDING, ReferralStatus.CONFIRMED] },
        JobApplication: {
          Job: {
            hrId: hr.id,
          },
        },
      },
      include: {
        JobApplication: {
          include: {
            Candidate: {
              select: {
                firstName: true,
                lastName: true,
                headline: true,
                totalExperience: true,
                currentCompany: true,
                JobSkill: true,
                // Don't include contact until payment
              },
            },
            Job: {
              select: {
                title: true,
                companyName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get pending referrals for Employee
  async getPendingReferralsForEmployee(employeeUserId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId: employeeUserId },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    // Get jobs at employee's company that need referrals
    return this.prisma.referral.findMany({
      where: {
        status: ReferralStatus.PENDING,
        type: ReferralType.Employee,
        OR: [
          { employeeId: employee.id },
          {
            JobApplication: {
              Job: {
                companyName: {
                  equals: employee.companyName,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      },
      include: {
        JobApplication: {
          include: {
            Candidate: {
              select: {
                firstName: true,
                lastName: true,
                headline: true,
                totalExperience: true,
                JobSkill: true,
              },
            },
            Job: {
              select: {
                title: true,
                companyName: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Confirm referral (HR or Employee)
  async confirmReferral(
    referralId: string,
    userId: string,
    userRole: string,
    dto: ConfirmReferralDto,
  ) {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        JobApplication: {
          include: {
            Job: { include: { HR: true } },
          },
        },
      },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    if (referral.status !== ReferralStatus.PENDING) {
      throw new BadRequestException('Referral is not in pending state');
    }

    // Verify authorization
    if (userRole === 'HR') {
      if (
        !referral.application.job.HR ||
        referral.application.job.hr.userId !== userId
      ) {
        throw new ForbiddenException('Not authorized to confirm this referral');
      }
    } else if (userRole === 'EMPLOYEE') {
      const employee = await this.prisma.employee.findUnique({
        where: { userId },
      });
      if (!employee) {
        throw new ForbiddenException('Employee profile not found');
      }
      // Verify employee is at the same company
      if (
        employee.companyName.toLowerCase() !==
        referral.application.job.companyName.toLowerCase()
      ) {
        throw new ForbiddenException(
          'Not authorized to refer for this company',
        );
      }
    }

    // Update referral
    const updatedReferral = await this.prisma.$transaction(async (tx) => {
      const ref = await tx.referral.update({
        where: { id: referralId },
        data: {
          status: ReferralStatus.CONFIRMED,
          confirmedAt: new Date(),
          type: dto.type || referral.type,
          ...(userRole === 'EMPLOYEE' && {
            employeeId: (await tx.employee.findUnique({ where: { userId } }))
              ?.id,
          }),
          ...(userRole === 'HR' && {
            hrId: (await tx.hR.findUnique({ where: { userId } }))?.id,
          }),
        },
      });

      // Update application status - keep as APPLIED (test passed, waiting for HR interview confirmation)
      await tx.jobApplication.update({
        where: { id: referral.applicationId },
        data: { status: ApplicationStatus.APPLIED },
      });

      return ref;
    });

    return updatedReferral;
  }

  // Mark as contacted
  async markAsContacted(referralId: string, userId: string, feedback?: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        JobApplication: {
          include: {
            Job: { include: { HR: true } },
          },
        },
      },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    // Only HR can mark as contacted
    if (
      !referral.application.job.HR ||
      referral.application.job.hr.userId !== userId
    ) {
      throw new ForbiddenException('Only HR can mark as contacted');
    }

    return this.prisma.referral.update({
      where: { id: referralId },
      data: {
        status: ReferralStatus.CONTACTED,
        contactedAt: new Date(),
        hrFeedback: feedback,
      },
    });
  }

  // Close referral
  async closeReferral(referralId: string, userId: string, feedback?: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        JobApplication: {
          include: {
            Job: { include: { HR: true } },
          },
        },
      },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    if (
      !referral.application.job.HR ||
      referral.application.job.hr.userId !== userId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.referral.update({
        where: { id: referralId },
        data: {
          status: ReferralStatus.CLOSED,
          closedAt: new Date(),
          hrFeedback: feedback,
        },
      });

      await tx.jobApplication.update({
        where: { id: referral.applicationId },
        data: { status: ApplicationStatus.REJECTED },
      });

      return { success: true };
    });
  }

  // Get referral history
  async getReferralHistory(userId: string, userRole: string) {
    if (userRole === 'HR') {
      const hr = await this.prisma.hR.findUnique({
        where: { userId },
      });
      if (!hr) {
        throw new NotFoundException('HR profile not found');
      }
      return this.prisma.referral.findMany({
        where: { hrId: hr.id },
        include: {
          JobApplication: {
            include: {
              Candidate: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              Job: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (userRole === 'EMPLOYEE') {
      const employee = await this.prisma.employee.findUnique({
        where: { userId },
      });
      if (!employee) {
        throw new NotFoundException('Employee profile not found');
      }
      return this.prisma.referral.findMany({
        where: { employeeId: employee.id },
        include: {
          JobApplication: {
            include: {
              Candidate: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              Job: {
                select: {
                  title: true,
                  companyName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    throw new BadRequestException('Invalid user role for referral history');
  }
}
