


import React, { useState, useEffect } from 'react';
import { Box, Card, CardHeader, CardContent, Typography, Grid, TextField, FormControlLabel, Checkbox, Button, Alert, CircularProgress, Snackbar } from '@mui/material';
import axios from 'axios';

interface IndicatorParameters {
  symbol: string;
  timeframe: string;
  indicator: string;
  symbolTimeframeIndicator?: string;
  Bandwidth?: number;
  mult?: number;
  Source?: 'close' | 'open' | 'high' | 'low' | 'hl2' | 'hlc3' | 'hlcc4' | 'ohlc4' | 'High/Low' | 'Close/Open';
  Repainting_Smoothing?: boolean;
  Pivot_Period?: number;
  Maximum_Number_of_Pivot?: number;
  Maximum_Channel_Width_?: number;
  Maximum_Number_of_SR?: number;
  Minimum_Strength?: number;
  Label_Location?: number;
  Line_Style?: 'Solid' | 'Dashed' | 'Dotted';
  Line_Width?: number;
  Resistance_Color?: string;
  Support_Color?: string;
  Show_Point_Points?: boolean;
  Pivot_High?: number;
  Pivot_Low?: number;
  threshold?: number; // Added threshold field
  session?: string; // Added session field
  signature?: string; // Added signature field
  Type?: 'Traditional' | 'Fibonacci' | 'Woodie' | 'Classic' | 'DM' | 'Camarilla';
  Pivots_Timeframe?: 'Auto' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | 'Biyearly' | 'Triyearly' | 'Quinquennially' | 'Decennially';
  Number_of_Pivots_Back?: number;
  Use_Dailybased_Values?: boolean;
  period?: number;
  offset?: number;
  length?: number;
  bbStdDev?: number;
  rsiLength?: number;
  maType?: 'None' | 'SMA' | 'EMA' | 'SMMA (RMA)' | 'WMA' | 'VWMA';
  macdFastPeriod?: number;
  macdSlowPeriod?: number;
  macdSignalPeriod?: number;
  macdSourceMaType?: 'SMA' | 'EMA';
  macdSignalMaType?: 'SMA' | 'EMA';
  fibLookback?: number;
  multiply?: number;
  vwapAnchor?: 'Session' | 'Week' | 'Month' | 'Quarter' | 'Year' | 'Decade' | 'Century' | 'Earnings' | 'Dividends' | 'Splits';
  vwapBandsMultiplier1?: number;
  vwapBandsMultiplier2?: number;
  vwapBandsMultiplier3?: number;
  hideVwapOn1DOrAbove?: boolean;
  bandsCalculationMode?: 'Standard Deviation' | 'Percentage';
  band1?: boolean;
  band2?: boolean;
  band3?: boolean;
  timeframeInput?: string;
  waitForTimeframeCloses?: boolean;
  calculateDivergence?: boolean;
  patternType?: 'Bullish' | 'Bearish' | 'Both';
  trendRule?: 'SMA50' | 'SMA50, SMA200' | 'No detection';
  patternSettings?: { [key: string]: boolean };
}

