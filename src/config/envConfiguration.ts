export interface EnvironmentVariables {
  database: {
    host: string;
    username: string;
    password: string;
    name: string;
  };
}

export default (): EnvironmentVariables => ({
  database: {
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
});
