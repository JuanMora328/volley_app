import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { MatchStatus } from '@volleyflow/shared';
export class DrawDto {
  @IsOptional() seed?: string | number;
}
export class ResultDto {
  @IsInt() @Min(0) teamAScore!: number;
  @IsInt() @Min(0) teamBScore!: number;
}
export class TargetScoreDto {
  @IsInt() @Min(1) targetScore!: number;
}
export class MatchListDto {
  @IsOptional() @IsEnum(MatchStatus) status?: MatchStatus;
  @IsOptional() @IsIn(['ASC', 'DESC']) order: 'ASC' | 'DESC' = 'DESC';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit = 50;
}
export class DeleteSessionDto {
  @IsIn(['ELIMINAR']) confirmation!: 'ELIMINAR';
}
