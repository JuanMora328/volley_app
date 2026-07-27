import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';
@Module({
  imports: [AuthModule],
  controllers: [SettlementsController],
  providers: [SettlementsService],
})
export class SettlementsModule {}
