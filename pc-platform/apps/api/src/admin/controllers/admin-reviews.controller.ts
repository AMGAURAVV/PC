import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminReviewsService } from '../services/admin-reviews.service';
import {
  AdminReviewFilterDto,
  ModerateReviewDto,
  BulkModerateReviewsDto,
} from '../dto/admin-review.dto';

@ApiTags('admin-reviews')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviewsService: AdminReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List and filter UGC product reviews for moderation (PENDING, APPROVED, REJECTED, FLAGGED)' })
  findAll(@Query() query: AdminReviewFilterDto) {
    return this.reviewsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single review details' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id/moderate')
  @ApiOperation({ summary: 'Approve, reject, or flag a review with moderator notes' })
  moderate(
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.reviewsService.moderate(id, dto, actor);
  }

  @Post('bulk/moderate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch moderate reviews (e.g. bulk approval queue clearing)' })
  bulkModerate(@CurrentUser() actor: any, @Body() dto: BulkModerateReviewsDto) {
    return this.reviewsService.bulkModerate(dto, actor);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review' })
  remove(@Param('id') id: string, @CurrentUser() actor: any) {
    return this.reviewsService.delete(id, actor);
  }
}
