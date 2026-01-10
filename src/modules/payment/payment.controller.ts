import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Req,
    Headers,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import {
    CreatePaymentOrderDto,
    VerifyPaymentDto,
    RequestRefundDto,
} from './dto';
import { Public, CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/constants';

@Controller('payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('create-order')
    @Roles(UserRole.CANDIDATE)
    async createOrder(
        @CurrentUser('sub') userId: string,
        @Body() dto: CreatePaymentOrderDto,
    ) {
        return this.paymentService.createOrder(userId, dto);
    }

    @Post('verify')
    @Roles(UserRole.CANDIDATE)
    async verifyPayment(
        @CurrentUser('sub') userId: string,
        @Body() dto: VerifyPaymentDto,
    ) {
        return this.paymentService.verifyPayment(userId, dto);
    }

    @Public()
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Body() payload: any,
        @Headers('x-razorpay-signature') signature: string,
    ) {
        return this.paymentService.handleWebhook(payload, signature);
    }

    @Get('history')
    @Roles(UserRole.CANDIDATE)
    async getPaymentHistory(@CurrentUser('sub') userId: string) {
        return this.paymentService.getPaymentHistory(userId);
    }

    @Get(':id')
    @Roles(UserRole.CANDIDATE)
    async getPayment(
        @CurrentUser('sub') userId: string,
        @Param('id') paymentId: string,
    ) {
        return this.paymentService.getPaymentById(userId, paymentId);
    }

    @Post('refund/request')
    @Roles(UserRole.CANDIDATE)
    async requestRefund(
        @CurrentUser('sub') userId: string,
        @Body() dto: RequestRefundDto,
    ) {
        return this.paymentService.requestRefund(userId, dto);
    }
}
