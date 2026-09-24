import { PartialType } from '@nestjs/mapped-types';
import { CreateLiftActivityDto } from './create-lift-activity.dto';

export class UpdateLiftActivityDto extends PartialType(CreateLiftActivityDto) {}
