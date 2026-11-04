import {
  Injectable,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      Logger.error(
        'Database connection failed',
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException('Database connection failed');
    }
  }
}
