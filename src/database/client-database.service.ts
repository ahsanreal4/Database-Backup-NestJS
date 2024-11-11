import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseCredentialsDto } from 'src/dto/database/databaseCredentialsDto';
import { ConnectMySqlService } from './connect-db/connect-mysql.service';
import { Database } from 'src/types/enums/database';
import { ConnectPostGreSqlService } from './connect-db/connect-postgresql.service';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class ClientDatabaseService {
  constructor(
    private mySqlService: ConnectMySqlService,
    private postGreSqlService: ConnectPostGreSqlService,
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
  ): Promise<UploadApiResponse> {
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
    const result = await this.createDatabaseBackupUtil(databaseCredentialsDto);
    return result.url;
  }
}
