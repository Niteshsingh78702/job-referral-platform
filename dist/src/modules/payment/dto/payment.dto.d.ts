export declare class CreatePaymentOrderDto {
    applicationId: string;
}
export declare class VerifyPaymentDto {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}
export declare class RequestRefundDto {
    paymentId: string;
    reason: string;
}
export declare class ProcessRefundDto {
    adminNotes?: string;
}
