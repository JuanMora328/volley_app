import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
  Max,
  Min,
  ValidateNested,
  Equals,
} from 'class-validator';
import { GameSessionStatus } from '@volleyflow/shared';
export class CreateSessionDto {
  @IsDateString() date!: string;
  @IsOptional() @IsString() startTime?: string | null;
  @IsOptional() @IsUUID() venueId?: string | null;
  @IsOptional() @IsString() venueName?: string;
  @IsInt() @Min(0) courtPrice!: number;
  @IsInt() @Min(0) gatoradePrice!: number;
  @IsInt() @Min(2) teamCount!: number;
  @IsInt() @Min(1) defaultTargetScore!: number;
}
export class DeleteSessionDto {
  @Equals('ELIMINAR') confirmation!: string;
}
export class UpdateSessionDto extends PartialType(CreateSessionDto) {}
export class ListSessionsDto {
  @IsOptional() @IsEnum(GameSessionStatus) status?: GameSessionStatus;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() participantSearch?: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
  @IsOptional()
  @IsIn(['UNSETTLED', 'CLEAR', 'PENDING', 'PARTIAL', 'CREDIT'])
  financialStatus?: string;
  @IsOptional() @Type(() => Boolean) @IsBoolean() hasChampion?: boolean;
  @IsOptional() @IsIn(['ASC', 'DESC']) sortOrder: 'ASC' | 'DESC' = 'DESC';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
export class HistorySummaryDto {
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
}
export class AddSessionPlayerItemDto {
  @IsUUID() playerId!: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) levelSnapshot?: number;
}
export class AddSessionPlayersDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AddSessionPlayerItemDto)
  players!: AddSessionPlayerItemDto[];
}
export class UpdateSessionPlayerDto {
  @IsOptional() @IsInt() @Min(1) @Max(5) levelSnapshot?: number;
  @IsOptional() @IsBoolean() includedInCourtSplit?: boolean;
  @IsOptional() @IsBoolean() includedInGatoradeSplit?: boolean;
}
export class GenerateTeamsDto {
  @IsOptional() seed?: string | number;
}
export class TeamCompositionDto {
  @IsOptional() @IsUUID() id?: string;
  @IsString() name!: string;
  @IsOptional() @IsString() color?: string | null;
  @IsArray() @ArrayNotEmpty() @IsUUID('4', { each: true }) sessionPlayerIds!: string[];
}
export class SaveTeamsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TeamCompositionDto)
  teams!: TeamCompositionDto[];
}
