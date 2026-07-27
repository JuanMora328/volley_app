import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  AddSessionPlayersDto,
  CreateSessionDto,
  GenerateTeamsDto,
  ListSessionsDto,
  SaveTeamsDto,
  UpdateSessionDto,
  UpdateSessionPlayerDto,
  DeleteSessionDto,
} from './sessions.dto';
import { SessionsService } from './sessions.service';
@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}
  @Get() list(@Query() query: ListSessionsDto) {
    return this.service.list(query);
  }
  @Post() create(@Body() dto: CreateSessionDto) {
    return this.service.create(dto);
  }
  @Get(':id') detail(@Param('id') id: string) {
    return this.service.detail(id);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.service.update(id, dto);
  }
  @Post(':id/players') addPlayers(@Param('id') id: string, @Body() dto: AddSessionPlayersDto) {
    return this.service.addPlayers(id, dto);
  }
  @Patch(':id/players/:sessionPlayerId') updatePlayer(
    @Param('id') id: string,
    @Param('sessionPlayerId') spid: string,
    @Body() dto: UpdateSessionPlayerDto,
  ) {
    return this.service.updatePlayer(id, spid, dto);
  }
  @Delete(':id/players/:sessionPlayerId') removePlayer(
    @Param('id') id: string,
    @Param('sessionPlayerId') spid: string,
  ) {
    return this.service.removePlayer(id, spid);
  }
  @Post(':id/teams/generate') generate(@Param('id') id: string, @Body() dto: GenerateTeamsDto) {
    return this.service.generate(id, dto.seed);
  }
  @Put(':id/teams') saveTeams(@Param('id') id: string, @Body() dto: SaveTeamsDto) {
    return this.service.saveTeams(id, dto);
  }
  @Post(':id/teams/confirm') confirm(@Param('id') id: string) {
    return this.service.confirm(id);
  }
  @Post(':id/cancel') cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
  @Delete(':id') delete(@Param('id') id: string, @Body() dto: DeleteSessionDto) {
    return this.service.delete(id, dto.confirmation);
  }
}
