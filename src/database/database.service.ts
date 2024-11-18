import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseCredentialsDto } from '../database/dto/databaseCredentialsDto';
import { Backup } from '../common/schema/backup';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../common/schema/user';
import { CreateBackupDto } from './dto/createBackupDto';
import { ConnectDbService } from './connect-db/connect-db.service';

@Injectable()
export class DatabaseService {
  constructor(
    private connectDatabaseService: ConnectDbService,
    @InjectModel(Backup.name) private backupModel: Model<Backup>,
  ) {}

  async testDatabaseConnection(databaseCredentialsDto: DatabaseCredentialsDto) {
    this.connectDatabaseService.throwErrorIfDatabaseNotSupported(
      databaseCredentialsDto.databaseType,
    );
    await this.connectDatabaseService.connectDatabase(databaseCredentialsDto);
    await this.connectDatabaseService.disconnectDatabase(
      databaseCredentialsDto.databaseType,
    );

    return 'Database connected successfully';
  }

  async createDatabaseBackup(createBackupDto: CreateBackupDto, userId: string) {
    const { databaseCredentials, name } = createBackupDto;

    const findExistingBackup = await this.backupModel
      .findOne({ name, userId })
      .exec();

    if (findExistingBackup)
      throw new BadRequestException(
        'create backup failed',
        'backup with this name already exists',
      );

    this.connectDatabaseService.throwErrorIfDatabaseNotSupported(
      databaseCredentials.databaseType,
    );
    const backupData =
      await this.connectDatabaseService.createDatabaseBackupUtil(
        databaseCredentials,
      );

    const result = await this.connectDatabaseService.writeToFile(
      backupData,
      databaseCredentials.name,
    );

    const backup: Backup = {
      publicId: result.public_id,
      createdAt: new Date(),
      databaseType: databaseCredentials.databaseType,
      url: result.url,
      userId: userId as unknown as User,
      databaseCredentials,
      name,
    };

    try {
      const saveBackup = new this.backupModel(backup);
      await saveBackup.save();
    } catch (error) {
      await this.connectDatabaseService.deleteFile(backup.publicId);

      throw new BadRequestException(
        'Error while creating backup',
        error.message,
      );
    }

    return result.url;
  }

  async restoreBackup(backupId: string) {
    const backup =
      await this.connectDatabaseService.returnBackupOrThrowError(backupId);

    const { host, name, password, username } = backup.databaseCredentials;

    const databaseCredentialsDto: DatabaseCredentialsDto = {
      databaseType: backup.databaseType,
      host,
      name,
      password,
      username,
    };

    const backupData = await this.connectDatabaseService.getTextFile(
      backup.url,
    );

    await this.connectDatabaseService.restoreDatabaseBackupUtil(
      databaseCredentialsDto,
      backupData,
    );

    return 'Database restored successfully';
  }

  async updateDatabaseBackup(backupId: string) {
    const backup =
      await this.connectDatabaseService.returnBackupOrThrowError(backupId);

    const { host, name, password, username } = backup.databaseCredentials;

    const databaseCredentialsDto: DatabaseCredentialsDto = {
      databaseType: backup.databaseType,
      host,
      name,
      password,
      username,
    };

    const backupData =
      await this.connectDatabaseService.createDatabaseBackupUtil(
        databaseCredentialsDto,
      );

    const result = await this.connectDatabaseService.writeToFile(
      backupData,
      backup.databaseCredentials.name,
    );

    await this.connectDatabaseService.deleteFile(backup.publicId);

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

    await this.connectDatabaseService.deleteFile(backup.publicId);

    return 'Backup deleted successfully';
  }

  async deleteAllDatabaseBackups(userId: string) {
    const backups = await this.backupModel.find({ userId }).exec();

    await Promise.allSettled(
      backups.map(async (backup) => {
        await this.deleteDatabaseBackup(backup._id.toString());
      }),
    );

    return 'All backups deleted successfully';
  }
}
