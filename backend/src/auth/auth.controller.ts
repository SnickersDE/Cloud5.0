import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import type { LoginBody, RegisterBody } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getCookieOptions(maxAgeMs: number) {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: maxAgeMs,
      path: '/',
    };
  }

  @Post('register')
  async register(@Body() body: RegisterBody) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(
    @Body() body: LoginBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body);
    const accessMaxAgeMs = Math.max((result.expiresIn - 60) * 1000, 60_000);
    const refreshMaxAgeMs = 30 * 24 * 60 * 60 * 1000;

    res.cookie(
      'sb-access-token',
      result.accessToken,
      this.getCookieOptions(accessMaxAgeMs),
    );
    res.cookie(
      'sb-refresh-token',
      result.refreshToken,
      this.getCookieOptions(refreshMaxAgeMs),
    );

    return {
      user: result.user,
      authenticatedRole: 'authenticated',
    };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const accessToken = req.cookies?.['sb-access-token'] as string | undefined;
    const user = await this.authService.me(accessToken);

    if (!user) {
      throw new UnauthorizedException('Kein aktiver Login gefunden.');
    }

    return {
      user,
      authenticatedRole: 'authenticated',
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('sb-access-token', this.getCookieOptions(0));
    res.clearCookie('sb-refresh-token', this.getCookieOptions(0));
    return {
      message: 'Abgemeldet.',
    };
  }
}
