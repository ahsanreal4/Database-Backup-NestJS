import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { USER_REQUEST_IDENTIFIER_KEY } from 'src/common/constants/userRequestIndentifier';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request || !request.headers['authorization']) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const token = request.headers['authorization']
      .replace('Bearer ', '')
      .trim();
    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    try {
      const decoded = await this.authService.validateJwtToken(token);
      request.headers[USER_REQUEST_IDENTIFIER_KEY] = decoded.id;
      return true; // If token is valid, allow the request
    } catch (e) {
      console.error(e);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
