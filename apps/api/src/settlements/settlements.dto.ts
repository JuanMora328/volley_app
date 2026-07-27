import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDivisibleBy,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { PaymentMethod } from '@volleyflow/shared';

export class SettlementDto {
  @IsUUID() championTeamId!: string;
  @Type(() => Number) @IsInt() @Min(0) courtHourlyPrice!: number;
  @Type(() => Number) @IsInt() @Min(30) @IsDivisibleBy(30) courtDurationMinutes!: number;
  @Type(() => Number) @IsInt() @Min(0) gatoradePrice!: number;
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) courtParticipantIds?: string[];
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) gatoradeParticipantIds?: string[];
}
export class PaymentDto {
  @Type(() => Number) @IsInt() @Min(0) amountPaid!: number;
  @IsOptional() @IsEnum(PaymentMethod) paymentMethod?: PaymentMethod | null;
}
export class FinishDto {
  @IsOptional() @IsBoolean() confirmPendingPayments = false;
}
