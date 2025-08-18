import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class IndicatorSettings extends Document {


  @Prop({
    type: String,
    required: true,
    enum: ['VANTAGE:BTCUSD', 'VANTAGE:XAUUSD', 'VANTAGE:GER40', 'VANTAGE:NAS100', 'VANTAGE:XRPUSD',
    'BINANCE:SUIUSDT',],
  })
  symbol: string;

  @Prop({
    type: String,
    required: true,
    enum: ['15', '60', '240', '1D', '1W'],
  })
  timeframe: string;

  @Prop({
    type: String,
    required: true,
    enum: ['EMA50', 'EMA200', 'RSI', 'MACD', 'FibonacciBollingerBands', 'VWAP', 'BollingerBands', 'CandlestickPatterns','Nadaraya-Watson-LuxAlgo', 'SRv2', 'Pivot Points High Low', 'Pivot Points Standard'],
  })
  indicator: string;

  @Prop({ type: String, required: true, unique: true })
  symbolTimeframeIndicator: string;

  @Prop({
    type: Number,
    required: false,
    min: 1,
    max: 200,
  })
  period?: number;

  @Prop({
    type: String,
    required: false,
    enum: ['close', 'open', 'high', 'low', 'hl2', 'hlc3', 'hlcc4', 'ohlc4'],
  })
  source?: string;

  @Prop({
    type: Number,
    required: false,
    min: -100,
    max: 100,
  })
  offset?: number;

  @Prop({
    type: Number,
    required: false,
    min: 1,
    max: 200,
  })
  length?: number;

  @Prop({
    type: Number,
    required: false,
    min: 0.1,
    max: 5.0,
  })
  bbStdDev?: number;

  @Prop({
    type: Number,
    required: false,
    min: 1,
    max: 100,
  })
  rsiLength?: number;

  @Prop({
    type: String,
    required: false,
    enum: ['None', 'SMA', 'EMA', 'SMMA (RMA)', 'WMA', 'VWMA'],
  })
  maType?: string;

  @Prop({
    type: Number,
    required: false,
    min: 1,
    max: 50,
  })
  macdFastPeriod?: number;

  @Prop({
    type: Number,
    required: false,
    min: 1,
    max: 100,
  })
  macdSlowPeriod?: number;

  @Prop({
    type: Number,
    required: false,
    min: 1,
    max: 50,
  })
  macdSignalPeriod?: number;

  @Prop({
    type: String,
    required: false,
    enum: ['SMA', 'EMA'],
  })
  macdSourceMaType?: string;

  @Prop({
    type: String,
    required: false,
    enum: ['SMA', 'EMA'],
  })
  macdSignalMaType?: string;

  @Prop({ type: Number, required: false })
  latestValue?: number;

  @Prop({
    type: Number,
    required: false,
    min: 50,
    max: 500,
  })
  fibLookback?: number;

  @Prop({
    type: Number,
    required: false,
    min: 0.1,
    max: 10,
  })
  multiply?: number;

  @Prop({
    type: String,
    required: false,
    enum: ['Session', 'Week', 'Month', 'Quarter', 'Year', 'Decade', 'Century', 'Earnings', 'Dividends', 'Splits'],
  })
  vwapAnchor?: string;

  @Prop({
    type: Number,
    required: false,
    min: 0.1,
    max: 10,
  })
  vwapBandsMultiplier1?: number;

  @Prop({
    type: Number,
    required: false,
    min: 0.1,
    max: 10,
  })
  vwapBandsMultiplier2?: number;

  @Prop({
    type: Number,
    required: false,
    min: 0.1,
    max: 10,
  })
  vwapBandsMultiplier3?: number;

  @Prop({
    type: Boolean,
    required: false,
  })
  hideVwapOn1DOrAbove?: boolean;

  @Prop({
    type: String,
    required: false,
    enum: ['Standard Deviation', 'Percentage'],
  })
  bandsCalculationMode?: string;

  @Prop({
    type: Boolean,
    required: false,
  })
  band1?: boolean;

  @Prop({
    type: Boolean,
    required: false,
  })
  band2?: boolean;

  @Prop({
    type: Boolean,
    required: false,
  })
  band3?: boolean;

  @Prop({
    type: String,
    required: false,
  })
  timeframeInput?: string;

  @Prop({
    type: Boolean,
    required: false,
  })
  waitForTimeframeCloses?: boolean;

  @Prop({
    type: Boolean,
    required: false,
  })
  calculateDivergence?: boolean;

  @Prop({
    type: String,
    required: false,
    enum: ['Bullish', 'Bearish', 'Both'],
  })
  patternType?: string;

  @Prop({
    type: String,
    required: false,
    enum: ['SMA50', 'SMA50, SMA200', 'No detection'],
  })
  trendRule?: string;

  @Prop({
    type: Object,
    required: false,
  })
  patternSettings?: {
    Abandoned_Baby?: boolean;
    Dark_Cloud_Cover?: boolean;
    Doji?: boolean;
    Doji_Star?: boolean;
    Downside_Tasuki_Gap?: boolean;
    Dragonfly_Doji?: boolean;
    Engulfing?: boolean;
    Evening_Doji_Star?: boolean;
    Evening_Star?: boolean;
    Falling_Three_Methods?: boolean;
    Falling_Window?: boolean;
    Gravestone_Doji?: boolean;
    Hammer?: boolean;
    Hanging_Man?: boolean;
    Harami_Cross?: boolean;
    Harami?: boolean;
    Inverted_Hammer?: boolean;
    Kicking?: boolean;
    Long_Lower_Shadow?: boolean;
    Long_Upper_Shadow?: boolean;
    Marubozu_Black?: boolean;
    Marubozu_White?: boolean;
    Morning_Doji_Star?: boolean;
    Morning_Star?: boolean;
    On_Neck?: boolean;
    Piercing?: boolean;
    Rising_Three_Methods?: boolean;
    Rising_Window?: boolean;
    Shooting_Star?: boolean;
    Spinning_Top_Black?: boolean;
    Spinning_Top_White?: boolean;
    Three_Black_Crows?: boolean;
    Three_White_Soldiers?: boolean;
    TriStar?: boolean;
    Tweezer_Bottom?: boolean;
    Tweezer_Top?: boolean;
    Upside_Tasuki_Gap?: boolean;
  };



 @Prop({ type: Number, required: false, min: 1, max: 100 })
  Bandwidth?: number;

  @Prop({ type: Number, required: false, min: 0.1, max: 10 })
  mult?: number;

  @Prop({
    type: String,
    required: false,
    enum: [ 'close','High/Low','Close/Open'],
  })
  Source?: string;

  @Prop({ type: Boolean, required: false })
  Repainting_Smoothing?: boolean;

  @Prop({ type: Number, required: false, min: 1, max: 50 })
  Pivot_Period?: number;

  @Prop({ type: Number, required: false, min: 1, max: 100 })
  Maximum_Number_of_Pivot?: number;

  @Prop({ type: Number, required: false, min: 1, max: 50 })
  Maximum_Channel_Width_?: number;

  @Prop({ type: Number, required: false, min: 1, max: 20 })
  Maximum_Number_of_SR?: number;

  @Prop({ type: Number, required: false, min: 1, max: 10 })
  Minimum_Strength?: number;

  @Prop({ type: Number, required: false, min: 0, max: 100 })
  Label_Location?: number;

  @Prop({
    type: String,
    required: false,
    enum: ['Solid', 'Dashed', 'Dotted'],
  })
  Line_Style?: string;

  @Prop({ type: Number, required: false, min: 1, max: 5 })
  Line_Width?: number;

  @Prop({ type: Number, required: false, min: 1, max: 50 })
  Pivot_High?: number;

  @Prop({ type: Number, required: false, min: 1, max: 50 })
  Pivot_Low?: number;

  @Prop({
    type: String,
    required: false,
    enum: ['Traditional', 'Fibonacci', 'Woodie', 'Classic', 'DM', 'Camarilla'],
  })
  Type?: string;

  @Prop({
    type: String,
    required: false,
    enum: ['Auto', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly', 'Biyearly', 'Triyearly', 'Quinquennially', 'Decennially'],
  })
  Pivots_Timeframe?: string;

  @Prop({ type: Number, required: false, min: 1, max: 200 })
  Number_of_Pivots_Back?: number;

  @Prop({ type: Boolean, required: false })
  Use_Dailybased_Values?: boolean;

    @Prop({ type: Number, required: false })
 threshold:number// Added for pivot point threshold

  @Prop({ type: String, required: false })
 session:string// Added for pivot point threshold

 @Prop({ type: String, required: false })
 signature:string// Added for pivot point threshold

}

export const IndicatorSettingsSchema = SchemaFactory.createForClass(IndicatorSettings);