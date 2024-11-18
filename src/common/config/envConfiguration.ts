import { EnvironmentVariables } from '../../common/types/environmentVariables';

export default (): EnvironmentVariables => ({
  cloudinary: {
    name: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY,
    secret: process.env.CLOUDINARY_API_SECRET,
  },
});
