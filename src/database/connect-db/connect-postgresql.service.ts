import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseCredentialsDto } from 'src/dto/database/databaseCredentialsDto';
import { Client } from 'pg';

@Injectable()
export class ConnectPostGreSqlService {
  connection;

  async connect(databaseCredentialsDto: DatabaseCredentialsDto) {
    const { host, name, password, username } = databaseCredentialsDto;

    try {
      this.connection = new Client({
        host: host,
        //   port: 5432,
        user: username,
        password: password,
        database: name,
      });

      await this.connection.connect();
      console.log('Connected to PostgreSQL database');
    } catch (error) {
      throw new BadRequestException(
        'Database connection failed',
        error.message,
      );
    }
  }

  async disconnect() {
    await this.connection.end();
  }
}
