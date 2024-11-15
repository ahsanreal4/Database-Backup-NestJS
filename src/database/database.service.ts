import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseCredentialsDto } from 'src/database/dto/databaseCredentialsDto';
import { ConnectMySqlService } from './connect-db/connect-mysql.service';
import { Database } from 'src/common/types/enums/database';
import { ConnectPostGreSqlService } from './connect-db/connect-postgresql.service';
import { UploadApiResponse } from 'cloudinary';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { Backup } from 'src/common/schema/backup';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/common/schema/user';

@Injectable()
export class DatabaseService {
  constructor(
    private mySqlService: ConnectMySqlService,
    private postGreSqlService: ConnectPostGreSqlService,
    private fileService: FileUploadService,
    @InjectModel(Backup.name) private backupModel: Model<Backup>,
  ) {}

  private isDatabaseSupported(database: Database): boolean {
    switch (database) {
      case Database.MYSQL:
        return true;
      case Database.POSTGRE_SQL:
        return true;
      case Database.MONGO:
        return false;
    }
  }

  private async writeToFile(
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

  private throwErrorIfDatabaseNotSupported(database: Database) {
    if (this.isDatabaseSupported(database) == false)
      throw new BadRequestException(
        'Database not supported',
        database + ' is not yet supported',
      );
  }

  private async connectDatabase(
    databaseCredentialsDto: DatabaseCredentialsDto,
  ) {
    // MySQL
    if (databaseCredentialsDto.databaseType == Database.MYSQL) {
      await this.mySqlService.connect(databaseCredentialsDto);
    }

    // PostGreSQL
    else if (databaseCredentialsDto.databaseType == Database.POSTGRE_SQL) {
      await this.postGreSqlService.connect(databaseCredentialsDto);
    }
  }

  private async disconnectDatabase(database: Database) {
    // MySQL
    if (database == Database.MYSQL) {
      await this.mySqlService.disconnect();
    }

    // PostGreSQL
    else if (database == Database.POSTGRE_SQL) {
      await this.postGreSqlService.disconnect();
    }
  }

  private async createDatabaseBackupUtil(
    databaseCredentialsDto: DatabaseCredentialsDto,
  ): Promise<string> {
    // MySQL
    if (databaseCredentialsDto.databaseType == Database.MYSQL)
      return await this.mySqlService.getDatabaseBackup(databaseCredentialsDto);
    //
    //
    // PostGreSQL
    // else if (databaseCredentialsDto.databaseType == Database.POSTGRE_SQL)
    // return await this.postGreSqlService.disconnect();
  }

  async testDatabaseConnection(databaseCredentialsDto: DatabaseCredentialsDto) {
    this.throwErrorIfDatabaseNotSupported(databaseCredentialsDto.databaseType);
    await this.connectDatabase(databaseCredentialsDto);
    await this.disconnectDatabase(databaseCredentialsDto.databaseType);

    return 'Database connected successfully';
  }

  private async deleteFile(publicId: string) {
    try {
      await this.fileService.deleteFile(publicId);
    } catch (error) {
      console.error('Error while deleting file from Cloudinary');
      console.error(error.message);
    }
  }

  async createDatabaseBackup(
    databaseCredentialsDto: DatabaseCredentialsDto,
    userId: string,
  ) {
    this.throwErrorIfDatabaseNotSupported(databaseCredentialsDto.databaseType);
    const backupData = await this.createDatabaseBackupUtil(
      databaseCredentialsDto,
    );

    const result = await this.writeToFile(
      backupData,
      databaseCredentialsDto.name,
    );

    const backup: Backup = {
      publicId: result.public_id,
      createdAt: new Date(),
      databaseType: databaseCredentialsDto.databaseType,
      url: result.url,
      userId: userId as unknown as User,
      databaseCredentials: databaseCredentialsDto,
    };

    try {
      const saveBackup = new this.backupModel(backup);
      await saveBackup.save();
    } catch (error) {
      await this.deleteFile(backup.publicId);

      throw new BadRequestException(
        'Error while creating backup',
        error.message,
      );
    }

    return result.url;
  }

  async updateDatabaseBackup(backupId: string) {
    const backup = await this.backupModel.findOne({ _id: backupId }).exec();

    if (!backup)
      throw new NotFoundException(
        'update backup failed',
        'backup with id ' + backupId + ' does not exist',
      );

    const { host, name, password, username } = backup.databaseCredentials;

    const databaseCredentialsDto: DatabaseCredentialsDto = {
      databaseType: backup.databaseType,
      host,
      name,
      password,
      username,
    };

    const backupData = await this.createDatabaseBackupUtil(
      databaseCredentialsDto,
    );

    const result = await this.writeToFile(
      backupData,
      backup.databaseCredentials.name,
    );

    await this.deleteFile(backup.publicId);

    backup.publicId = result.public_id;
    backup.url = result.url;
    backup.createdAt = new Date();

    await backup.save();

    return 'Backup updated successfully';
  }

  async getUserBackups(userId: string) {
    return await this.backupModel.find({ userId }).exec();
  }

  async deleteDatabaseBackup(backupId: string) {
    const backup = await this.backupModel.findByIdAndDelete(backupId).exec();

    if (!backup)
      throw new NotFoundException(
        'delete backup failed',
        'backup with id ' + backupId + ' does not exist',
      );

    await this.deleteFile(backup.publicId);

    return 'Backup deleted successfully';
  }
}
