import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { BillingService } from './billing.service.js';
import { ConfirmCheckoutSessionDto } from './dto/confirm-checkout-session.dto.js';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto.js';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(@Inject(BillingService) private readonly billingService: BillingService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: { id: string }) {
    return this.billingService.getSummary(user.id);
  }

  @Post('checkout-session')
  createCheckoutSession(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.billingService.createCheckoutSession(user.id, dto.packageId, dto.provider);
  }

  @Post('checkout-session/:sessionId/confirm')
  confirmCheckoutSession(
    @CurrentUser() user: { id: string },
    @Param('sessionId') sessionId: string,
    @Body() dto: ConfirmCheckoutSessionDto,
  ) {
    return this.billingService.confirmCheckoutSession(user.id, sessionId, dto.transactionHash);
  }
}
