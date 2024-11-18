import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/loginDto';
import { getUserIdFromRequestOrThrowError } from '../common/utils/request';
import { JwtAuthGuard } from './auth.guard';
import { RegisterUserDto } from './dto/registerUserDto';
import { GetProfileDto } from './dto/getProfileDto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/register')
  async register(@Body() registerDto: RegisterUserDto) {
    return await this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('/profile')
  async getProfile(@Req() request: Request): Promise<GetProfileDto> {
    const userId = getUserIdFromRequestOrThrowError(request);

    return this.authService.getProfile(userId);
  }
}
