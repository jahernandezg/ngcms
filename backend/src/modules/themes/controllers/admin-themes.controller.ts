import { Body, Controller, Get, Param, Put, Post, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThemesService } from '../themes.service';
import { CreateThemeDto, UpdateThemeDto } from '../dto/theme-settings.dto';
import { JwtAuthGuard } from '../../admin/guards/jwt-auth.guard';
import { RolesGuard } from '../../admin/guards/roles.guard';
import { Roles } from '../../admin/decorators/roles.decorator';
import { ThemeCategory } from '@prisma/client';

@ApiTags('Admin Themes')
@ApiBearerAuth()
@Controller('admin/themes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminThemesController {
  constructor(private themes: ThemesService) {}

  @Get()
  @ApiOperation({ summary: 'List all themes' })
  @ApiResponse({ status: 200, description: 'Themes retrieved successfully' })
  list(@Query('category') category?: ThemeCategory) {
    if (category) {
      return this.themes.listByCategory(category);
    }
    return this.themes.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get theme by ID' })
  @ApiResponse({ status: 200, description: 'Theme retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  getById(@Param('id') id: string) {
    return this.themes.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new theme' })
  @ApiResponse({ status: 201, description: 'Theme created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid theme data' })
  create(@Body() createThemeDto: CreateThemeDto) {
    return this.themes.create(createThemeDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update theme' })
  @ApiResponse({ status: 200, description: 'Theme updated successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  update(@Param('id') id: string, @Body() updateThemeDto: UpdateThemeDto) {
    return this.themes.update(id, updateThemeDto);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Activate theme' })
  @ApiResponse({ status: 200, description: 'Theme activated successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  setActive(@Param('id') id: string) { 
    return this.themes.setActive(id); 
  }

  @Put(':id/settings')
  @ApiOperation({ summary: 'Update theme settings only' })
  @ApiResponse({ status: 200, description: 'Theme settings updated successfully' })
  updateSettings(@Param('id') id: string, @Body() updateThemeDto: UpdateThemeDto) { 
    return this.themes.updateSettings(id, updateThemeDto); 
  }

  @Put(':id/settings-activate')
  @ApiOperation({ summary: 'Update theme settings and activate' })
  @ApiResponse({ status: 200, description: 'Theme updated and activated successfully' })
  updateSettingsAndActivate(@Param('id') id: string, @Body() updateThemeDto: UpdateThemeDto) { 
    return this.themes.updateAndActivate(id, updateThemeDto); 
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete theme' })
  @ApiResponse({ status: 200, description: 'Theme deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete last theme or active theme' })
  delete(@Param('id') id: string) { 
    return this.themes.delete(id); 
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate theme' })
  @ApiResponse({ status: 201, description: 'Theme duplicated successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  duplicate(@Param('id') id: string) { 
    return this.themes.duplicate(id); 
  }

  @Post('predefined')
  @ApiOperation({ summary: 'Create predefined themes' })
  @ApiResponse({ status: 201, description: 'Predefined themes created successfully' })
  createPredefined() {
    return this.themes.createPredefinedThemes();
  }
}