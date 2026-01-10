import { ReferralStatus, ReferralType } from '../../../common/constants';
export declare class ConfirmReferralDto {
    type?: ReferralType;
}
export declare class UpdateReferralStatusDto {
    status: ReferralStatus;
    feedback?: string;
}
