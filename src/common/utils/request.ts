import { UnauthorizedException } from '@nestjs/common';
import { USER_REQUEST_IDENTIFIER_KEY } from '../constants/userRequestIndentifier';

export const getUserIdFromRequestOrThrowError = (request: Request) => {
  const userId = request.headers[USER_REQUEST_IDENTIFIER_KEY];

  if (typeof userId != 'string' || userId.length == 0)
    throw new UnauthorizedException('Unauthorized', 'User email was not found');

  return userId;
};
