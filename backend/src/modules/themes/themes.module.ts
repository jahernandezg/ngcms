import { Module } from '@nestjs/common';
import { DatabaseModule } from '@cms-workspace/database';
import { ThemesService } from './themes.service';
import { PublicThemeController } from './controllers/public-theme.controller';
import { AdminThemesController } from './controllers/admin-themes.controller';

@Module({
  imports: [DatabaseModule],
  providers: [ThemesService],
  controllers: [PublicThemeController, AdminThemesController],
  exports: [ThemesService]
})
export class ThemesModule {}
