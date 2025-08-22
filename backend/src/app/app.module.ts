import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PostsModule } from '../modules/posts/posts.module';
import { SearchModule } from '../modules/search/search.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SeoModule } from '../modules/seo/seo.module';
import { AdminModule } from '../modules/admin/admin.module';
import { PublicController } from '../modules/public/public.controller';
import { validateEnv } from '../config/env.validation';
import { PagesModule } from '../modules/pages/pages.module';
import { MenuModule } from '../modules/menu/menu.module';
import { ThemesModule } from '../modules/themes/themes.module';
import { SiteSettingsModule } from '../modules/site-settings/site-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: 100 }, // 100 req/min por IP
    ]),
  PostsModule,
  PagesModule,
  MenuModule,
  ThemesModule,
  SiteSettingsModule,
    SearchModule,
  SeoModule,
  AdminModule,
  ],
  controllers: [AppController, PublicController],
  providers: [
    AppService,
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
