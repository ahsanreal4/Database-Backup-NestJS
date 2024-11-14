import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseCredentialsDto } from 'src/database/dto/databaseCredentialsDto';
import { ConnectMySqlService } from './connect-db/connect-mysql.service';
import { Database } from 'src/types/enums/database';
import { ConnectPostGreSqlService } from './connect-db/connect-postgresql.service';
import { UploadApiResponse } from 'cloudinary';
import { FileUploadService } from 'src/file-upload/file-upload.service';

@Injectable()
export class ClientDatabaseService {
  constructor(
    private mySqlService: ConnectMySqlService,
    private postGreSqlService: ConnectPostGreSqlService,
    private fileService: FileUploadService,
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
        .toString();

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

  async createDatabaseBackup(databaseCredentialsDto: DatabaseCredentialsDto) {
    this.throwErrorIfDatabaseNotSupported(databaseCredentialsDto.databaseType);
    const backupData = await this.createDatabaseBackupUtil(
      databaseCredentialsDto,
    );

    const result = await this.writeToFile(
      backupData,
      databaseCredentialsDto.name,
    );

    return result.url;
  }
}
