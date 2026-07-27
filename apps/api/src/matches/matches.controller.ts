import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DrawDto, MatchListDto, ResultDto, TargetScoreDto } from './matches.dto';
import { MatchesService } from './matches.service';
@ApiTags('competition')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions/:id')
export class MatchesController {
  constructor(private readonly service: MatchesService) {}
  @Post('rotation/draw') draw(@Param('id') id: string, @Body() dto: DrawDto) {
    return this.service.draw(id, dto.seed);
  }
  @Post('rotation/redraw') redraw(@Param('id') id: string, @Body() dto: DrawDto) {
    return this.service.draw(id, dto.seed);
  }
  @Get('rotation') rotation(@Param('id') id: string) {
    return this.service.rotation(id);
  }
  @Post('matches/start') start(@Param('id') id: string) {
    return this.service.start(id);
  }
  @Post('matches/:matchId/result') result(
    @Param('id') id: string,
    @Param('matchId') matchId: string,
    @Body() dto: ResultDto,
  ) {
    return this.service.result(id, matchId, dto);
  }
  @Get('matches') matches(@Param('id') id: string, @Query() query: MatchListDto) {
    return this.service.list(id, query);
  }
  @Get('standings') standings(@Param('id') id: string) {
    return this.service.standings(id);
  }
  @Delete('matches/latest') undo(@Param('id') id: string) {
    return this.service.undo(id);
  }
  @Patch('target-score') target(@Param('id') id: string, @Body() dto: TargetScoreDto) {
    return this.service.target(id, dto.targetScore);
  }
}
