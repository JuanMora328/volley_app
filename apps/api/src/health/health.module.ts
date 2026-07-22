import { Controller, Get, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
@Controller('health')
class HealthController {
  constructor(private readonly ds: DataSource) {}
  @Get() async health() {
    let database: 'ok' | 'unavailable' = 'unavailable';
    try {
      if (this.ds.isInitialized) {
        await this.ds.query('select 1');
        database = 'ok';
      }
    } catch {}
    return { status: 'ok', database, timestamp: new Date().toISOString() };
  }
}
@Module({ controllers: [HealthController] })
export class HealthModule {}
