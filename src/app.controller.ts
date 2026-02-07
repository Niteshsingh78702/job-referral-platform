import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Public()
  @Get('testimonials')
  async getPublicTestimonials(@Query('limit') limit?: number) {
    return this.appService.getPublicTestimonials(limit || 6);
  }

  @Public()
  @Get('settings/public')
  async getPublicSettings() {
    return this.appService.getPublicSettings();
  }
}

