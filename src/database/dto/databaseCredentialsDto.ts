import { IsString, MinLength, MaxLength, IsEnum } from 'class-validator';
import { Database } from '../../common/types/enums/database';

export class DatabaseCredentialsDto {
  @IsEnum(Database)
  databaseType: Database;

  @IsString()
  @MinLength(5)
  @MaxLength(100)
  host: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  username: string;

  @IsString()
  @MaxLength(200)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;
}
