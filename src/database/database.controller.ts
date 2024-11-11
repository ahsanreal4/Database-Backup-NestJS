import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { DatabaseCredentialsDto } from 'src/dto/database/databaseCredentialsDto';
import { ClientDatabaseService } from './client-database.service';

@Controller('api/database')
export class DatabaseController {
  constructor(private clientDatabaseService: ClientDatabaseService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/')
  async testDatabaseConnection(
    @Body() testDatabaseDto: DatabaseCredentialsDto,
  ): Promise<string> {
    return await this.clientDatabaseService.testDatabaseConnection(
      testDatabaseDto,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('/backup')
  async createDatabaseBackup(
    @Body() createDatabaseBackup: DatabaseCredentialsDto,
  ) {
    return await this.clientDatabaseService.createDatabaseBackup(
      createDatabaseBackup,
    );
  }
}
