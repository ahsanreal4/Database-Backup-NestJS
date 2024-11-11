import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { EnvironmentVariables } from 'src/types/environmentVariables';

@Injectable()
export class FileUploadService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {
    const { key, name, secret } = this.configService.get('cloudinary', {
      infer: true,
    });

    // Configure Cloudinary with environment variables
    cloudinary.config({
      cloud_name: name,
      api_key: key,
      api_secret: secret,
    });
  }

  async uploadFile(
    buffer: Buffer,
    fileName: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      // Convert buffer to base64
      const base64String = `data:text/plain;base64,${buffer.toString('base64')}`;

      // Upload to Cloudinary
      cloudinary.uploader.upload(
        base64String,
        { public_id: fileName, resource_type: 'raw' },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        },
      );
    });
  }
}
