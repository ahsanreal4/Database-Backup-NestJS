import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConnectMySqlService } from './connect-mysql.service';
import { ConnectPostGreSqlService } from './connect-postgresql.service';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { InjectModel } from '@nestjs/mongoose';
import { Backup } from 'src/common/schema/backup';
import { Model } from 'mongoose';
import { UploadApiResponse } from 'cloudinary';
import { Database } from 'src/common/types/enums/database';
import { DatabaseCredentialsDto } from '../dto/databaseCredentialsDto';

@Injectable()
export class ConnectDbService {
  constructor(
    private mySqlService: ConnectMySqlService,
    private postGreSqlService: ConnectPostGreSqlService,
    private fileService: FileUploadService,
    @InjectModel(Backup.name) private backupModel: Model<Backup>,
  ) {}

  async deleteFile(publicId: string) {
    try {
      await this.fileService.deleteFile(publicId);
    } catch (error) {
      console.error('Error while deleting file from Cloudinary');
      console.error(error.message);
    }
  }

  async writeToFile(
    backupData: string,
    databaseName: string,
  ): Promise<UploadApiResponse> {
    const bytesStream = Buffer.from(backupData);

    const fileName =
      databaseName +
      '-' +
      new Date().getTime() +
      Math.round(Math.random() * 100)
        .toFixed(2)
        .toString() +
      '.txt';

    return await this.fileService.uploadFile(bytesStream, fileName);
  }

  async getTextFile(url: string) {
    return await this.fileService.getTextFile(url);
  }

  isDatabaseSupported(database: Database): boolean {
    switch (database) {
      case Database.MYSQL:
        return true;
      case Database.POSTGRE_SQL:
        return false;
      case Database.MONGO:
        return false;
    }
  }

  throwErrorIfDatabaseNotSupported(database: Database) {
    if (this.isDatabaseSupported(database) == false)
      throw new BadRequestException(
        'Database not supported',
        database + ' is not yet supported',
      );
  }

  async connectDatabase(databaseCredentialsDto: DatabaseCredentialsDto) {
    // MySQL
    if (databaseCredentialsDto.databaseType == Database.MYSQL) {
      await this.mySqlService.connect(databaseCredentialsDto);
    }

    // PostGreSQL
    else if (databaseCredentialsDto.databaseType == Database.POSTGRE_SQL) {
      await this.postGreSqlService.connect(databaseCredentialsDto);
    }
  }

  async disconnectDatabase(database: Database) {
    // MySQL
    if (database == Database.MYSQL) {
      await this.mySqlService.disconnect();
    }

    // PostGreSQL
    else if (database == Database.POSTGRE_SQL) {
      await this.postGreSqlService.disconnect();
    }
  }

  async createDatabaseBackupUtil(
    databaseCredentialsDto: DatabaseCredentialsDto,
  ): Promise<string> {
    // MySQL
    if (databaseCredentialsDto.databaseType == Database.MYSQL)
      return await this.mySqlService.getDatabaseBackup(databaseCredentialsDto);
    //
    //
    // PostGreSQL
    else if (databaseCredentialsDto.databaseType == Database.POSTGRE_SQL)
      return await this.postGreSqlService.getDatabaseBackup(
        databaseCredentialsDto,
      );
  }

  async restoreDatabaseBackupUtil(
    databaseCredentialsDto: DatabaseCredentialsDto,
    backupData: string,
  ) {
    // MySQL
    if (databaseCredentialsDto.databaseType == Database.MYSQL)
      await this.mySqlService.restoreBackup(databaseCredentialsDto, backupData);
    //
    //
    // PostGreSQL
    else if (databaseCredentialsDto.databaseType == Database.POSTGRE_SQL)
      await this.postGreSqlService.restoreBackup(
        databaseCredentialsDto,
        backupData,
      );
  }

  async returnBackupOrThrowError(backupId: string) {
    const backup = await this.backupModel.findOne({ _id: backupId }).exec();

    if (!backup)
      throw new NotFoundException(
        'update backup failed',
        'backup with id ' + backupId + ' does not exist',
      );

    return backup;
  }
}
