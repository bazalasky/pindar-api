import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateLiftActivityDto } from './dto/create-lift-activity.dto';
import { CreateRunActivityDto } from './dto/create-run-activity.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UpdateLiftActivityDto } from './dto/update-lift-activity.dto';
import { UpdateRunActivityDto } from './dto/update-run-activity.dto';

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

  @Patch('lift/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateLift(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLiftActivityDto,
  ) {
    return this.activitiesService.updateLift(req.user.userId, id, dto);
  }

  @Patch('run/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateRun(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRunActivityDto,
  ) {
    return this.activitiesService.updateRun(req.user.userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(204)
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.activitiesService.remove(req.user.userId, id);
  }
}
