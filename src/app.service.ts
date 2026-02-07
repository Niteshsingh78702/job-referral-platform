import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) { }

  getHello(): string {
    return 'Hello World!';
  }

  async getPublicTestimonials(limit = 6) {
    return this.prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  async getPublicSettings() {
    const settings = await this.prisma.siteSettings.findMany({
      where: {
        key: { in: ['interviews_scheduled', 'candidates_selected'] },
      },
    });

    const result = {
      interviewsScheduled: 127,
      candidatesSelected: 38,
    };

    settings.forEach((s) => {
      if (s.key === 'interviews_scheduled') result.interviewsScheduled = parseInt(s.value) || 127;
      if (s.key === 'candidates_selected') result.candidatesSelected = parseInt(s.value) || 38;
    });

    return result;
  }
}

