import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ListPlayersDto } from '../players/players.dto';
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
export class CreateVenueDto {
  @Transform(trim) @IsString() @MaxLength(120) name!: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(300) address?: string | null;
  @Type(() => Number) @IsInt() @Min(0) @Max(2147483647) defaultCourtPrice!: number;
  @Type(() => Number) @IsInt() @Min(0) @Max(2147483647) defaultGatoradePrice!: number;
}
export class UpdateVenueDto {
  @IsOptional() @Transform(trim) @IsString() @MaxLength(120) name?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(300) address?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2147483647) defaultCourtPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2147483647) defaultGatoradePrice?: number;
}
export class ListVenuesDto extends ListPlayersDto {}
