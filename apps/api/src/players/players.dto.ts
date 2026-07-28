import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { GameSessionStatus } from '@volleyflow/shared';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
export enum RecordStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ALL = 'all',
}
export enum PlayerSort {
  NAME = 'name',
  LEVEL = 'defaultLevel',
  CREATED_AT = 'createdAt',
}
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class CreatePlayerDto {
  @Transform(trim) @IsString() @MaxLength(120) name!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) defaultLevel!: number;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(1000) notes?: string | null;
}
export class UpdatePlayerDto {
  @IsOptional() @Transform(trim) @IsString() @MaxLength(120) name?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) defaultLevel?: number;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(1000) notes?: string | null;
}
export class UpdateStatusDto {
  @IsBoolean() active!: boolean;
}
export class ListPlayersDto {
  @IsOptional() @Transform(trim) @IsString() search?: string;
  @IsOptional() @IsEnum(RecordStatus) status: RecordStatus = RecordStatus.ACTIVE;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 12;
  @IsOptional() @IsEnum(PlayerSort) sortBy: PlayerSort = PlayerSort.NAME;
  @IsOptional() @IsEnum(SortOrder) sortOrder: SortOrder = SortOrder.ASC;
}
export class PlayerSessionsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 10;
  @IsOptional() @IsEnum(GameSessionStatus) status?: GameSessionStatus;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
  @IsOptional() @IsIn(['ASC', 'DESC']) sortOrder: 'ASC' | 'DESC' = 'DESC';
  @IsOptional()
  @IsIn(['NOT_REQUIRED', 'PENDING', 'PARTIAL', 'PAID', 'CREDIT'])
  paymentStatus?: string;
}
