import { Body, Controller, Get, Module, Param, Patch, Post, Query } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ILike, Repository } from 'typeorm';
import { PlayerEntity } from '../database/entities';
class PlayerDto {
  @IsString() name!: string;
  @IsInt() @Min(1) @Max(5) defaultLevel!: number;
  @IsOptional() @IsString() notes?: string;
}
class StatusDto {
  @IsBoolean() active!: boolean;
}
@Controller('players')
class PlayersController {
  constructor(@InjectRepository(PlayerEntity) private repo: Repository<PlayerEntity>) {}
  @Get() list(@Query('q') q?: string) {
    return this.repo.find({ where: q ? { name: ILike(`%${q}%`) } : {}, order: { name: 'ASC' } });
  }
  @Post() create(@Body() dto: PlayerDto) {
    return this.repo.save(this.repo.create(dto));
  }
  @Get(':id') get(@Param('id') id: string) {
    return this.repo.findOneByOrFail({ id });
  }
  @Patch(':id') async update(@Param('id') id: string, @Body() dto: Partial<PlayerDto>) {
    await this.repo.update(id, dto);
    return this.get(id);
  }
  @Patch(':id/status') async status(@Param('id') id: string, @Body() dto: StatusDto) {
    await this.repo.update(id, { active: dto.active });
    return this.get(id);
  }
}
@Module({ imports: [TypeOrmModule.forFeature([PlayerEntity])], controllers: [PlayersController] })
export class PlayersModule {}
