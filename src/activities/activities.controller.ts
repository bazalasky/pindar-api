import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateLiftActivityDto } from './dto/create-lift-activity.dto';
import { CreateRunActivityDto } from './dto/create-run-activity.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post('lift')
  @UseGuards(AuthGuard('jwt'))
  async createLift(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateLiftActivityDto,
  ) {
    const userId = req.user.userId;
    return this.activitiesService.createLift(userId, dto);
  }

  @Post('run')
  @UseGuards(AuthGuard('jwt'))
  async createRun(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateRunActivityDto,
  ) {
    const userId = req.user.userId;
    return this.activitiesService.createRun(userId, dto);
  }

  @Get()
  async findAll() {
    return this.activitiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.activitiesService.findOne(id);
  }
}
