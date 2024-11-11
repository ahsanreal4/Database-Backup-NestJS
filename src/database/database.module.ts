import { Module } from '@nestjs/common';
import { AppDatabaseService } from './app-database.service';
import { ClientDatabaseService } from './client-database.service';

@Module({
  providers: [AppDatabaseService, ClientDatabaseService],
})
export class DatabaseModule {}
