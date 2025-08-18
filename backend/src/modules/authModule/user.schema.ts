import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;  // Stored in plaintext (per your request)

  @Prop({ required: true, default: 'user-access' })
  access: 'user-access' | 'admin-access';
}

export const UserSchema = SchemaFactory.createForClass(User);