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
import { AdminCmsService } from '../services/admin-cms.service';
import {
  CreateBannerDto,
  UpdateBannerDto,
  BannerFilterDto,
  CreateHomepageSectionDto,
  UpdateHomepageSectionDto,
  SetFeaturedProductsDto,
} from '../dto/admin-cms.dto';

@ApiTags('admin-cms')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin')
export class AdminCmsController {
  constructor(private readonly cmsService: AdminCmsService) {}

  // ── Banners ──
  @Get('banners')
  @ApiOperation({ summary: 'List and filter promotional and hero banners' })
  findAllBanners(@Query() query: BannerFilterDto) {
    return this.cmsService.findAllBanners(query);
  }

  @Get('banners/:id')
  @ApiOperation({ summary: 'Get details of a banner' })
  findOneBanner(@Param('id') id: string) {
    return this.cmsService.findOneBanner(id);
  }

  @Post('banners')
  @ApiOperation({ summary: 'Create a new banner slide' })
  createBanner(@CurrentUser() actor: any, @Body() dto: CreateBannerDto) {
    return this.cmsService.createBanner(dto, actor);
  }

  @Patch('banners/:id')
  @ApiOperation({ summary: 'Update a banner slide' })
  updateBanner(
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: UpdateBannerDto,
  ) {
    return this.cmsService.updateBanner(id, dto, actor);
  }

  @Delete('banners/:id')
  @ApiOperation({ summary: 'Delete a banner slide' })
  deleteBanner(@Param('id') id: string, @CurrentUser() actor: any) {
    return this.cmsService.deleteBanner(id, actor);
  }

  // ── Homepage Content ──
  @Get('homepage')
  @ApiOperation({ summary: 'Get all configured homepage sections and layout order' })
  findAllSections() {
    return this.cmsService.findAllSections();
  }

  @Post('homepage/sections')
  @ApiOperation({ summary: 'Create a new homepage layout section' })
  createSection(@CurrentUser() actor: any, @Body() dto: CreateHomepageSectionDto) {
    return this.cmsService.createSection(dto, actor);
  }

  @Patch('homepage/sections/:id')
  @ApiOperation({ summary: 'Update a homepage section configuration or ordering' })
  updateSection(
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: UpdateHomepageSectionDto,
  ) {
    return this.cmsService.updateSection(id, dto, actor);
  }

  @Delete('homepage/sections/:id')
  @ApiOperation({ summary: 'Delete a homepage section' })
  deleteSection(@Param('id') id: string, @CurrentUser() actor: any) {
    return this.cmsService.deleteSection(id, actor);
  }

  // ── Featured Products ──
  @Get('featured-products')
  @ApiOperation({ summary: 'Get current featured products' })
  getFeaturedProducts() {
    return this.cmsService.getFeaturedProducts();
  }

  @Post('featured-products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set and curate list of featured products' })
  setFeaturedProducts(@CurrentUser() actor: any, @Body() dto: SetFeaturedProductsDto) {
    return this.cmsService.setFeaturedProducts(dto, actor);
  }
}
