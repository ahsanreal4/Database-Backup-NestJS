import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseCredentialsDto } from '../../database/dto/databaseCredentialsDto';
import * as mysql from 'mysql2/promise';

@Injectable()
export class ConnectMySqlService {
  connection: mysql.Connection;

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

  async getDatabaseBackup(databaseCredentialsDto: DatabaseCredentialsDto) {
    await this.connect(databaseCredentialsDto);
    const result = await this.createBackup();
    await this.disconnect();
    return result;
  }

  async restoreBackup(
    databaseCredentialsDto: DatabaseCredentialsDto,
    backupData: string,
  ) {
    await this.connect(databaseCredentialsDto);
    await this.restoreBackupUtil(backupData);
    await this.disconnect();
  }

  async disconnect() {
    await this.connection.end();
  }

  private async restoreBackupUtil(backupData: string) {
    const backupQueries = backupData.split(';');

    for (const backupQuery of backupQueries) {
      if (backupQuery.length == 0 || backupQuery.trim().length == 0) continue;

      const queryToExecute = backupQuery + ';';

      await this.executeQuery(queryToExecute);
    }
  }

  // Method to fetch table schema
  private async getTableSchema(tableName: string): Promise<string> {
    const query = `SHOW CREATE TABLE ${tableName}`;
    const [rows] = await this.executeQuery(query);
    return rows[0]['Create Table'];
  }

  // Method to fetch all data from a table
  private async getTableData(tableName: string): Promise<any[]> {
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
      console.error('Error while executing query on MySQL database');
      console.error(query);
      console.error(error.message);
    }
  }

  private async createBackup() {
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

      return backupData;
    } catch (error) {
      throw new BadRequestException('Database backup failed', error.message);
    }
  }
}
