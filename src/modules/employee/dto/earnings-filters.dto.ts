import { IsOptional, IsIn, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class EarningsFiltersDto {
    @IsOptional()
    @IsIn(['ALL', 'PENDING', 'ELIGIBLE', 'PROCESSING', 'PAID', 'CANCELLED'])
    status?: string;

    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @IsOptional()
    @IsDateString()
    toDate?: string;

    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;
}
