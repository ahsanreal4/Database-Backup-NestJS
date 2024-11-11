import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';
import { EnvironmentVariables } from 'src/types/environmentVariables';

@Injectable()
export class AppDatabaseService {
  private connection: mysql.Connection;

  constructor(private configService: ConfigService<EnvironmentVariables>) {
    this.initializeConnection();
  }

  async initializeConnection() {
    const { host, name, password, username } = this.configService.get(
      'database',
      { infer: true },
    );

    try {
      this.connection = await mysql.createConnection({
        host: host, // Replace with your MySQL host
        user: username, // Replace with your MySQL username
        password: password, // Replace with your MySQL password
        database: name, // Optional if connecting to a specific database
      });
      console.log('MySQL DB connected');

      // await this.initializeDatabase();
    } catch (error) {
      console.error('Error connecting to MySQL:', error.message);
    }
  }

  async initializeDatabase() {
    try {
      // Example: Create a table if it doesn't exist
      const query = `
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL
        );
      `;
      await this.connection.execute(query);
      console.log('Database initialized successfully.');
    } catch (error) {
      console.error('Error initializing database:', error.message);
    }
  }

  async onModuleDestroy() {
    await this.connection.end();
    console.log('Database connection closed');
  }
}
