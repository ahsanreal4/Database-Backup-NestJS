import { BadGatewayException, Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../common/schema/user';
import { LoginDto } from './dto/loginDto';
import { RegisterUserDto } from './dto/registerUserDto';
import { GetProfileDto } from './dto/getProfileDto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  // Generate JWT Token
  async generateJwtToken(userId: string) {
    const payload = { id: userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // Validate the JWT Token
  async validateJwtToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded; // You can return the decoded payload (e.g., user info)
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async login({ email, password }: LoginDto) {
    const user = await this.userModel.findOne({ email, password });

    if (!user)
      throw new BadGatewayException('Login failed', 'Invalid credentials');

    const token = await this.generateJwtToken(user._id.toString());
    return token.access_token;
  }

  async register(registerDto: RegisterUserDto) {
    const user: User = {
      email: registerDto.email,
      createdAt: new Date(),
      name: registerDto.name,
      password: registerDto.password,
    };

    const userExists = await this.userModel
      .findOne({ email: user.email })
      .exec();

    if (userExists)
      throw new BadGatewayException(
        'register user failed',
        'user with this email already exists',
      );

    const saveUser = new this.userModel(user);
    await saveUser.save();

    return 'User registered successfully';
  }

  async getProfile(userId: string): Promise<GetProfileDto> {
    const user = await this.userModel.findById(userId).exec();

    const dto: GetProfileDto = {
      _id: user._id.toString(),
      createdAt: user.createdAt.toISOString(),
      email: user.email,
      name: user.email,
    };

    return dto;
  }
}
