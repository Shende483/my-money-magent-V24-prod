

import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsIn,
  IsBoolean,
  IsObject,
  ValidateIf,
} from 'class-validator';

export class CreateIndicatorSettingsDto {
  @IsString()
  @IsIn(['VANTAGE:BTCUSD','VANTAGE:XAUUSD','VANTAGE:GER40','VANTAGE:NAS100', 'VANTAGE:XRPUSD',
    'BINANCE:SUIUSDT',])
  symbol: string;

  @IsString()
  @IsIn(['15', '60', '240', '1D', '1W'])
  timeframe: string;

  @IsString()
  @IsIn([
    'EMA50', 'EMA200', 'RSI', 'MACD',
    'FibonacciBollingerBands', 'VWAP', 'BollingerBands', 'CandlestickPatterns', 'Nadaraya-Watson-LuxAlgo',
    'SRv2',
    'Pivot Points High Low',
    'Pivot Points Standard',
  ])
  indicator:
    | 'EMA50'
    | 'EMA200'
    | 'RSI'
    | 'MACD'
    | 'FibonacciBollingerBands'
    | 'VWAP'
    | 'BollingerBands'
    | 'CandlestickPatterns'
     | 'Nadaraya-Watson-LuxAlgo'
    | 'SRv2'
    | 'Pivot Points High Low'
    | 'Pivot Points Standard';

  @IsString()
  symbolTimeframeIndicator: string;

  @ValidateIf(o => ['EMA50', 'EMA200'].includes(o.indicator))
  @IsNumber()
  @Min(1)
  @Max(200)
  period?: number;

  @IsOptional()
  @IsString()
  @IsIn(['close', 'open', 'high', 'low', 'hl2', 'hlc3', 'hlcc4', 'ohlc4'])
  source?: 'close' | 'open' | 'high' | 'low' | 'hl2' | 'hlc3' | 'hlcc4' | 'ohlc4';

  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(100)
  offset?: number;

  @ValidateIf(o => ['RSI', 'BollingerBands'].includes(o.indicator))
  @IsNumber()
  @Min(1)
  @Max(200)
  length?: number;

  @ValidateIf(o => ['RSI', 'BollingerBands'].includes(o.indicator))
  @IsNumber()
  @Min(0.1)
  @Max(5.0)
  bbStdDev?: number;

  @ValidateIf(o => o.indicator === 'RSI')
  @IsNumber()
  @Min(1)
  @Max(100)
  rsiLength?: number;

  @ValidateIf(o => ['EMA50', 'EMA200', 'RSI', 'BollingerBands'].includes(o.indicator))
  @IsString()
  @IsIn(['None', 'SMA', 'EMA', 'SMMA (RMA)', 'WMA', 'VWMA'])
  maType?: 'None' | 'SMA' | 'EMA' | 'SMMA (RMA)' | 'WMA' | 'VWMA';

  @ValidateIf(o => o.indicator === 'MACD')
  @IsNumber()
  @Min(1)
  @Max(50)
  macdFastPeriod?: number;

  @ValidateIf(o => o.indicator === 'MACD')
  @IsNumber()
  @Min(1)
  @Max(100)
  macdSlowPeriod?: number;

  @ValidateIf(o => o.indicator === 'MACD')
  @IsNumber()
  @Min(1)
  @Max(50)
  macdSignalPeriod?: number;

  @ValidateIf(o => o.indicator === 'MACD')
  @IsString()
  @IsIn(['SMA', 'EMA'])
  macdSourceMaType?: 'SMA' | 'EMA';

  @ValidateIf(o => o.indicator === 'MACD')
  @IsString()
  @IsIn(['SMA', 'EMA'])
  macdSignalMaType?: 'SMA' | 'EMA';

  @IsOptional()
  @IsNumber()
  latestValue?: number;

  @ValidateIf(o => o.indicator === 'FibonacciBollingerBands')
  @IsNumber()
  @Min(50)
  @Max(500)
  fibLookback?: number;

  @ValidateIf(o => o.indicator === 'FibonacciBollingerBands')
  @IsNumber()
  @Min(0.1)
  @Max(10)
  multiply?: number;

