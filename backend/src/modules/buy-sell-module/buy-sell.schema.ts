import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'symbols', capped: { size: 1024, max: 10 } })
export class BuySell extends Document {
  @Prop({ required: true, maxlength: 30 })
  symbol: string;

  @Prop({ required: true, min: 0 })
  entryPrice: number;

  @Prop({ required: true, enum: ['long', 'short'] })
  side: string;
}

export const BuySellSchema = SchemaFactory.createForClass(BuySell);