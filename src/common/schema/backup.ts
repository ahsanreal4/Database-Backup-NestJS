import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Database } from 'src/common/types/enums/database';
import { User } from './user';
import { DatabaseCredentials } from '../types/databaseCredentials';

export type UserDocument = HydratedDocument<Backup>;

// Subdocument Schema for a Comment
const DatabaseCredentialsSchema = new mongoose.Schema<DatabaseCredentials>({
  host: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
});

@Schema()
export class Backup {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: User;

  @Prop({ required: true, enum: Database })
  databaseType: Database;

  @Prop({ required: true, type: DatabaseCredentialsSchema })
  databaseCredentials: DatabaseCredentials;

  @Prop({ required: true, unique: true })
  publicId: string;

  @Prop({ required: true, unique: true })
  url: string;

  @Prop({ required: true })
  createdAt: Date;
}

export const BackupSchema = SchemaFactory.createForClass(Backup);
