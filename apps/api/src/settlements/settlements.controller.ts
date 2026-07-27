import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinishDto, PaymentDto, SettlementDto } from './settlements.dto';
import { SettlementsService } from './settlements.service';

@ApiTags('settlements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions/:id')
export class SettlementsController {
  constructor(private readonly service: SettlementsService) {}
  @Get('settlement') setup(@Param('id') id: string) {
    return this.service.setup(id);
  }
  @Post('settlement/preview') preview(@Param('id') id: string, @Body() dto: SettlementDto) {
    return this.service.preview(id, dto);
  }
  @Post('settlement') confirm(@Param('id') id: string, @Body() dto: SettlementDto) {
    return this.service.confirm(id, dto);
  }
  @Get('payments') payments(@Param('id') id: string) {
    return this.service.payments(id);
  }
  @Patch('payments/:sessionPlayerId') payment(
    @Param('id') id: string,
    @Param('sessionPlayerId') playerId: string,
    @Body() dto: PaymentDto,
  ) {
    return this.service.payment(id, playerId, dto);
  }
  @Post('finish') finish(@Param('id') id: string, @Body() dto: FinishDto) {
    return this.service.finish(id, dto);
  }
  @Get('summary') summary(@Param('id') id: string) {
    return this.service.summary(id);
  }
}
