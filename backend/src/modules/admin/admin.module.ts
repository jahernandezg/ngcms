import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '@cms-workspace/database';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminPostsController } from './controllers/admin-posts.controller';
import { AdminTaxonomyController } from './controllers/admin-taxonomy.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminAuthService } from './services/admin-auth.service';
import { AdminPostsService } from './services/admin-posts.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AuditService } from './services/audit.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '15m' }
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 60 }]),
    DatabaseModule
  ],
  controllers: [AdminAuthController, AdminPostsController, AdminDashboardController, AdminTaxonomyController],
  providers: [AdminAuthService, AdminPostsService, AdminDashboardService, AuditService, JwtStrategy],
})
export class AdminModule {}
