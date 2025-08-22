import { Body, Controller, Post } from '@nestjs/common';
import { AdminAuthService } from '../services/admin-auth.service';
import { LoginDto } from '../dto/login.dto';
import { Throttle } from '@nestjs/throttler';
import { ApiBody, ApiOkResponse, ApiTags, ApiUnauthorizedResponse, ApiProperty } from '@nestjs/swagger';

class AuthTokensDto {
  @ApiProperty({ type: String })
  accessToken!: string;
  @ApiProperty({ type: String })
  refreshToken!: string;
  @ApiProperty({ type: [String] })
  roles!: string[];
}

@ApiTags('admin-auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private auth: AdminAuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Login correcto', type: AuthTokensDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('refresh')
  @ApiBody({ schema: { properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] } })
  @ApiOkResponse({ description: 'Nuevo par de tokens', type: AuthTokensDto })
  @ApiUnauthorizedResponse({ description: 'Refresh token inválido' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.auth.refresh(refreshToken);
  }
}
