import { config } from 'dotenv';
config(); // ¡Esto fuerza la lectura del archivo .env!

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL,
      'https://sistemakpis.consultoradeasesoriaempresarialjb.com',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    optionsSuccessStatus: 204, // Algunos navegadores/proxies prefieren 204 en OPTIONS
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
