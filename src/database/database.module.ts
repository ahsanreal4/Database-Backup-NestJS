import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';
import { ConnectMySqlService } from './connect-db/connect-mysql.service';
import { ConnectPostGreSqlService } from './connect-db/connect-postgresql.service';
import { FileUploadModule } from 'src/file-upload/file-upload.module';
import { Backup, BackupSchema } from 'src/common/schema/backup';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [DatabaseService, ConnectMySqlService, ConnectPostGreSqlService],
  imports: [
    MongooseModule.forFeature([{ name: Backup.name, schema: BackupSchema }]),
    FileUploadModule,
    AuthModule,
  ],
  controllers: [DatabaseController],
})
export class DatabaseModule {}
