import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableCors({
    origin: ['https://pindar-web.vercel.app', 'http://localhost:5173'],
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