  @ValidateIf(o => o.indicator === 'VWAP')
  @IsString()
  @IsIn(['Session', 'Week', 'Month', 'Quarter', 'Year', 'Decade', 'Century', 'Earnings', 'Dividends', 'Splits'])
  vwapAnchor?: 'Session' | 'Week' | 'Month' | 'Quarter' | 'Year' | 'Decade' | 'Century' | 'Earnings' | 'Dividends' | 'Splits';

  @ValidateIf(o => o.indicator === 'VWAP')
  @IsNumber()
  @Min(0.1)
  @Max(10)
  vwapBandsMultiplier1?: number;

  @ValidateIf(o => o.indicator === 'VWAP')
  @IsNumber()
  @Min(0.1)
  @Max(10)
  vwapBandsMultiplier2?: number;

  @ValidateIf(o => o.indicator === 'VWAP')
  @IsNumber()
  @Min(0.1)
  @Max(10)
  vwapBandsMultiplier3?: number;

  @ValidateIf(o => o.indicator === 'VWAP')
  @IsBoolean()
  hideVwapOn1DOrAbove?: boolean;

  @ValidateIf(o => o.indicator === 'VWAP')
  @IsString()
  @IsIn(['Standard Deviation', 'Percentage'])
  bandsCalculationMode?: 'Standard Deviation' | 'Percentage';

  @ValidateIf(o => o.indicator === 'VWAP')
  @IsBoolean()
  band1?: boolean;

  @ValidateIf(o => o.indicator === 'VWAP')
  @IsBoolean()
  band2?: boolean;

  @ValidateIf(o => o.indicator === 'VWAP')
  @IsBoolean()
  band3?: boolean;

  @ValidateIf(o => ['RSI', 'MACD', 'VWAP', 'BollingerBands', 'CandlestickPatterns'].includes(o.indicator))
  @IsString()
  timeframeInput?: string;

  @ValidateIf(o => ['RSI', 'MACD', 'VWAP', 'BollingerBands', 'CandlestickPatterns'].includes(o.indicator))
  @IsBoolean()
  waitForTimeframeCloses?: boolean;

  @ValidateIf(o => o.indicator === 'RSI')
  @IsBoolean()
  calculateDivergence?: boolean;

  @ValidateIf(o => o.indicator === 'CandlestickPatterns')
  @IsString()
  @IsIn(['Bullish', 'Bearish', 'Both'])
  patternType?: 'Bullish' | 'Bearish' | 'Both';

  @ValidateIf(o => o.indicator === 'CandlestickPatterns')
  @IsString()
  @IsIn(['SMA50', 'SMA50, SMA200', 'No detection'])
  trendRule?: 'SMA50' | 'SMA50, SMA200' | 'No detection';

  @ValidateIf(o => o.indicator === 'CandlestickPatterns')
  @IsString()
  labelColorBullish?: string;

  @ValidateIf(o => o.indicator === 'CandlestickPatterns')
  @IsString()
  labelColorBearish?: string;

  @ValidateIf(o => o.indicator === 'CandlestickPatterns')
  @IsString()
  labelColorNeutral?: string;

  @ValidateIf(o => o.indicator === 'CandlestickPatterns')
  @IsObject()
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
 @IsOptional()
  @IsString()
  @IsIn([  'close','High/Low','Close/Open'])
  Source?: 'High/Low'|'Close/Open'|'close'

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  Bandwidth?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  mult?: number;

  @IsOptional()
  @IsBoolean()
  Repainting_Smoothing?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  Pivot_Period?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  Maximum_Number_of_Pivot?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  Maximum_Channel_Width_?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  Maximum_Number_of_SR?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  Minimum_Strength?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  Label_Location?: number;

  @IsOptional()
  @IsString()
  @IsIn(['Solid', 'Dashed', 'Dotted'])
  Line_Style?: 'Solid' | 'Dashed' | 'Dotted';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  Line_Width?: number;

  @IsOptional()
  @IsString()
  Resistance_Color?: string;

  @IsOptional()
  @IsString()
  Support_Color?: string;

  @IsOptional()
  @IsBoolean()
  Show_Point_Points?: boolean;

  @IsOptional()
  @IsNumber()
 threshold:number// Added for pivot point threshold
 
  @IsOptional()
  @IsString()
  session:string// Added for pivot point session

  @IsOptional()
  @IsString()
  signature:string// Added for pivot point signature
  

 
}