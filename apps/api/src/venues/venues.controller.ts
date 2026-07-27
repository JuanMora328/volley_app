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
import { UpdateStatusDto } from '../players/players.dto';
import { CreateVenueDto, ListVenuesDto, UpdateVenueDto } from './venues.dto';
import { VenuesService } from './venues.service';
@ApiTags('venues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('venues')
export class VenuesController {
  constructor(private readonly service: VenuesService) {}
  @Get() @ApiOperation({ summary: 'Lista, busca y pagina canchas' }) list(
    @Query() query: ListVenuesDto,
  ) {
    return this.service.list(query);
  }
  @Post() create(@Body() dto: CreateVenueDto) {
    return this.service.create(dto);
  }
  @Get(':id') get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVenueDto) {
    return this.service.update(id, dto);
  }
  @Patch(':id/status') status(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.service.status(id, dto.active);
  }
}
