import { NestFactory } from '@nestjs/core';
import { InfrastructureModule } from './infrastructure.module';

async function bootstrap() {
  const app = await NestFactory.create(InfrastructureModule);
  await app.listen(3100);
}

bootstrap();
