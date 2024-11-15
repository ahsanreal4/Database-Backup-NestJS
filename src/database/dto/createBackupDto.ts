import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsObject,
} from 'class-validator';
import { DatabaseCredentialsDto } from './databaseCredentialsDto';

export class CreateBackupDto {
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  name: string;

  @IsObject()
  databaseCredentials: DatabaseCredentialsDto;
}
