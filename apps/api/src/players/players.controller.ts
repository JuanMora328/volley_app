import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePlayerDto, ListPlayersDto, UpdatePlayerDto, UpdateStatusDto } from './players.dto';
import { PlayersService } from './players.service';
@ApiTags('players')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('players')
export class PlayersController {
  constructor(private readonly service: PlayersService) {}
  @Get() @ApiOperation({ summary: 'Lista, busca y pagina jugadores' }) list(
    @Query() query: ListPlayersDto,
  ) {
    return this.service.list(query);
  }
  @Post() @ApiOperation({ summary: 'Crea un jugador' }) create(@Body() dto: CreatePlayerDto) {
    return this.service.create(dto);
  }
  @Get(':id') get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePlayerDto) {
    return this.service.update(id, dto);
  }
  @Patch(':id/status') status(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.service.status(id, dto.active);
  }
}
