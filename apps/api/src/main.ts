import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  const config = app.get(ConfigService);
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.useBodyParser('json', { limit: config.get('HTTP_BODY_LIMIT') ?? '100kb' });
  app.useBodyParser('urlencoded', {
    extended: false,
    limit: config.get('HTTP_BODY_LIMIT') ?? '100kb',
  });
  const origins = config
    .get<string>('CORS_ORIGIN')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins?.length ? origins : config.get('NODE_ENV') !== 'production' });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  if (config.get('NODE_ENV') !== 'production' && config.get('SWAGGER_ENABLED') === 'true') {
    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setTitle('VolleyFlow API').setVersion('0.1').addBearerAuth().build(),
      ),
    );
  }
  app.enableShutdownHooks();
  await app.listen(config.get('PORT') ?? 3001);
}
void bootstrap().catch((error: unknown) => {
  console.error('No fue posible iniciar VolleyFlow API.', error);
  process.exitCode = 1;
});
