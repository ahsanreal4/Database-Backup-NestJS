import { Module } from '@nestjs/common';
import { ClientDatabaseService } from './client-database.service';
import { DatabaseController } from './database.controller';
import { ConnectMySqlService } from './connect-db/connect-mysql.service';
import { ConnectPostGreSqlService } from './connect-db/connect-postgresql.service';
import { FileUploadModule } from 'src/file-upload/file-upload.module';

@Module({
  providers: [
    ClientDatabaseService,
    ConnectMySqlService,
    ConnectPostGreSqlService,
  ],
  imports: [FileUploadModule],
  controllers: [DatabaseController],
})
export class DatabaseModule {}
