import { DatabaseCredentials } from './databaseCredentials';

export interface EnvironmentVariables {
  database: DatabaseCredentials;
  cloudinary: {
    name: string;
    key: string;
    secret: string;
  };
}
