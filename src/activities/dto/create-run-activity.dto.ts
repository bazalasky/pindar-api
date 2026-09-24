import {
  IsDateString,
  IsDecimal,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateRunActivityDto {
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @IsInt()
  @Min(1)
  durationSeconds!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDecimal()
  bodyweight?: string;

  @IsOptional()
  @IsDecimal()
  distance?: string;

  @IsInt()
  @IsOptional()
  elevation?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  heartRate?: number;
}
