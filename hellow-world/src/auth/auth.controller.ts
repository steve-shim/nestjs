import { Controller, Post, Headers, Request, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGuard } from './strategy/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  /// authorization: Basic $token
  registerUser(@Headers('authorization') token: string){
    return this.authService.register(token)
  }

  @Post('login')
  /// authorization: Basic $token
  loginUser(@Headers('authorization') token: string){
    return this.authService.login(token)
  }

  // @Post('token/access')
  // async rotateAccessToken(@Headers('authorization') token: string) {
  //   const payload = await this.authService.parseBearerToken(token, true);
  //   console.log("payload", payload)
  //   return {
  //     accessToken: await this.authService.issueToken(payload, false),
  //   }
  // }
  @Post('token/access')
  async rotateAccessToken(@Request() req) {
    return {
      accessToken: await this.authService.issueToken(req.user, false),
    }
  }

  // AuthGuard는 LocalStrategy를 의미하고 validate함수가 실행되고 
  // 반환된 user값이 req에 담겨온다
  // @UseGuards(AuthGuard('shim'))
  @UseGuards(LocalAuthGuard)
  @Post('login/passport')
  async loginUserPassport(@Request() req) {
    return {
      refreshToken: await this.authService.issueToken(req.user, true),
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }

  //@UseGuards(AuthGuard('jwt'))
  @UseGuards(JwtAuthGuard)
  @Get('private')
  async private(@Request() req) {
    // Guards에서 막히면 아래 로직들은 수행이 불가하다.
    console.log('run');

    return req.user;
  }
}
