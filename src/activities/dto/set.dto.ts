import { IsDecimal, IsInt, IsOptional, Min } from 'class-validator';

export class SetDto {
  @IsInt()
  exerciseId!: number;

  @IsInt()
  @Min(1)
  setNumber!: number;

  @IsInt()
  @Min(1)
  reps!: number;

  @IsOptional()
  @IsDecimal()
  weight?: string;

  @IsOptional()
  @IsDecimal()
  rpe?: string;
}
