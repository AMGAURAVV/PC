import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

import type { CommunityService } from './community.service';
import type {
  QueryCommunityBuildsDto,
  PublishCommunityBuildDto,
  AddCommunityCommentDto,
  ReportCommunityBuildDto,
} from './dto/community.dto';

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('builds')
  @Public()
  @ApiOperation({ summary: 'Browse and filter published community builds (🔓 Public)' })
  findAll(
    @Query() query: QueryCommunityBuildsDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.communityService.findAll(query, user?.sub);
  }

  @Get('builds/filters')
  @Public()
  @ApiOperation({ summary: 'Get available filter metadata for community showcase (🔓 Public)' })
  getFilterMetadata() {
    return this.communityService.getFilterMetadata();
  }

  @Get('builds/:slug')
  @Public()
  @ApiOperation({ summary: 'Get single community build details by slug (🔓 Public)' })
  @ApiParam({ name: 'slug', description: 'URL-friendly unique build slug' })
  findBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.communityService.findBySlug(slug, user?.sub);
  }

  @Post('builds')
  @Public() // Allow publish (if authenticated uses JWT, otherwise falls back to demo author)
  @ApiOperation({ summary: 'Publish a build to the community showcase' })
  publish(
    @Body() dto: PublishCommunityBuildDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    const userId = user?.sub || 'demo-user-id';
    return this.communityService.publish(userId, dto);
  }

  @Post('builds/:id/like')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle like on a community build' })
  @ApiParam({ name: 'id', description: 'Community build UUID' })
  toggleLike(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const userId = user?.sub || 'anonymous-liker';
    return this.communityService.toggleLike(id, userId);
  }

  @Get('builds/:id/comments')
  @Public()
  @ApiOperation({ summary: 'Get comments for a community build (🔓 Public)' })
  @ApiParam({ name: 'id', description: 'Community build UUID' })
  getComments(@Param('id') id: string) {
    return this.communityService.getComments(id);
  }

  @Post('builds/:id/comments')
  @Public()
  @ApiOperation({ summary: 'Post a comment on a community build' })
  @ApiParam({ name: 'id', description: 'Community build UUID' })
  addComment(
    @Param('id') id: string,
    @Body() dto: AddCommunityCommentDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    const userId = user?.sub || 'demo-user-id';
    return this.communityService.addComment(id, userId, dto.content);
  }

  @Post('builds/:id/report')
  @Public()
  @ApiOperation({ summary: 'Submit a moderation report against a community build (🔓 Public)' })
  @ApiParam({ name: 'id', description: 'Community build UUID' })
  report(
    @Param('id') id: string,
    @Body() dto: ReportCommunityBuildDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.communityService.reportBuild(id, user?.sub || null, dto);
  }
}
