import { Module } from '@nestjs/common';
import { AppDatabaseService } from './app-database.service';
import { ClientDatabaseService } from './client-database.service';
import { DatabaseController } from './database.controller';
import { ConnectMySqlService } from './connect-db/connect-mysql.service';
import { ConnectPostGreSqlService } from './connect-db/connect-postgresql.service';
import { FileUploadModule } from 'src/file-upload/file-upload.module';

@Module({
  providers: [
    AppDatabaseService,
    ClientDatabaseService,
    ConnectMySqlService,
    ConnectPostGreSqlService,
  ],
  imports: [FileUploadModule],
  controllers: [DatabaseController],
})
export class DatabaseModule {}
