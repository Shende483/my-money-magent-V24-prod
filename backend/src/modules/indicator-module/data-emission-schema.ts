import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class EmissionSettings extends Document {
  @Prop({ required: true, unique: true })
  symbol: string;

  @Prop({ 
    type: [String], 
    default: [
      'EMA50', 'EMA200', 'RSI', 'MACD',
      'FibonacciBollingerBands', 'VWAP', 
      'BollingerBands', 'CandlestickPatterns','Nadaraya-Watson-LuxAlgo',
    'SRv2',
    'Pivot Points High Low',
    'Pivot Points Standard',
    ] 
  })
  enabledIndicators: string[];

  @Prop({ type: [String], default: ['15', '60', '240', '1D', '1W'] })
  enabledTimeframes: string[];
}

export const EmissionSettingsSchema = SchemaFactory.createForClass(EmissionSettings);