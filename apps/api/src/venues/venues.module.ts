import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { VenueEntity } from '../database/entities';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
@Module({
  imports: [TypeOrmModule.forFeature([VenueEntity]), AuthModule],
  controllers: [VenuesController],
  providers: [VenuesService],
})
export class VenuesModule {}
