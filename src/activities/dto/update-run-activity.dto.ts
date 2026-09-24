import { PartialType } from '@nestjs/mapped-types';
import { CreateRunActivityDto } from './create-run-activity.dto';

export class UpdateRunActivityDto extends PartialType(CreateRunActivityDto) {}
