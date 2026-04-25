import { Body, Controller, Get, Inject, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { JobsService } from './jobs.service.js';

@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(@Inject(JobsService) private readonly jobsService: JobsService) {}

  @Post()
  createJob(@CurrentUser() user: { id: string }, @Body() dto: CreateJobDto) {
    return this.jobsService.createJob(user.id, dto.photoId);
  }

  @Get()
  listJobs(@CurrentUser() user: { id: string }) {
    return this.jobsService.listJobs(user.id);
  }

  @Get(':id')
  getJob(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.jobsService.getJob(user.id, id);
  }

  @Get(':id/status')
  getJobStatus(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.jobsService.getJob(user.id, id);
  }

  @Get(':id/download')
  async downloadJob(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const result = await this.jobsService.getJobDownload(user.id, id);
    response.redirect(result.url);
  }

  @Post(':id/publish-arweave')
  publishJobToArweave(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.jobsService.publishProcessedImageToArweave(user.id, id);
  }
}
