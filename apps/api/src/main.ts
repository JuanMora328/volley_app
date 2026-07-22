import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
async function bootstrap(){const app=await NestFactory.create(AppModule,{bufferLogs:true}); const config=app.get(ConfigService); app.setGlobalPrefix('api'); app.use(helmet()); app.enableCors({origin:config.get('CORS_ORIGIN')?.split(',') ?? true}); app.useGlobalPipes(new ValidationPipe({whitelist:true,transform:true})); if(config.get('NODE_ENV')==='development'||config.get('SWAGGER_ENABLED')==='true'){SwaggerModule.setup('api/docs',app,SwaggerModule.createDocument(app,new DocumentBuilder().setTitle('VolleyFlow API').setVersion('0.1').addBearerAuth().build()));} await app.listen(config.get('PORT') ?? 3001);} void bootstrap();
