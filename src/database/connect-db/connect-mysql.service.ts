import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseCredentialsDto } from 'src/dto/database/databaseCredentialsDto';
import * as mysql from 'mysql2/promise';
import { FileUploadService } from 'src/file-upload/file-upload.service';

@Injectable()
export class ConnectMySqlService {
  connection: mysql.Connection;

  constructor(private fileUploadService: FileUploadService) {}

  async connect(databaseCredentialsDto: DatabaseCredentialsDto) {
    const { host, name, password, username } = databaseCredentialsDto;

    try {
      this.connection = await mysql.createConnection({
        host,
        user: username,
        password,
        database: name,
      });
    } catch (error) {
      throw new BadRequestException(
        'Database connection failed',
        error.message,
      );
    }
  }

  // Method to fetch table schema
  private async getTableSchema(tableName: string): Promise<string> {
    const query = `SHOW CREATE TABLE ${tableName}`;
    const [rows] = await this.executeQuery(query);
    return rows[0]['Create Table'];
  }

  // Method to fetch all data from a table
  async getTableData(tableName: string): Promise<any[]> {
    const query = `SELECT * FROM ${tableName}`;
    const [rows] = await this.executeQuery(query);
    return rows;
  }

  // Method to fetch table names
  private async getTableNames(): Promise<string[]> {
    const query = 'SHOW TABLES';
    const [rows] = await this.executeQuery(query);
    return rows.map((row: any) => Object.values(row)[0]);
  }

  // Method to execute a query and return results
  private async executeQuery(query: string): Promise<any[]> {
    try {
      return await this.connection.query(query);
    } catch (error) {
      console.error('Error while fetching table names from MySQL database');
    }
  }

  private async createBackup(databaseName: string) {
    try {
      const tables = await this.getTableNames();
      let backupData = '';

      // Loop through all tables
      for (const table of tables) {
        // Get table schema
        const schema = await this.getTableSchema(table);
        backupData += schema + ';\n';

        // Get table data
        const tableData = await this.getTableData(table);
        tableData.forEach((row) => {
          const columns = Object.keys(row).join(', ');
          const values = Object.values(row)
            .map((value) => `'${value}'`)
            .join(', ');
          backupData += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
        });
      }

      const bytesStream = Buffer.from(backupData);

      const fileName =
        databaseName +
        '-' +
        new Date().getTime() +
        Math.round(Math.random() * 100)
          .toFixed(2)
          .toString();

      return await this.fileUploadService.uploadFile(bytesStream, fileName);
    } catch (error) {
      throw new BadRequestException('Database backup failed', error.message);
    }
  }

  async getDatabaseBackup(databaseCredentialsDto: DatabaseCredentialsDto) {
    await this.connect(databaseCredentialsDto);
    const result = await this.createBackup(databaseCredentialsDto.name);
    await this.disconnect();
    return result;
  }

  async disconnect() {
    await this.connection.end();
  }
}
