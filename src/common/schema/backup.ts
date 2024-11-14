import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Database } from 'src/types/enums/database';
import { User } from './user';

export type UserDocument = HydratedDocument<Backup>;

@Schema()
export class Backup {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: User;

  @Prop({ required: true, enum: Database })
  databaseType: Database;

  @Prop({ required: true, unique: true })
  publicId: string;

  @Prop({ required: true, unique: true })
  url: string;

  @Prop({ required: true })
  createdAt: Date;
}

export const BackupSchema = SchemaFactory.createForClass(Backup);
