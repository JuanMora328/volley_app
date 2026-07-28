import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() organizationName?: string;
  @IsOptional() @IsInt() @Min(2) defaultTeamCount?: number;
  @IsOptional() @IsInt() @Min(1) defaultTargetScore?: number;
  @IsOptional() @IsInt() @Min(0) defaultCourtPrice?: number;
  @IsOptional() @IsInt() @Min(0) defaultGatoradePrice?: number;
  @IsOptional() @IsUUID() defaultVenueId?: string | null;
  @IsOptional() @IsString() timezone?: string;
}
