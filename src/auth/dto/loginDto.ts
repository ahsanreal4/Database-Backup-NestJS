import { IsString, MinLength, MaxLength, IsEmail } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(12)
  password: string;
}
