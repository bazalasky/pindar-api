import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLiftActivityDto } from './dto/create-lift-activity.dto';
import { Prisma, Type } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const ACTIVITY_INCLUDE = {
  liftActivity: { include: { sets: { include: { exercise: true } } } },
  runActivity: true,
} satisfies Prisma.ActivityInclude;

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async createLift(userId: number, dto: CreateLiftActivityDto) {
    await this.assertExercisesBelongToUser(
      userId,
      dto.sets.map((s) => s.exerciseId),
    );
    const date = new Date(dto.date);
    const activityType = Type.Lift;
    const lift = await this.prisma.activity.create({
      data: {
        user: {
          connect: { id: userId },
        },
        date,
        activityType,
        durationSeconds: dto.durationSeconds,
        notes: dto.notes,
        bodyweight: dto.bodyweight,
        liftActivity: {
          create: {
            sets: {
              create: dto.sets,
            },
          },
        },
      },
      include: ACTIVITY_INCLUDE,
    });
    return lift;
  }

  async findAll() {
    const activities = await this.prisma.activity.findMany({
      include: ACTIVITY_INCLUDE,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });
    return activities;
  }

  async findOne(id: number) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: ACTIVITY_INCLUDE,
    });
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    return activity;
  }

  private async assertExercisesBelongToUser(
    userId: number,
    exerciseIds: number[],
  ) {
    const uniqueIds = [...new Set(exerciseIds)];
    const count = await this.prisma.exercise.count({
      where: { id: { in: uniqueIds }, userId },
    });
    if (count < uniqueIds.length) {
      throw new BadRequestException(
        'One or more exercises do not belong to the user',
      );
    }
  }
}
