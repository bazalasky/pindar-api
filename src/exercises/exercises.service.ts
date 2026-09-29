import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateExerciseDto) {
    try {
      return await this.prisma.exercise.create({
        data: { name: dto.name, userId },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('An exercise of this name already exists');
      }
      throw e;
    }
  }

  async findAllForUser(userId: number) {
    return this.prisma.exercise.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }
}
