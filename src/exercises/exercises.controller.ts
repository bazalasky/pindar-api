import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createExercise(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateExerciseDto,
  ) {
    const userId = req.user.userId;
    return this.exercisesService.create(userId, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.exercisesService.findAllForUser(userId);
  }
}
