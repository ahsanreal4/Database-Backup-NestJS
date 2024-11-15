import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DatabaseCredentialsDto } from 'src/database/dto/databaseCredentialsDto';
import { DatabaseService } from './database.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { getUserIdFromRequestOrThrowError } from 'src/common/utils/request';
import { CreateBackupDto } from './dto/createBackupDto';

@UseGuards(JwtAuthGuard)
@Controller('api/database')
export class DatabaseController {
  constructor(private databaseService: DatabaseService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/')
  async testDatabaseConnection(
    @Body() testDatabaseDto: DatabaseCredentialsDto,
  ): Promise<string> {
    return await this.databaseService.testDatabaseConnection(testDatabaseDto);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/backup')
  async createDatabaseBackup(
    @Body() createDatabaseBackup: CreateBackupDto,
    @Req() request: Request,
  ) {
    const userId = getUserIdFromRequestOrThrowError(request);

    return await this.databaseService.createDatabaseBackup(
      createDatabaseBackup,
      userId,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('/backup/:id/restore')
  async restoreBackup(@Param('id') id: string) {
    return await this.databaseService.restoreBackup(id);
  }

  @HttpCode(HttpStatus.OK)
  @Put('/backup/:id')
  async updateUserBackup(@Param('id') id: string) {
    return await this.databaseService.updateDatabaseBackup(id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/backup')
  async getUserBackups(@Req() request: Request) {
    const userId = getUserIdFromRequestOrThrowError(request);

    return await this.databaseService.getUserBackups(userId);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/backup/all')
  async deleteAllDatabaseBackups(@Req() request: Request) {
    const userId = getUserIdFromRequestOrThrowError(request);

    return await this.databaseService.deleteAllDatabaseBackups(userId);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/backup/:id')
  async deleteDatabaseBackup(@Param('id') id: string) {
    return await this.databaseService.deleteDatabaseBackup(id);
  }
}