const IndicatorSettings: React.FC = () => {
  const [indicatorSettings, setIndicatorSettings] = useState<IndicatorParameters[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('');

  const backendSymbols: string[] = ['VANTAGE:XAUUSD', 'VANTAGE:GER40', 'VANTAGE:NAS100', 'VANTAGE:BTCUSD', 'VANTAGE:XRPUSD', 'BINANCE:SUIUSDT'];
  const displaySymbols: string[] = ['XAUUSD', 'GER40', 'NAS100', 'BTCUSD', 'XRPUSD', 'SUIUSDT'];
  const symbolMap: { [key: string]: string } = {
    'XAUUSD': 'VANTAGE:XAUUSD',
    'GER40': 'VANTAGE:GER40',
    'NAS100': 'VANTAGE:NAS100',
    'BTCUSD': 'VANTAGE:BTCUSD',
    'XRPUSD': 'VANTAGE:XRPUSD',
    'SUIUSDT': 'BINANCE:SUIUSDT'
  };
  const reverseSymbolMap: { [key: string]: string } = {
    'VANTAGE:XAUUSD': 'XAUUSD',
    'VANTAGE:GER40': 'GER40',
    'VANTAGE:NAS100': 'NAS100',
    'VANTAGE:BTCUSD': 'BTCUSD',
      'VANTAGE:XRPUSD': 'XRPUSD',
    'BINANCE:SUIUSDT': 'SUIUSDT'
  };
  const timeframes: string[] = ['15', '60', '240', '1D', '1W'];
  const sources: string[] = ['close', 'open', 'high', 'low', 'hl2', 'hlc3', 'hlcc4', 'ohlc4', 'High/Low'];
  const indicators: string[] = [
    'EMA50', 'EMA200', 'RSI', 'MACD', 'FibonacciBollingerBands', 'VWAP', 'BollingerBands', 'CandlestickPatterns',
    'Nadaraya-Watson-LuxAlgo', 'SRv2', 'Pivot Points High Low', 'Pivot Points Standard'
  ];
  const lineStyles: string[] = ['Solid', 'Dashed', 'Dotted'];
  const pivotTypes: string[] = ['Traditional', 'Fibonacci', 'Woodie', 'Classic', 'DM', 'Camarilla'];
  const pivotTimeframes: string[] = ['Auto', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly', 'Biyearly', 'Triyearly', 'Quinquennially', 'Decennially'];
  const maTypes: string[] = ['None', 'SMA', 'EMA', 'SMMA (RMA)', 'WMA', 'VWMA'];
  const vwapAnchors: string[] = ['Session', 'Week', 'Month', 'Quarter', 'Year', 'Decade', 'Century', 'Earnings', 'Dividends', 'Splits'];
  const bandsModes: string[] = ['Standard Deviation', 'Percentage'];
  const patternTypes: string[] = ['Bullish', 'Bearish', 'Both'];
  const trendRules: string[] = ['SMA50', 'SMA50, SMA200', 'No detection'];
  const candlestickPatterns: string[] = [
    'Abandoned_Baby', 'Dark_Cloud_Cover', 'Doji', 'Doji_Star', 'Downside_Tasuki_Gap', 'Dragonfly_Doji', 'Engulfing',
    'Evening_Doji_Star', 'Evening_Star', 'Falling_Three_Methods', 'Falling_Window', 'Gravestone_Doji', 'Hammer',
    'Hanging_Man', 'Harami_Cross', 'Harami', 'Inverted_Hammer', 'Kicking', 'Long_Lower_Shadow', 'Long_Upper_Shadow',
    'Marubozu_Black', 'Marubozu_White', 'Morning_Doji_Star', 'Morning_Star', 'On_Neck', 'Piercing',
    'Rising_Three_Methods', 'Rising_Window', 'Shooting_Star', 'Spinning_Top_Black', 'Spinning_Top_White',
    'Three_Black_Crows', 'Three_White_Soldiers', 'TriStar', 'Tweezer_Bottom', 'Tweezer_Top', 'Upside_Tasuki_Gap'
  ];
  const groupColors: { [key: string]: string } = {
    'Indicator Settings': '#4CAF50'
  };

  const timeframeLabels: { [key: string]: string } = {
    '15': '15m',
    '60': '1h',
    '240': '4h',
    '1D': '1D',
    '1W': '1W'
  };

  const defaultSettings: { [key: string]: IndicatorParameters } = {
    'EMA50': { symbol, timeframe, indicator: 'EMA50', Source: 'close', period: 50, offset: 0, maType: 'EMA' },
    'EMA200': { symbol, timeframe, indicator: 'EMA200', Source: 'close', period: 200, offset: 0, maType: 'EMA' },
    'RSI': { symbol, timeframe, indicator: 'RSI', Source: 'close', rsiLength: 14, length: 14, bbStdDev: 2, maType: 'SMA', calculateDivergence: false, waitForTimeframeCloses: true },
    'MACD': { symbol, timeframe, indicator: 'MACD', Source: 'close', macdFastPeriod: 12, macdSlowPeriod: 26, macdSignalPeriod: 9, macdSourceMaType: 'EMA', macdSignalMaType: 'EMA', waitForTimeframeCloses: true },
    'FibonacciBollingerBands': { symbol, timeframe, indicator: 'FibonacciBollingerBands', Source: 'close', fibLookback: 200, multiply: 3 },
    'VWAP': { symbol, timeframe, indicator: 'VWAP', Source: 'close', vwapAnchor: 'Session', vwapBandsMultiplier1: 1, vwapBandsMultiplier2: 2, vwapBandsMultiplier3: 3, hideVwapOn1DOrAbove: false, bandsCalculationMode: 'Standard Deviation', band1: true, band2: true, band3: true, waitForTimeframeCloses: true },
    'BollingerBands': { symbol, timeframe, indicator: 'BollingerBands', Source: 'close', length: 20, bbStdDev: 2, maType: 'SMA', offset: 0, waitForTimeframeCloses: true },
    'CandlestickPatterns': { 
      symbol, 
      timeframe, 
      indicator: 'CandlestickPatterns', 
      Source: 'close', 
      patternType: 'Both', 
      trendRule: 'No detection', 
      waitForTimeframeCloses: true,
      patternSettings: candlestickPatterns.reduce((acc, pattern) => ({ ...acc, [pattern]: true }), {})
    },
    'Nadaraya-Watson-LuxAlgo': { symbol, timeframe, indicator: 'Nadaraya-Watson-LuxAlgo', Source: 'close', Bandwidth: 1, mult: 3, Repainting_Smoothing: false },
    'SRv2': { symbol, timeframe, indicator: 'SRv2', Source: 'close', Pivot_Period: 7, Maximum_Number_of_Pivot: 50, Maximum_Channel_Width_: 4, Maximum_Number_of_SR: 10, Minimum_Strength: 2, Label_Location: 0, Line_Style: 'Solid', Line_Width: 1, Resistance_Color: '#FF0000', Support_Color: '#00FF00', Show_Point_Points: false },
    'Pivot Points High Low': { symbol, timeframe, indicator: 'Pivot Points High Low', Source: 'close', Pivot_High: 8, Pivot_Low: 10 ,threshold: 2.0 },
    'Pivot Points Standard': { symbol, timeframe, indicator: 'Pivot Points Standard', Source: 'close', Type: 'Traditional', Pivots_Timeframe: 'Auto', Number_of_Pivots_Back: 5, Use_Dailybased_Values: false }
  };

  const validateIndicatorInput = (field: keyof IndicatorParameters, value: any, indicator: string): string | null => {
    if (field === 'symbol' && !backendSymbols.includes(value)) return 'Symbol must be one of: ' + displaySymbols.join(', ');
    if (field === 'timeframe' && !timeframes.includes(value)) return 'Timeframe must be one of: ' + timeframes.join(', ');
    if (field === 'indicator' && !indicators.includes(value)) return 'Indicator must be one of: ' + indicators.join(', ');
    if (field === 'Source' && value && !sources.includes(value)) return 'Source must be one of: ' + sources.join(', ');
    if (field === 'Bandwidth') {
      const num = Number(value);
      if (isNaN(num) || num < 0.1 || num > 20) return 'Bandwidth must be between 0.1 and 20';
    }
    if (field === 'mult' && ['Nadaraya-Watson-LuxAlgo', 'FibonacciBollingerBands'].includes(indicator)) {
      const num = Number(value);
      if (isNaN(num) || num < 0.1 || num > 10) return 'Multiplier must be between 0.1 and 10';
    }
    if (field === 'Pivot_Period') {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 100) return 'Pivot Period must be between 1 and 100';
    }
    if (field === 'Maximum_Number_of_Pivot') {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 100) return 'Max Number of Pivots must be between 1 and 100';
    }
    if (field === 'Maximum_Channel_Width_') {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 50) return 'Channel Width must be between 1 and 50';
    }
    if (field === 'Maximum_Number_of_SR') {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 50) return 'Max Number of SR must be between 1 and 50';
    }
    if (field === 'Minimum_Strength') {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 20) return 'Min Strength must be between 1 and 20';
    }
    if (field === 'Label_Location') {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 100) return 'Label Location must be between 0 and 100';
    }
    if (field === 'Line_Style' && value && !lineStyles.includes(value)) return 'Line Style must be one of: ' + lineStyles.join(', ');
    if (field === 'Line_Width') {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 10) return 'Line Width must be between 1 and 10';
    }
    if (field === 'Pivot_High' || field === 'Pivot_Low') {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 100) return `${field} must be between 1 and 100`;
    }
     if (field === 'threshold' && indicator === 'Pivot Points High Low') { // Added validation for threshold
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 1000) return 'Threshold must be between 0 and 1000';
    }
    if (field === 'Type' && value && !pivotTypes.includes(value)) return 'Type must be one of: ' + pivotTypes.join(', ');
    if (field === 'Pivots_Timeframe' && value && !pivotTimeframes.includes(value)) return 'Pivots Timeframe must be one of: ' + pivotTimeframes.join(', ');
    if (field === 'Number_of_Pivots_Back') {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 50) return 'Number of Pivots Back must be between 1 and 50';
    }
    if (field === 'period') {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 200) return 'Period must be between 1 and 200';
    }
    if (field === 'offset') {
      const num = Number(value);
      if (isNaN(num) || num < -100 || num > 100) return 'Offset must be between -100 and 100';
    }
    if (field === 'length' || field === 'rsiLength') {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 200) return `${field} must be between 1 and 200`;
    }
    if (field === 'bbStdDev') {
      const num = Number(value);
      if (isNaN(num) || num < 0.1 || num > 5) return 'StdDev must be between 0.1 and 5';
    }
    if (field === 'maType' && value && !maTypes.includes(value)) return 'MA Type must be one of: ' + maTypes.join(', ');
    if (field === 'macdFastPeriod' || field === 'macdSignalPeriod') {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 50) return `${field} must be between 1 and 50`;
    }
    if (field === 'macdSlowPeriod') {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 100) return 'Slow Period must be between 1 and 100';
    }
    if (field === 'macdSourceMaType' || field === 'macdSignalMaType') {
      if (value && !['SMA', 'EMA'].includes(value)) return `${field} must be SMA or EMA`;
    }
    if (field === 'fibLookback') {
      const num = Number(value);
      if (isNaN(num) || num < 50 || num > 500) return 'Fib Lookback must be between 50 and 500';
    }
    if (field === 'vwapAnchor' && value && !vwapAnchors.includes(value)) return 'VWAP Anchor must be one of: ' + vwapAnchors.join(', ');
    if (field === 'vwapBandsMultiplier1' || field === 'vwapBandsMultiplier2' || field === 'vwapBandsMultiplier3') {
      const num = Number(value);
      if (isNaN(num) || num < 0.1 || num > 10) return `${field} must be between 0.1 and 10`;
    }
    if (field === 'bandsCalculationMode' && value && !bandsModes.includes(value)) return 'Bands Calculation Mode must be one of: ' + bandsModes.join(', ');
    if (field === 'patternType' && value && !patternTypes.includes(value)) return 'Pattern Type must be one of: ' + patternTypes.join(', ');
    if (field === 'trendRule' && value && !trendRules.includes(value)) return 'Trend Rule must be one of: ' + trendRules.join(', ');
    return null;
  };

  const cleanIndicatorSettings = (setting: IndicatorParameters): IndicatorParameters => {
    const { indicator, symbol, timeframe, symbolTimeframeIndicator, Source } = setting;
    const cleaned: IndicatorParameters = { symbol, timeframe, indicator };
    if (symbolTimeframeIndicator) cleaned.symbolTimeframeIndicator = symbolTimeframeIndicator;
    if (Source) cleaned.Source = Source;

    switch (indicator) {
      case 'EMA50':
      case 'EMA200':
        if (setting.period) cleaned.period = setting.period;
        if (setting.offset) cleaned.offset = setting.offset;
        if (setting.maType) cleaned.maType = setting.maType;
        break;
      case 'RSI':
        if (setting.rsiLength) cleaned.rsiLength = setting.rsiLength;
        if (setting.length) cleaned.length = setting.length;
        if (setting.bbStdDev) cleaned.bbStdDev = setting.bbStdDev;
        if (setting.maType) cleaned.maType = setting.maType;
        if (setting.offset) cleaned.offset = setting.offset;
        if (setting.calculateDivergence) cleaned.calculateDivergence = setting.calculateDivergence;
        if (setting.timeframeInput) cleaned.timeframeInput = setting.timeframeInput;
        if (setting.waitForTimeframeCloses) cleaned.waitForTimeframeCloses = setting.waitForTimeframeCloses;
        break;
      case 'MACD':
        if (setting.macdFastPeriod) cleaned.macdFastPeriod = setting.macdFastPeriod;
        if (setting.macdSlowPeriod) cleaned.macdSlowPeriod = setting.macdSlowPeriod;
        if (setting.macdSignalPeriod) cleaned.macdSignalPeriod = setting.macdSignalPeriod;
        if (setting.macdSourceMaType) cleaned.macdSourceMaType = setting.macdSourceMaType;
        if (setting.macdSignalMaType) cleaned.macdSignalMaType = setting.macdSignalMaType;
        if (setting.offset) cleaned.offset = setting.offset;
        if (setting.timeframeInput) cleaned.timeframeInput = setting.timeframeInput;
        if (setting.waitForTimeframeCloses) cleaned.waitForTimeframeCloses = setting.waitForTimeframeCloses;
        break;
      case 'FibonacciBollingerBands':
        if (setting.fibLookback) cleaned.fibLookback = setting.fibLookback;
        if (setting.multiply) cleaned.multiply = setting.multiply;
        break;
      case 'VWAP':
        if (setting.vwapAnchor) cleaned.vwapAnchor = setting.vwapAnchor;
        if (setting.vwapBandsMultiplier1) cleaned.vwapBandsMultiplier1 = setting.vwapBandsMultiplier1;
        if (setting.vwapBandsMultiplier2) cleaned.vwapBandsMultiplier2 = setting.vwapBandsMultiplier2;
        if (setting.vwapBandsMultiplier3) cleaned.vwapBandsMultiplier3 = setting.vwapBandsMultiplier3;
        if (setting.hideVwapOn1DOrAbove) cleaned.hideVwapOn1DOrAbove = setting.hideVwapOn1DOrAbove;
        if (setting.bandsCalculationMode) cleaned.bandsCalculationMode = setting.bandsCalculationMode;
        if (setting.band1) cleaned.band1 = setting.band1;
        if (setting.band2) cleaned.band2 = setting.band2;
        if (setting.band3) cleaned.band3 = setting.band3;
        if (setting.offset) cleaned.offset = setting.offset;
        if (setting.timeframeInput) cleaned.timeframeInput = setting.timeframeInput;
        if (setting.waitForTimeframeCloses) cleaned.waitForTimeframeCloses = setting.waitForTimeframeCloses;
        break;
      case 'BollingerBands':
        if (setting.length) cleaned.length = setting.length;
        if (setting.bbStdDev) cleaned.bbStdDev = setting.bbStdDev;
        if (setting.maType) cleaned.maType = setting.maType;
        if (setting.offset) cleaned.offset = setting.offset;
        if (setting.timeframeInput) cleaned.timeframeInput = setting.timeframeInput;
        if (setting.waitForTimeframeCloses) cleaned.waitForTimeframeCloses = setting.waitForTimeframeCloses;
        break;
      case 'CandlestickPatterns':
        if (setting.patternType) cleaned.patternType = setting.patternType;
        if (setting.trendRule) cleaned.trendRule = setting.trendRule;
        if (setting.patternSettings) cleaned.patternSettings = setting.patternSettings;
        if (setting.timeframeInput) cleaned.timeframeInput = setting.timeframeInput;
        if (setting.waitForTimeframeCloses) cleaned.waitForTimeframeCloses = setting.waitForTimeframeCloses;
        break;
      case 'Nadaraya-Watson-LuxAlgo':
        if (setting.Bandwidth) cleaned.Bandwidth = setting.Bandwidth;
        if (setting.mult) cleaned.mult = setting.mult;
        if (setting.Repainting_Smoothing) cleaned.Repainting_Smoothing = setting.Repainting_Smoothing;

        break;
      case 'SRv2':
        if (setting.Pivot_Period) cleaned.Pivot_Period = setting.Pivot_Period;
        if (setting.Maximum_Number_of_Pivot) cleaned.Maximum_Number_of_Pivot = setting.Maximum_Number_of_Pivot;
        if (setting.Maximum_Channel_Width_) cleaned.Maximum_Channel_Width_ = setting.Maximum_Channel_Width_;
        if (setting.Maximum_Number_of_SR) cleaned.Maximum_Number_of_SR = setting.Maximum_Number_of_SR;
        if (setting.Minimum_Strength) cleaned.Minimum_Strength = setting.Minimum_Strength;
        if (setting.Label_Location) cleaned.Label_Location = setting.Label_Location;
        if (setting.Line_Style) cleaned.Line_Style = setting.Line_Style;
        if (setting.Line_Width) cleaned.Line_Width = setting.Line_Width;
        if (setting.Resistance_Color) cleaned.Resistance_Color = setting.Resistance_Color;
        if (setting.Support_Color) cleaned.Support_Color = setting.Support_Color;
        if (setting.Show_Point_Points) cleaned.Show_Point_Points = setting.Show_Point_Points;
        break;
      case 'Pivot Points High Low':
        if (setting.Pivot_High) cleaned.Pivot_High = setting.Pivot_High;
        if (setting.Pivot_Low) cleaned.Pivot_Low = setting.Pivot_Low;
          if (setting.threshold) cleaned.threshold = setting.threshold; // Added threshold
        break;
      case 'Pivot Points Standard':
        if (setting.Type) cleaned.Type = setting.Type;
        if (setting.Pivots_Timeframe) cleaned.Pivots_Timeframe = setting.Pivots_Timeframe;
        if (setting.Number_of_Pivots_Back) cleaned.Number_of_Pivots_Back = setting.Number_of_Pivots_Back;
        if (setting.Use_Dailybased_Values) cleaned.Use_Dailybased_Values = setting.Use_Dailybased_Values;
        break;
    }
    return cleaned;
  };

  const fetchSettings = async () => {
    if (!displaySymbols.includes(symbol) || !timeframes.includes(timeframe)) {
      setError('Please select a valid symbol and timeframe.');
      return;
    }
    setLoading(true);
    try {
      const backendSymbol = symbolMap[symbol];
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/indicators/settings`, { params: { symbol: backendSymbol, timeframe } });
      
      const transformBackendData = (data: any[]): IndicatorParameters[] => {
        return data.map(item => {
          if (item.source !== undefined) {
            return {
              ...item,
              Source: item.source,
              source: undefined,
              symbol: reverseSymbolMap[item.symbol] || item.symbol
            };
          }
          return { ...item, symbol: reverseSymbolMap[item.symbol] || item.symbol };
        });
      };

      const combinedSettings = transformBackendData(Array.isArray(response.data) ? response.data : [])
        .map(cleanIndicatorSettings);
      
      if (combinedSettings.length === 0) {
        const defaultIndicatorSettings = indicators.map(indicator => ({
          ...defaultSettings[indicator],
          symbol,
          timeframe,
          symbolTimeframeIndicator: `${symbolMap[symbol]}:${timeframe}:${indicator}`
        }));
        setIndicatorSettings(defaultIndicatorSettings);
        setSuccess('Initialized default settings for all indicators');
      } else {
        setIndicatorSettings(combinedSettings);
        setSuccess('Settings fetched successfully');
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch settings: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error('Fetch settings failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIndicatorInputChange = (index: number, field: keyof IndicatorParameters, value: any) => {
    const indicator = indicatorSettings[index]?.indicator;
    const validationError = validateIndicatorInput(field, field === 'symbol' ? symbolMap[value] || value : value, indicator);
    if (validationError) {
      setError(validationError);
      setSuccess('');
      return;
    }
    setIndicatorSettings(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setError('');
  };

  const handlePatternInputChange = (index: number, pattern: string, checked: boolean) => {
    setIndicatorSettings(prev => {
      const updated = [...prev];
      const currentSettings = updated[index];
      updated[index] = {
        ...currentSettings,
        patternSettings: {
          ...currentSettings.patternSettings,
          [pattern]: checked
        }
      };
      return updated;
    });
    setError('');
  };

  const handleSave = async (index: number) => {
    if (!indicatorSettings.length || !indicatorSettings[index]) {
      setError('No settings to save for this indicator.');
      return;
    }
    setSaving(true);
    try {
      const setting = indicatorSettings[index];
      const cleanedSetting = cleanIndicatorSettings(setting);
      
      const transformForBackend = (setting: IndicatorParameters): any => {
        if (setting.Source !== undefined) {
          return {
            ...setting,
            source: setting.Source,
            Source: undefined,
            symbol: symbolMap[setting.symbol] || setting.symbol
          };
        }
        return { ...setting, symbol: symbolMap[setting.symbol] || setting.symbol };
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/indicators/settings`, transformForBackend(cleanedSetting));
      setSuccess(`Settings saved successfully for ${setting.indicator}`);
      setError('');
    } catch (err) {
      setError('Failed to save settings: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => setSuccess('');

  useEffect(() => {
    if (symbol && timeframe && displaySymbols.includes(symbol) && timeframes.includes(timeframe)) {
      fetchSettings();
    }
  }, [symbol, timeframe]);

  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          select
          SelectProps={{ native: true }}
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          sx={{ minWidth: 150 }}
          label="Select Symbol"
        >
          <option value="">Select Symbol</option>
          {displaySymbols.map((sym) => (
            <option key={sym} value={sym}>{sym}</option>
          ))}
        </TextField>
        <TextField
          size="small"
          select
          SelectProps={{ native: true }}
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          sx={{ minWidth: 150 }}
          label="Select Timeframe"
        >
          <option value="">Select Timeframe</option>
          {timeframes.map((tf) => (
            <option key={tf} value={tf}>{timeframeLabels[tf] || tf}</option>
          ))}
        </TextField>
        <Button
          variant="contained"
          color="primary"
          onClick={fetchSettings}
          disabled={loading || !symbol || !timeframe}
        >
          {loading ? <CircularProgress size={24} /> : 'Fetch'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={handleCloseSnackbar}>
          {success}
        </Alert>
      </Snackbar>

      {indicatorSettings.length === 0 && !loading && symbol && timeframe && !error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No settings found for {symbol} - {timeframe}. Default settings initialized for all indicators. Click Save to store them.
        </Alert>
      )}

      {indicatorSettings.map((setting, index) => {
        const key = `${symbolMap[setting.symbol] || setting.symbol}:${setting.timeframe}:${setting.indicator}`;
        return (
          <Card key={`indicator-${key}`} sx={{ mb: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardHeader
              title={`${setting.indicator}: ${reverseSymbolMap[setting.symbol] || setting.symbol} - ${timeframeLabels[setting.timeframe] || setting.timeframe}`}
              sx={{
                bgcolor: groupColors['Indicator Settings'],
                color: theme => theme.palette.getContrastText(groupColors['Indicator Settings']),
                '& .MuiCardHeader-title': { fontWeight: 'bold', fontSize: '1.25rem' }
              }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                  <TextField
                    fullWidth
                    label="Source"
                    size="small"
                    select
                    SelectProps={{ native: true }}
                    value={setting.Source || 'close'}
                    onChange={(e) => handleIndicatorInputChange(index, 'Source', e.target.value)}
                    InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                  >
                    {sources.map((source) => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </TextField>
                </Grid>

                {['EMA50', 'EMA200'].includes(setting.indicator) && (
                  <>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Period"
                        size="small"
                        type="number"
                        value={setting.period || (setting.indicator === 'EMA50' ? 50 : 200)}
                        onChange={(e) => handleIndicatorInputChange(index, 'period', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 200 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Offset"
                        size="small"
                        type="number"
                        value={setting.offset || 0}
                        onChange={(e) => handleIndicatorInputChange(index, 'offset', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: -100, max: 100 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="MA Type"
                        size="small"
                        select
                        SelectProps={{ native: true }}
                        value={setting.maType || 'EMA'}
                        onChange={(e) => handleIndicatorInputChange(index, 'maType', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      >
                        {maTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </TextField>
                    </Grid>
                  </>
                )}

                {setting.indicator === 'RSI' && (
                  <>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="RSI Length"
                        size="small"
                        type="number"
                        value={setting.rsiLength || 14}
                        onChange={(e) => handleIndicatorInputChange(index, 'rsiLength', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 200 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Length"
                        size="small"
                        type="number"
                        value={setting.length || 14}
                        onChange={(e) => handleIndicatorInputChange(index, 'length', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 200 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="StdDev"
                        size="small"
                        type="number"
                        value={setting.bbStdDev || 2}
                        onChange={(e) => handleIndicatorInputChange(index, 'bbStdDev', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ step: '0.1', min: 0.1, max: 5 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="MA Type"
                        size="small"
                        select
                        SelectProps={{ native: true }}
                        value={setting.maType || 'SMA'}
                        onChange={(e) => handleIndicatorInputChange(index, 'maType', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      >
                        {maTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Timeframe Input"
                        size="small"
                        value={setting.timeframeInput || ''}
                        onChange={(e) => handleIndicatorInputChange(index, 'timeframeInput', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!setting.calculateDivergence}
                            onChange={(e) => handleIndicatorInputChange(index, 'calculateDivergence', e.target.checked)}
                          />
                        }
                        label="Calculate Divergence"
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={setting.waitForTimeframeCloses ?? true}
                            onChange={(e) => handleIndicatorInputChange(index, 'waitForTimeframeCloses', e.target.checked)}
                          />
                        }
                        label="Wait for Timeframe Closes"
                      />
                    </Grid>
                  </>
                )}

                {setting.indicator === 'MACD' && (
                  <>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Fast Period"
                        size="small"
                        type="number"
                        value={setting.macdFastPeriod || 12}
                        onChange={(e) => handleIndicatorInputChange(index, 'macdFastPeriod', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 50 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Slow Period"
                        size="small"
                        type="number"
                        value={setting.macdSlowPeriod || 26}
                        onChange={(e) => handleIndicatorInputChange(index, 'macdSlowPeriod', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 100 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Signal Period"
                        size="small"
                        type="number"
                        value={setting.macdSignalPeriod || 9}
                        onChange={(e) => handleIndicatorInputChange(index, 'macdSignalPeriod', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 50 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Source MA Type"
                        size="small"
                        select
                        SelectProps={{ native: true }}
                        value={setting.macdSourceMaType || 'EMA'}
                        onChange={(e) => handleIndicatorInputChange(index, 'macdSourceMaType', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      >
                        <option value="SMA">SMA</option>
                        <option value="EMA">EMA</option>
                      </TextField>
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Signal MA Type"
                        size="small"
                        select
                        SelectProps={{ native: true }}
                        value={setting.macdSignalMaType || 'EMA'}
                        onChange={(e) => handleIndicatorInputChange(index, 'macdSignalMaType', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      >
                        <option value="SMA">SMA</option>
                        <option value="EMA">EMA</option>
                      </TextField>
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Timeframe Input"
                        size="small"
                        value={setting.timeframeInput || ''}
                        onChange={(e) => handleIndicatorInputChange(index, 'timeframeInput', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={setting.waitForTimeframeCloses ?? true}
                            onChange={(e) => handleIndicatorInputChange(index, 'waitForTimeframeCloses', e.target.checked)}
                          />
                        }
                        label="Wait for Timeframe Closes"
                      />
                    </Grid>
                  </>
                )}

                {setting.indicator === 'FibonacciBollingerBands' && (
                  <>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Fib Lookback"
                        size="small"
                        type="number"
                        value={setting.fibLookback || 200}
                        onChange={(e) => handleIndicatorInputChange(index, 'fibLookback', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 50, max: 500 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Multiplier"
                        size="small"
                        type="number"
                        value={setting.multiply || 3}
                        onChange={(e) => handleIndicatorInputChange(index, 'multiply', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ step: '0.1', min: 0.1, max: 10 }}
                      />
                    </Grid>
                  </>
                )}

                {setting.indicator === 'VWAP' && (
                  <>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="VWAP Anchor"
                        size="small"
                        select
                        SelectProps={{ native: true }}
                        value={setting.vwapAnchor || 'Session'}
                        onChange={(e) => handleIndicatorInputChange(index, 'vwapAnchor', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      >
                        {vwapAnchors.map((anchor) => (
                          <option key={anchor} value={anchor}>{anchor}</option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Bands Multiplier 1"
                        size="small"
                        type="number"
                        value={setting.vwapBandsMultiplier1 || 1}
                        onChange={(e) => handleIndicatorInputChange(index, 'vwapBandsMultiplier1', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ step: '0.1', min: 0.1, max: 10 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Bands Multiplier 2"
                        size="small"
                        type="number"
                        value={setting.vwapBandsMultiplier2 || 2}
                        onChange={(e) => handleIndicatorInputChange(index, 'vwapBandsMultiplier2', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ step: '0.1', min: 0.1, max: 10 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Bands Multiplier 3"
                        size="small"
                        type="number"
                        value={setting.vwapBandsMultiplier3 || 3}
                        onChange={(e) => handleIndicatorInputChange(index, 'vwapBandsMultiplier3', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ step: '0.1', min: 0.1, max: 10 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!setting.hideVwapOn1DOrAbove}
                            onChange={(e) => handleIndicatorInputChange(index, 'hideVwapOn1DOrAbove', e.target.checked)}
                          />
                        }
                        label="Hide VWAP on 1D or Above"
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Bands Calculation Mode"
                        size="small"
                        select
                        SelectProps={{ native: true }}
                        value={setting.bandsCalculationMode || 'Standard Deviation'}
                        onChange={(e) => handleIndicatorInputChange(index, 'bandsCalculationMode', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      >
                        {bandsModes.map((mode) => (
                          <option key={mode} value={mode}>{mode}</option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!setting.band1}
                            onChange={(e) => handleIndicatorInputChange(index, 'band1', e.target.checked)}
                          />
                        }
                        label="Band 1"
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!setting.band2}
                            onChange={(e) => handleIndicatorInputChange(index, 'band2', e.target.checked)}
                          />
                        }
                        label="Band 2"
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!setting.band3}
                            onChange={(e) => handleIndicatorInputChange(index, 'band3', e.target.checked)}
                          />
                        }
                        label="Band 3"
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Timeframe Input"
                        size="small"
                        value={setting.timeframeInput || ''}
                        onChange={(e) => handleIndicatorInputChange(index, 'timeframeInput', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={setting.waitForTimeframeCloses ?? true}
                            onChange={(e) => handleIndicatorInputChange(index, 'waitForTimeframeCloses', e.target.checked)}
                          />
                        }
                        label="Wait for Timeframe Closes"
                      />
                    </Grid>
                  </>
                )}

                {setting.indicator === 'BollingerBands' && (
                  <>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Length"
                        size="small"
                        type="number"
                        value={setting.length || 20}
                        onChange={(e) => handleIndicatorInputChange(index, 'length', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 200 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="StdDev"
                        size="small"
                        type="number"
                        value={setting.bbStdDev || 2}
                        onChange={(e) => handleIndicatorInputChange(index, 'bbStdDev', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ step: '0.1', min: 0.1, max: 5 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="MA Type"
                        size="small"
                        select
                        SelectProps={{ native: true }}
                        value={setting.maType || 'SMA'}
                        onChange={(e) => handleIndicatorInputChange(index, 'maType', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      >
                        {maTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Offset"
                        size="small"
                        type="number"
                        value={setting.offset || 0}
                        onChange={(e) => handleIndicatorInputChange(index, 'offset', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: -100, max: 100 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Timeframe Input"
                        size="small"
                        value={setting.timeframeInput || ''}
                        onChange={(e) => handleIndicatorInputChange(index, 'timeframeInput', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={setting.waitForTimeframeCloses ?? true}
                            onChange={(e) => handleIndicatorInputChange(index, 'waitForTimeframeCloses', e.target.checked)}
                          />
                        }
                        label="Wait for Timeframe Closes"
                      />
                    </Grid>
                  </>
                )}

                {setting.indicator === 'CandlestickPatterns' && (
                  <>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Pattern Type"
                        size="small"
                        select
                        SelectProps={{ native: true }}
                        value={setting.patternType || 'Both'}
                        onChange={(e) => handleIndicatorInputChange(index, 'patternType', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      >
                        {patternTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Trend Rule"
                        size="small"
                        select
                        SelectProps={{ native: true }}
                        value={setting.trendRule || 'No detection'}
                        onChange={(e) => handleIndicatorInputChange(index, 'trendRule', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      >
                        {trendRules.map((rule) => (
                          <option key={rule} value={rule}>{rule}</option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Timeframe Input"
                        size="small"
                        value={setting.timeframeInput || ''}
                        onChange={(e) => handleIndicatorInputChange(index, 'timeframeInput', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={setting.waitForTimeframeCloses ?? true}
                            onChange={(e) => handleIndicatorInputChange(index, 'waitForTimeframeCloses', e.target.checked)}
                          />
                        }
                        label="Wait for Timeframe Closes"
                      />
                    </Grid>
                    <Grid component="div" item xs={12} {...({} as any)}>
                      <Typography variant="subtitle1" fontWeight="bold">Candlestick Patterns:</Typography>
                      <Grid container spacing={2}>
                        {candlestickPatterns.map((pattern) => (
                          <Grid component="div" item xs={12} sm={3} key={pattern} {...({} as any)}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={setting.patternSettings?.[pattern] ?? true}
                                  onChange={(e) => handlePatternInputChange(index, pattern, e.target.checked)}
                                />
                              }
                              label={pattern}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  </>
                )}

                {setting.indicator === 'Nadaraya-Watson-LuxAlgo' && (
                  <>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Bandwidth"
                        size="small"
                        type="number"
                        value={setting.Bandwidth || 1}
                        onChange={(e) => handleIndicatorInputChange(index, 'Bandwidth', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ step: '0.1', min: 0.1, max: 20 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Multiplier"
                        size="small"
                        type="number"
                        value={setting.mult || 3}
                        onChange={(e) => handleIndicatorInputChange(index, 'mult', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ step: '0.1', min: 0.1, max: 10 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!setting.Repainting_Smoothing}
                            onChange={(e) => handleIndicatorInputChange(index, 'Repainting_Smoothing', e.target.checked)}
                          />
                        }
                        label="Repainting Smoothing"
                      />
                    </Grid>
                  </>
                )}

                {setting.indicator === 'SRv2' && (
                  <>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Pivot Period"
                        size="small"
                        type="number"
                        value={setting.Pivot_Period || 7}
                        onChange={(e) => handleIndicatorInputChange(index, 'Pivot_Period', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 100 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Max Number of Pivots"
                        size="small"
                        type="number"
                        value={setting.Maximum_Number_of_Pivot || 50}
                        onChange={(e) => handleIndicatorInputChange(index, 'Maximum_Number_of_Pivot', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 100 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Channel Width"
                        size="small"
                        type="number"
                        value={setting.Maximum_Channel_Width_ || 4}
                        onChange={(e) => handleIndicatorInputChange(index, 'Maximum_Channel_Width_', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 50 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Max Number of SR"
                        size="small"
                        type="number"
                        value={setting.Maximum_Number_of_SR || 10}
                        onChange={(e) => handleIndicatorInputChange(index, 'Maximum_Number_of_SR', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 50 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Min Strength"
                        size="small"
                        type="number"
                        value={setting.Minimum_Strength || 2}
                        onChange={(e) => handleIndicatorInputChange(index, 'Minimum_Strength', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 20 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Label Location"
                        size="small"
                        type="number"
                        value={setting.Label_Location || 0}
                        onChange={(e) => handleIndicatorInputChange(index, 'Label_Location', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 0, max: 100 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Line Style"
                        size="small"
                        select
                        SelectProps={{ native: true }}
                        value={setting.Line_Style || 'Solid'}
                        onChange={(e) => handleIndicatorInputChange(index, 'Line_Style', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      >
                        {lineStyles.map((style) => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Line Width"
                        size="small"
                        type="number"
                        value={setting.Line_Width || 1}
                        onChange={(e) => handleIndicatorInputChange(index, 'Line_Width', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 10 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Resistance Color"
                        size="small"
                        value={setting.Resistance_Color || '#FF0000'}
                        onChange={(e) => handleIndicatorInputChange(index, 'Resistance_Color', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Support Color"
                        size="small"
                        value={setting.Support_Color || '#00FF00'}
                        onChange={(e) => handleIndicatorInputChange(index, 'Support_Color', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!setting.Show_Point_Points}
                            onChange={(e) => handleIndicatorInputChange(index, 'Show_Point_Points', e.target.checked)}
                          />
                        }
                        label="Show Point Points"
                      />
                    </Grid>
                  </>
                )}

                {setting.indicator === 'Pivot Points High Low' && (
                  <>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Pivot High"
                        size="small"
                        type="number"
                        value={setting.Pivot_High || 8}
                        onChange={(e) => handleIndicatorInputChange(index, 'Pivot_High', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 100 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Pivot Low"
                        size="small"
                        type="number"
                        value={setting.Pivot_Low || 10}
                        onChange={(e) => handleIndicatorInputChange(index, 'Pivot_Low', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 100 }}
                      />
                    </Grid>
                <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Threshold"
                        size="small"
                        type="number"
                        value={setting.threshold ?? 2.0}
                        onChange={(e) => handleIndicatorInputChange(index, 'threshold', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ step: '0.1', min: 0, max: 50 }}
                      />
                    </Grid>


                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                <TextField
                  fullWidth
                  label="Session ID"
                  size="small"
                  type="text"
                  value={setting.session ?? ''}
                  onChange={(e) => handleIndicatorInputChange(index, 'session', e.target.value)}
                  InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                />
              </Grid>
              <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                <TextField
                  fullWidth
                  label="Signature"
                  size="small"
                  type="text"
                  value={setting.signature ?? ''}
                  onChange={(e) => handleIndicatorInputChange(index, 'signature', e.target.value)}
                  InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                />
              </Grid>
                  </>
                )}

                {setting.indicator === 'Pivot Points Standard' && (
                  <>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Type"
                        size="small"
                        select
                        SelectProps={{ native: true }}
                        value={setting.Type || 'Traditional'}
                        onChange={(e) => handleIndicatorInputChange(index, 'Type', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      >
                        {pivotTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Pivots Timeframe"
                        size="small"
                        select
                        SelectProps={{ native: true }}
                        value={setting.Pivots_Timeframe || 'Auto'}
                        onChange={(e) => handleIndicatorInputChange(index, 'Pivots_Timeframe', e.target.value)}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      >
                        {pivotTimeframes.map((tf) => (
                          <option key={tf} value={tf}>{tf}</option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Number of Pivots Back"
                        size="small"
                        type="number"
                        value={setting.Number_of_Pivots_Back || 5}
                        onChange={(e) => handleIndicatorInputChange(index, 'Number_of_Pivots_Back', Number(e.target.value))}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ min: 1, max: 50 }}
                      />
                    </Grid>
                    <Grid component="div" item xs={12} sm={4} {...({} as any)}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!setting.Use_Dailybased_Values}
                            onChange={(e) => handleIndicatorInputChange(index, 'Use_Dailybased_Values', e.target.checked)}
                          />
                        }
                        label="Use Daily-based Values"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleSave(index)}
                disabled={saving || !indicatorSettings.length}
                sx={{ minWidth: 150 }}
              >
                {saving ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            </Box>
          </Card>
        );
      })}
    </>
  );
};

export default IndicatorSettings;
