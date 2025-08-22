import { Module } from '@nestjs/common';
import { DatabaseModule } from '@cms-workspace/database';
import { MenuService } from './menu.service';
import { PublicMenuController } from './controllers/menu.controller';
import { AdminMenuController } from './controllers/admin-menu.controller';
import { ResolveController } from './controllers/resolve.controller';

@Module({
  imports: [DatabaseModule],
  providers: [MenuService],
  controllers: [PublicMenuController, AdminMenuController, ResolveController],
  exports: [MenuService]
})
export class MenuModule {}
