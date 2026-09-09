import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto, ReviewResponseDto } from './dto/review.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new review for a product' })
  @SwaggerResponse({ status: 201, type: ReviewResponseDto })
  create(@CurrentUser() user: JwtPayload, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(user.sub, createReviewDto);
  }

  @Get('product/:productId')
  @Public()
  @ApiOperation({ summary: 'Get all reviews for a product' })
  findAllByProduct(@Param('productId') productId: string, @Query() query: PaginationDto) {
    return this.reviewsService.findAllByProduct(productId, query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a review by ID' })
  @SwaggerResponse({ status: 200, type: ReviewResponseDto })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update your review' })
  @SwaggerResponse({ status: 200, type: ReviewResponseDto })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, user.sub, updateReviewDto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a review' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const isAdmin = user.roles.includes('admin') || user.roles.includes('super_admin');
    return this.reviewsService.remove(id, user.sub, isAdmin);
  }
}
