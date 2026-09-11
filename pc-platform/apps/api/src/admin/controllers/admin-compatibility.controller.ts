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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateCompatibilityRuleDto,
  UpdateCompatibilityRuleDto,
  CompatibilityRuleFilterDto,
} from '../dto/admin-compatibility.dto';
import { AdminCompatibilityService } from '../services/admin-compatibility.service';

@ApiTags('admin-compatibility')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/compatibility-rules')
export class AdminCompatibilityController {
  constructor(private readonly compatibilityService: AdminCompatibilityService) {}

  @Get()
  @ApiOperation({ summary: 'List and filter PC hardware compatibility rules' })
  findAll(@Query() query: CompatibilityRuleFilterDto) {
    return this.compatibilityService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single compatibility rule with all conditions and warnings' })
  findOne(@Param('id') id: string) {
    return this.compatibilityService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Author a new compatibility rule with condition expressions' })
  create(@CurrentUser() actor: any, @Body() dto: CreateCompatibilityRuleDto) {
    return this.compatibilityService.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing compatibility rule' })
  update(
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: UpdateCompatibilityRuleDto,
  ) {
    return this.compatibilityService.update(id, dto, actor);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Quick toggle active/inactive status for a compatibility rule' })
  toggleActive(@Param('id') id: string, @CurrentUser() actor: any) {
    return this.compatibilityService.toggleActive(id, actor);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a compatibility rule' })
  remove(@Param('id') id: string, @CurrentUser() actor: any) {
    return this.compatibilityService.delete(id, actor);
  }
}
