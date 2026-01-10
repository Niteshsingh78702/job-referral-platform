import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreatePaymentOrderDto {
    @IsString()
    applicationId: string;
}

export class VerifyPaymentDto {
    @IsString()
    razorpayOrderId: string;

    @IsString()
    razorpayPaymentId: string;

    @IsString()
    razorpaySignature: string;
}

export class RequestRefundDto {
    @IsString()
    paymentId: string;

    @IsString()
    reason: string;
}

export class ProcessRefundDto {
    @IsString()
    @IsOptional()
    adminNotes?: string;
}
