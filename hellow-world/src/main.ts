import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 정의하지 않은 값은 전달하지 않게 막을 수 있음
      forbidNonWhitelisted: true, // 정의하지 않은 값은 전달되면 아예 에러 발생
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
