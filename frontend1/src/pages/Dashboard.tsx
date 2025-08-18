

import { useEffect, useState, type JSX } from 'react';
import { io, Socket } from 'socket.io-client';
import { Container, Typography, Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody, Box } from '@mui/material';
import Header from '../components/Header';
import axios from 'axios';

type IndicatorData = {
  [symbol: string]: {
    [timeframe: string]: {
      symbol: string;
      timeframe: string;
      indicators?: { [key: string]: any };
      [key: string]: any;
    };
  };
};

type Symbol = {
  _id: string;
  symbol: string;
  entryPrice: number;
  side: 'long' | 'short';
};

const Dashboard: React.FC = () => {
  const [indicators, setIndicators] = useState<IndicatorData>({});
  const [, setRawData] = useState<IndicatorData>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string>('VANTAGE:XAUUSD');
  const [symbolTimeframes, setSymbolTimeframes] = useState<{ [symbol: string]: string[] }>({});
  const [buySymbols, setBuySymbols] = useState<Symbol[]>([]);
  const [sellSymbols, setSellSymbols] = useState<Symbol[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [marketData, setMarketData] = useState<{ [symbol: string]: { marketPrice: number; volume: number } }>({});
  const [viewMode, setViewMode] = useState<'standard' | 'pivot'>('standard');
  const [showBuySell, setShowBuySell] = useState<boolean>(false);

  const symbols = [
    { full: 'VANTAGE:XAUUSD', display: 'XAUUSD' },
    { full: 'VANTAGE:GER40', display: 'GER40' },
    { full: 'VANTAGE:NAS100', display: 'NAS100' },
    { full: 'VANTAGE:BTCUSD', display: 'BTCUSD' },
    { full: 'VANTAGE:XRPUSD', display: 'XRPUSD' },
    { full: 'BINANCE:SUIUSDT', display: 'SUIUSDT' },
  ];

  const timeframeLabels: { [key: string]: string } = {
    '15': '15m',
    '60': '1h',
    '240': '4h',
    '1D': '1D',
    '1W': '1W',
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      symbols.forEach(({ full }) => newSocket.emit('select-symbol', { symbol: full }));
    });

    newSocket.on('live-data-all', (data: any) => {
      if (data.symbols && Array.isArray(data.symbols)) {
        const buy = data.symbols.filter((s: Symbol) => s.side === 'long');
        const sell = data.symbols.filter((s: Symbol) => s.side === 'short');
        setBuySymbols(buy);
        setSellSymbols(sell);
      } else {
        if (data.marketPrice || data.volume) {
          setMarketData((prev) => ({
            ...prev,
            [data.symbol]: {
              marketPrice: data.marketPrice || prev[data.symbol]?.marketPrice || 0,
              volume: data.volume || prev[data.symbol]?.volume || 0,
            },
          }));
        }
        setRawData((prev) => {
          const newData = structuredClone(prev);
          newData[data.symbol] = {
            ...(newData[data.symbol] || {}),
            [data.timeframe]: data,
          };
          return newData;
        });
        setIndicators((prev) => {
          const newIndicators = structuredClone(prev);
          const symbolData = newIndicators[data.symbol] || {};
          const timeframeData = symbolData[data.timeframe] || { symbol: data.symbol, timeframe: data.timeframe, indicators: {} };
          
          const mergedIndicators = {
            ...timeframeData.indicators,
            ...data.indicators,
            ...(data.EMA50 && { EMA50: data.EMA50 }),
            ...(data.EMA200 && { EMA200: data.EMA200 }),
            ...(data.RSI && { RSI: data.RSI }),
            ...(data.MACD && { MACD: data.MACD }),
            ...(data.FibonacciBollingerBands && { FibonacciBollingerBands: data.FibonacciBollingerBands }),
            ...(data.VWAP && { VWAP: data.VWAP }),
            ...(data.BollingerBands && { BollingerBands: data.BollingerBands }),
            ...(data.CandlestickPatterns && { CandlestickPatterns: data.CandlestickPatterns }),
            ...(data['Nadaraya-Watson-LuxAlgo'] && { 'Nadaraya-Watson-LuxAlgo': data['Nadaraya-Watson-LuxAlgo'] }),
            ...(data.SRv2 && { SRv2: data.SRv2 }),
            ...(data['Pivot Points High Low'] && { 'Pivot Points High Low': data['Pivot Points High Low'] }),
            ...(data['Pivot Points Standard'] && { 'Pivot Points Standard': data['Pivot Points Standard'] }),
          };

          newIndicators[data.symbol] = {
            ...symbolData,
            [data.timeframe]: {
              ...timeframeData,
              indicators: mergedIndicators,
            },
          };

          setSymbolTimeframes((prev) => {
            if (!data.timeframe || !Object.keys(timeframeLabels).includes(data.timeframe)) {
              return prev;
            }
            const newTimeframes = [...new Set([...(prev[data.symbol] || []), data.timeframe])].sort((a, b) => {
              const order = ['15', '60', '240', '1D', '1W'];
              return order.indexOf(a) - order.indexOf(b);
            });
            return {
              ...prev,
              [data.symbol]: newTimeframes.filter((tf) => {
                const indicatorsObj = newIndicators[data.symbol]?.[tf]?.indicators;
                return indicatorsObj && Object.keys(indicatorsObj).some((key) =>
                  indicatorsObj[key] !== undefined &&
                  indicatorsObj[key] !== null &&
                  indicatorsObj[key] !== 1e100
                );
              }),
            };
          });

          return newIndicators;
        });
      }
    });

    newSocket.on('disconnect', () => {});

    newSocket.on('connect_error', (error) => {
      console.error(`[${new Date().toISOString()}] WebSocket connection error: ${error.message}`);
    });

    setSocket(newSocket);

    const fetchSymbols = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/symbols`);
        if (response.data.success && Array.isArray(response.data.symbols)) {
          setBuySymbols(response.data.symbols.filter((s: Symbol) => s.side === 'long'));
          setSellSymbols(response.data.symbols.filter((s: Symbol) => s.side === 'short'));
        } else {
          setBuySymbols([]);
          setSellSymbols([]);
        }
      } catch (error) {
        setBuySymbols([]);
        setSellSymbols([]);
      }
    };
    fetchSymbols();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && selectedSymbol) {
      socket.emit('select-symbol', { symbol: selectedSymbol });
    }
  }, [selectedSymbol, socket]);

  const formatValue = (val: any, indicatorKey: string, subKey?: string): JSX.Element | string => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') {
      if (val > 1e10 || val === 1e100) return '-';
      return val.toFixed(5);
    }
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      if (val[0] && typeof val[0] === 'object') {
        return (
          <Box>
            {val.map((item: any, index: number) => (
              <Box key={index}>
                {Object.entries(item).map(([key, value]) => (
                  value !== 1e100 && (
                    <Box key={key} sx={{ fontWeight: 'bold', fontSize: '0.4rem', lineHeight: 1 }}>
                      {`${key}: ${formatValue(value, indicatorKey, subKey)}`}
                    </Box>
                  )
                ))}
              </Box>
            ))}
          </Box>
        );
      }
      return val[val.length - 1]?.toFixed(2) || '';
    }
    if (typeof val === 'object') {
      if (subKey && (indicatorKey.includes('SRv2') || indicatorKey.includes('Pivot Points') || indicatorKey === 'Nadaraya-Watson-LuxAlgo')) {
        let currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
        if (subKey === 'CurrentPrice') {
          if (indicatorKey.endsWith('Resistance') || indicatorKey === 'Pivot Points High Low') {
            return `Cu. Price=${currentPrice.toFixed(5)}`;
          } else {
            return '-';
          }
        }
        if (indicatorKey === 'Nadaraya-Watson-LuxAlgo') {
          const lines = val.lines || [];
          const sortedLines = [...lines].sort((a, b) => (typeof b.y2 === 'number' && typeof a.y2 === 'number' ? b.y2 - a.y2 : 0));
          const isLower = subKey === 'LowerBand';
          const line = isLower ? sortedLines[1] : sortedLines[0];
          return line && typeof line.y2 === 'number' ? `${subKey} y=${line.y2.toFixed(2)}` : '-';
        }
        if (indicatorKey === 'Pivot Points High Low') {
          const pivotPoints = val.processedPivotPoints || [];
          currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          const levelsAbove = pivotPoints
            .filter((point: any) => parseFloat(point.value) >= currentPrice)
            .sort((a: any, b: any) => b.value - a.value);
          const levelsBelow = pivotPoints
            .filter((point: any) => parseFloat(point.value) < currentPrice)
            .sort((a: any, b: any) => b.value - a.value);
          if (subKey.startsWith('Res')) {
            const index = parseInt(subKey.replace('Res', '')) - 1;
            const item = levelsAbove[index];
            return item ? `${item.value} (Count: ${item.count}, Diff: ${item.difference})` : '-';
          } else if (subKey.startsWith('Sup')) {
            const index = parseInt(subKey.replace('Sup', '')) - 1;
            const item = levelsBelow[index];
            return item ? `${item.value} (Count: ${item.count}, Diff: ${item.difference})` : '-';
          }
          return '-';
        } else if (indicatorKey.includes('SRv2')) {
          const labels = val?.labels || [];
          currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          const isSupport = indicatorKey === 'SRv2 Support';
          const allLevels = labels
            .filter((label: any) => label && typeof label.y === 'number')
            .map((label: any) => ({
              id: label.id || `label-${Math.random()}`,
              text: label.text || (label.y <= currentPrice ? 'Support' : 'Resistance'),
              y: label.y,
              isSupport: label.text?.toLowerCase().includes('support') || label.y <= currentPrice,
            }));
          let filteredLevels = isSupport 
            ? allLevels.filter((label: any) => label.isSupport && label.y <= currentPrice).sort((a: any, b: any) => b.y - a.y)
            : allLevels.filter((label: any) => !label.isSupport && label.y > currentPrice).sort((a: any, b: any) => a.y - b.y);
          const index = parseInt(subKey.replace('Level', '')) - 1;
          const item = filteredLevels[index];
          return item ? item.text : '-';
        } else if (indicatorKey === 'Pivot Points Standard Resistance' || indicatorKey === 'Pivot Points Standard Support') {
          const labels = val.labels || [];
          currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          const allLevels = labels.map((label: any) => {
            const y = parseFloat(label.text.match(/\((\d+\.?\d*)\)/)?.[1] || '0');
            return {
              text: label.text,
              y,
            };
          });
          const matching = allLevels.find((item: any) => item.text.startsWith(`${subKey} (`));
          if (!matching) return '-';
          const isResistance = indicatorKey === 'Pivot Points Standard Resistance';
          const condition = isResistance ? matching.y > currentPrice : matching.y <= currentPrice;
          return condition ? matching.text : '-';
        } else if (indicatorKey.includes('Pivot Points Standard')) {
          const labels = val.labels || [];
          currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          const allLevels = labels.map((label: any) => {
            const y = parseFloat(label.text.match(/\((\d+\.?\d*)\)/)?.[1] || '0');
            return {
              text: label.text,
              y,
            };
          });
          const matching = allLevels.find((item: any) => item.text.startsWith(`${subKey} (`));
          return matching ? matching.text : '-';
        }
        return '-';
      }
      if (indicatorKey === 'CandlestickPatterns') {
        const activePatterns = Object.entries(val)
          .filter(([key, value]) => value === 1 && key !== '$time')
          .map(([key]) => key);
        return activePatterns.length > 0 ? (
          <Box sx={{ fontWeight: 'normal', color: '#e0f808ff', fontSize: '0.4rem', lineHeight: 1 }}>{activePatterns.join(', ')}</Box>
        ) : (
          'None'
        );
      }
      if (indicatorKey === 'Nadaraya-Watson-LuxAlgo') {
        const lines = val.lines || [];
        const sortedLines = [...lines].sort((a, b) => (typeof b.y2 === 'number' && typeof a.y2 === 'number' ? b.y2 - a.y2 : 0));
        return (
          <Box>
            {sortedLines.map((line: any, index: number) => {
              const isLowerBand = index === 1;
              return (
                <Box key={index}>
                  <Box
                    sx={{
                      fontWeight: 'bold',
                      color: isLowerBand ? '#ff0000' : '#36f236ff',
                      fontSize: '0.4rem',
                      lineHeight: 1
                    }}
                  >
                    {isLowerBand ? 'LowerBand' : 'UpperBand'} y={(typeof line.y2 === 'number' ? line.y2.toFixed(2) : '-')}
                  </Box>
                  {index === 0 && <Box sx={{ my: 0.2, borderBottom: '1px solid #ccccccff', width: '60%', mx: 'auto' }} />}
                </Box>
              );
            })}
          </Box>
        );
      }
      if (indicatorKey === 'Pivot Points High Low') {
        const pivotPoints = val.processedPivotPoints || [];
        const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
        const displayItems = currentPrice > 0
          ? [
              ...pivotPoints.filter((point: any) => parseFloat(point.value) >= currentPrice),
              { id: 'current-price', value: `Cu. Price=${currentPrice.toFixed(5)}`, count: 0, difference: "-", isCurrentPrice: true, y: currentPrice },
              ...pivotPoints.filter((point: any) => parseFloat(point.value) < currentPrice),
            ]
          : pivotPoints;
        return (
          <Box>
            {displayItems.map((item: any, index: number) => (
              <Box
                key={item.id || index}
                sx={{
                  fontWeight: 'bold',
                  color: item.isCurrentPrice ? '#11b3d8ff' : parseFloat(item.value) >= currentPrice ? '#ff0000' : '#008000',
                  mt: index > 0 && pivotPoints.length > 0 && parseFloat(item.value) < currentPrice && parseFloat(displayItems[index - 1].value) >= currentPrice ? 0.2 : 0,
                  fontSize: '0.4rem',
                  lineHeight: 1
                }}
              >
                {item.value}
                {!item.isCurrentPrice && (
                  <Box sx={{ fontWeight: 'normal', color: '#ffffff', fontSize: '0.35rem', lineHeight: 1 }}>
                    Count: {item.count}, Diff: {item.difference}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        );
      }
      if (indicatorKey === 'SRv2 Support' || indicatorKey === 'SRv2 Resistance') {
        const labels = val?.labels || [];
        const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
        const isSupport = indicatorKey === 'SRv2 Support';
        const allLevels = labels
          .filter((label: any) => label && typeof label.y === 'number')
          .map((label: any) => ({
            id: label.id || `label-${Math.random()}`,
            text: label.text || (label.y <= currentPrice ? 'Support' : 'Resistance'),
            y: label.y,
            isSupport: label.text?.toLowerCase().includes('support') || label.y <= currentPrice,
          }));
        const supportLevels = allLevels.filter((label: any) => label.isSupport && label.y <= currentPrice);
        const resistanceLevels = allLevels.filter((label: any) => !label.isSupport && label.y > currentPrice);
        const maxSupport = supportLevels.length > 0 ? Math.max(...supportLevels.map((l: any) => l.y)) : -Infinity;
        const minResistance = resistanceLevels.length > 0 ? Math.min(...resistanceLevels.map((l: any) => l.y)) : Infinity;
        const showCurrentPrice = currentPrice > 0 && !isSupport && currentPrice > maxSupport && currentPrice <= minResistance;
        const filteredLevels = isSupport ? supportLevels : resistanceLevels;
        const displayItems = showCurrentPrice
          ? [
              ...filteredLevels.filter((level: any) => level.y > currentPrice),
              { id: 'current-price', text: `Cu. Price=${currentPrice.toFixed(5)}`, y: currentPrice, isCurrentPrice: true },
              ...filteredLevels.filter((level: any) => level.y <= currentPrice),
            ]
          : filteredLevels;
        return (
          <Box>
            {displayItems.length > 0 ? (
              displayItems
                .sort((a: any, b: any) => b.y - a.y)
                .map((item: any, index: number) => (
                  <Box
                    key={item.id}
                    sx={{
                      fontWeight: 'bold',
                      color: item.isCurrentPrice ? '#11b3d8ff' : isSupport ? '#33ef33ff' : '#ff0000',
                      mt: index > 0 && filteredLevels.length > 0 && item.y < currentPrice && filteredLevels[index - 1]?.y >= currentPrice ? 0.2 : 0,
                      fontSize: '0.4rem',
                      lineHeight: 1
                    }}
                  >
                    {item.text}
                  </Box>
                ))
            ) : (
              <Box sx={{ fontSize: '0.4rem', lineHeight: 1 }}>No {isSupport ? 'support' : 'resistance'} levels available</Box>
            )}
          </Box>
        );
      }
      if (indicatorKey === 'Pivot Points Standard') {
        const labels = val.labels || [];
        const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
        const allLevels = labels.map((label: any) => {
          const y = parseFloat(label.text.match(/\((\d+\.?\d*)\)/)?.[1] || '0');
          return {
            text: label.text,
            y,
          };
        });
        const showCurrentPrice = currentPrice > 0;
        let displayItems: any[] = [
            ...allLevels.map((level: any) => ({
              ...level,
              type: level.y > currentPrice ? 'Resistance' : level.y < currentPrice ? 'Support' : 'Pivot',
            })),
            ...(showCurrentPrice ? [{ id: 'current-price', text: `Cu. Price=${currentPrice.toFixed(5)}`, y: currentPrice, isCurrentPrice: true, type: 'CurrentPrice' }] : []),
          ].sort((a: any, b: any) => b.y - a.y);
        return (
          <Box>
            {displayItems.length > 0 ? (
              displayItems.map((item: any, index: number) => (
                <Box
                  key={item.id || item.text}
                  sx={{
                    fontWeight: 'bold',
                    color: item.isCurrentPrice ? '#11b3d8ff' : item.type === 'Support' ? '#33ef33ff' : item.type === 'Pivot' ? '#ffd700' : '#ff0000',
                    mt: index > 0 && displayItems.length > 0 && item.y < currentPrice && displayItems[index - 1]?.y >= currentPrice ? 0.2 : 0,
                    fontSize: '0.4rem',
                    lineHeight: 1
                  }}
                >
                  {item.text}
                </Box>
              ))
            ) : (
              <Box sx={{ fontSize: '0.4rem', lineHeight: 1 }}>No levels available</Box>
            )}
          </Box>
        );
      }
      const relevantFields: Record<string, string[]> = {
        EMA50: ['EMA'],
        EMA200: ['EMA'],
        RSI: ['RSI', 'RSIbased_MA'],
        MACD: ['Histogram', 'MACD', 'Signal'],
        FibonacciBollingerBands: [
          '1_2', '0764_2', '0618_2', '05', '0382', '0236',
          'Plot', '0236_2', '0382_2', '05_2', '0618', '0764', '1',
        ],
        VWAP: [
          'Upper_Band_3', 'Upper_Band_2', 'Upper_Band_1', 'VWAP',
          'Lower_Band_1', 'Lower_Band_2', 'Lower_Band_3',
        ],
        BollingerBands: ['Upper', 'Basis', 'Lower'],
      };
      const fields = relevantFields[indicatorKey] || Object.keys(val);
      return (
        <Box>
          {fields.map((key) =>
            val[key] !== undefined && val[key] !== 1e100 ? (
              <Box
                key={key}
                sx={{
                  fontWeight: 'bold',
                  color:
                    indicatorKey === 'EMA50' ? '#1e90ff' :
                    indicatorKey === 'EMA200' ? '#ffd700' :
                    indicatorKey === 'RSI' ? '#ec10fbff' :
                    indicatorKey === 'MACD' && key === 'Histogram' ? '#93ed93ff' :
                    indicatorKey === 'MACD' && key === 'MACD' ? '#1e90ff' :
                    indicatorKey === 'MACD' && key === 'Signal' ? '#ff8c00' :
                    indicatorKey === 'FibonacciBollingerBands' && key === '1_2' ? '#ff0000' :
                    indicatorKey === 'FibonacciBollingerBands' && key === 'Plot' ? '#f6a4fbff' :
                    indicatorKey === 'FibonacciBollingerBands' && key === '1' ? '#a1e9a1ff' :
                    indicatorKey === 'VWAP' && key === 'VWAP' ? '#9b62f0ff' :
                    indicatorKey === 'VWAP' && key === 'Upper_Band_1' ? '#ff0000' :
                    indicatorKey === 'VWAP' && key === 'Lower_Band_1' ? '#70eb70ff' :
                    indicatorKey === 'VWAP' && key === 'Upper_Band_2' ? '#ff0000' :
                    indicatorKey === 'VWAP' && key === 'Lower_Band_2' ? '#70eb70ff' :
                    indicatorKey === 'VWAP' && key === 'Upper_Band_3' ? '#ff0000' :
                    indicatorKey === 'VWAP' && key === 'Lower_Band_3' ? '#70eb70ff' :
                    indicatorKey === 'BollingerBands' && key === 'Basis' ? '#ef2a83ff' :
                    indicatorKey === 'BollingerBands' && key === 'Upper' ? '#ff0000' :
                    indicatorKey === 'BollingerBands' && key === 'Lower' ? '#83e683ff' :
                    '#11b3d8ff',
                  fontSize: '0.4rem',
                  lineHeight: 1
                }}
              >
                {`${key}: ${formatValue(val[key], indicatorKey, subKey)}`}
              </Box>
            ) : null
          )}
        </Box>
      );
    }
    return String(val);
  };

  type IndicatorDefinition = {
    name: string;
    key: string;
    format: (val: any, key: string) => JSX.Element | string;
    color?: string | Record<string, string>;
    subKeys?: string[];
  };

  let maxResLevels = 0;
  let maxSupLevels = 0;
  if (indicators[selectedSymbol]) {
    (symbolTimeframes[selectedSymbol] || []).forEach((timeframe) => {
      const timeframeData = indicators[selectedSymbol]?.[timeframe];
      if (timeframeData) {
        const pivotData = timeframeData.indicators?.['Pivot Points High Low'] || timeframeData['Pivot Points High Low'];
        if (pivotData?.processedPivotPoints) {
          const pivotPoints = pivotData.processedPivotPoints;
          const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          const levelsAbove = pivotPoints
            .filter((point: any) => parseFloat(point.value) >= currentPrice)
            .sort((a: any, b: any) => b.value - a.value);
          const levelsBelow = pivotPoints
            .filter((point: any) => parseFloat(point.value) < currentPrice)
            .sort((a: any, b: any) => b.value - a.value);
          maxResLevels = Math.max(maxResLevels, levelsAbove.length);
          maxSupLevels = Math.max(maxSupLevels, levelsBelow.length);
        }
      }
    });
  }

  const indicatorDefinitions: IndicatorDefinition[] = [
    { name: 'EMA50', key: 'EMA50', format: formatValue, color: '#1e90ff', subKeys: ['EMA'] },
    { name: 'EMA200', key: 'EMA200', format: formatValue, color: '#ffd700', subKeys: ['EMA'] },
    { name: 'RSI', key: 'RSI', format: formatValue, color: '#f535f5ff', subKeys: ['RSI', 'RSIbased_MA'] },
    {
      name: 'MACD',
      key: 'MACD',
      format: formatValue,
      color: { Histogram: '#c6f258ff', MACD: '#1e90ff', Signal: '#ff8c00' },
      subKeys: ['Histogram', 'MACD', 'Signal'],
    },
    {
      name: 'Fibonacci Bollinger Bands',
      key: 'FibonacciBollingerBands',
      format: formatValue,
      color: { '1': '#43e8eeff', Plot: '#ff00ff', '1_2': '#a2eea2ff' },
      subKeys: [
        '1_2', '0764_2', '0618_2', '05', '0382', '0236',
        'Plot', '0236_2', '0382_2', '05_2', '0618', '0764', '1',
      ],
    },
    {
      name: 'VWAP',
      key: 'VWAP',
      format: formatValue,
      color: {
        VWAP: '#9b62f0ff',
        Upper_Band_1: '#ff0000',
        Upper_Band_2: '#ff0000',
        Upper_Band_3: '#ff0000',
        Lower_Band_1: '#70eb70ff',
        Lower_Band_2: '#70eb70ff',
        Lower_Band_3: '#70eb70ff',
      },
      subKeys: [
        'Upper_Band_3', 'Upper_Band_2', 'Upper_Band_1', 'VWAP',
        'Lower_Band_1', 'Lower_Band_2', 'Lower_Band_3',
      ],
    },
    {
      name: 'Bollinger Bands',
      key: 'BollingerBands',
      format: formatValue,
      color: { Basis: '#f471acff', Upper: '#ff0000', Lower: '#84ef84ff' },
      subKeys: ['Upper', 'Basis', 'Lower'],
    },
    { name: 'Candlestick Patterns', key: 'CandlestickPatterns', format: formatValue, color: '#eaf207ff' },
    {
      name: 'Nada-Watson-LuxAlgo',
      key: 'Nadaraya-Watson-LuxAlgo',
      format: formatValue,
      color: { UpperBand: '#2eef2eff', LowerBand: '#ff0000' },
      subKeys: ['UpperBand', 'LowerBand'],
    },
    {
      name: 'SRv2 Resistance',
      key: 'SRv2 Resistance',
      format: formatValue,
      color: { Resistance: '#ff0000' },
      subKeys: Array.from({ length: 5 }, (_, i) => `Level${i + 1}`).concat('CurrentPrice').filter(subKey => {
        return (symbolTimeframes[selectedSymbol] || []).some(timeframe => {
          const srv2Data = indicators[selectedSymbol]?.[timeframe]?.indicators?.['SRv2'] || indicators[selectedSymbol]?.[timeframe]?.['SRv2'];
          const labels = srv2Data?.labels || [];
          const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          const allLevels = labels
            .filter((label: any) => label && typeof label.y === 'number')
            .map((label: any) => ({
              id: label.id || `label-${Math.random()}`,
              text: label.text || (label.y <= currentPrice ? 'Support' : 'Resistance'),
              y: label.y,
              isSupport: label.text?.toLowerCase().includes('support') || label.y <= currentPrice,
            }));
          const resistanceLevels = allLevels.filter((label: any) => !label.isSupport && label.y > currentPrice).sort((a: any, b: any) => a.y - b.y);
          const index = parseInt(subKey.replace('Level', '')) - 1;
          const item = resistanceLevels[index];
          return item ? true : subKey === 'CurrentPrice' && currentPrice > 0;
        });
      }),
    },
    {
      name: 'SRv2 Support',
      key: 'SRv2 Support',
      format: formatValue,
      color: { Support: '#2eef2eff' },
      subKeys: Array.from({ length: 5 }, (_, i) => `Level${i + 1}`).filter(subKey => {
        return (symbolTimeframes[selectedSymbol] || []).some(timeframe => {
          const srv2Data = indicators[selectedSymbol]?.[timeframe]?.indicators?.['SRv2'] || indicators[selectedSymbol]?.[timeframe]?.['SRv2'];
          const labels = srv2Data?.labels || [];
          const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          const allLevels = labels
            .filter((label: any) => label && typeof label.y === 'number')
            .map((label: any) => ({
              id: label.id || `label-${Math.random()}`,
              text: label.text || (label.y <= currentPrice ? 'Support' : 'Resistance'),
              y: label.y,
              isSupport: label.text?.toLowerCase().includes('support') || label.y <= currentPrice,
            }));
          const supportLevels = allLevels.filter((label: any) => label.isSupport && label.y <= currentPrice).sort((a: any, b: any) => b.y - a.y);
          const index = parseInt(subKey.replace('Level', '')) - 1;
          const item = supportLevels[index];
          return item ? true : false;
        });
      }),
    },
    {
      name: 'Pivot Points High Low',
      key: 'Pivot Points High Low',
      format: formatValue,
      color: { Resistance: '#ff0000', Support: '#008000' },
      subKeys: Array.from({ length: maxResLevels }, (_, i) => `Res${maxResLevels - i}`).concat('CurrentPrice').concat(Array.from({ length: maxSupLevels }, (_, i) => `Sup${i + 1}`)),
    },
    {
      name: 'Pivot Points Std Resistance',
      key: 'Pivot Points Standard Resistance',
      format: formatValue,
      color: { Resistance: '#ff0000', Pivot: '#ffd700' },
      subKeys: ['R5', 'R4', 'R3', 'R2', 'R1', ' P', 'S1', 'S2', 'S3', 'S4', 'S5', 'CurrentPrice'].filter(subKey => {
        return (symbolTimeframes[selectedSymbol] || []).some(timeframe => {
          const pivotData = indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points Standard'] || indicators[selectedSymbol]?.[timeframe]?.['Pivot Points Standard'];
          const labels = pivotData?.labels || [];
          const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          if (subKey === 'CurrentPrice') return currentPrice > 0;
          const allLevels = labels.map((label: any) => {
            const y = parseFloat(label.text.match(/\((\d+\.?\d*)\)/)?.[1] || '0');
            return { text: label.text, y };
          });
          const matching = allLevels.find((item: any) => item.text.startsWith(`${subKey} (`));
          if (!matching) return false;
          return matching.y > currentPrice;
        });
      }),
    },
    {
      name: 'Pivot Points Std Support',
      key: 'Pivot Points Standard Support',
      format: formatValue,
      color: { Support: '#2eef2eff', Pivot: '#ffd700' },
      subKeys: ['R5', 'R4', 'R3', 'R2', 'R1', ' P', 'S1', 'S2', 'S3', 'S4', 'S5'].filter(subKey => {
        return (symbolTimeframes[selectedSymbol] || []).some(timeframe => {
          const pivotData = indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points Standard'] || indicators[selectedSymbol]?.[timeframe]?.['Pivot Points Standard'];
          const labels = pivotData?.labels || [];
          const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          const allLevels = labels.map((label: any) => {
            const y = parseFloat(label.text.match(/\((\d+\.?\d*)\)/)?.[1] || '0');
            return { text: label.text, y };
          });
          const matching = allLevels.find((item: any) => item.text.startsWith(`${subKey} (`));
          if (!matching) return false;
          return matching.y <= currentPrice;
        });
      }),
    },
  ];

  const filteredIndicatorDefinitions = indicatorDefinitions.filter(indicator => {
    if (viewMode === 'standard' && indicator.key === 'Pivot Points High Low') return false;
    if (viewMode === 'pivot' && indicator.key !== 'Pivot Points High Low') return false;
    const symbolData = indicators[selectedSymbol];
    if (!symbolData) return false;
    if (indicator.key === 'SRv2 Support' || indicator.key === 'SRv2 Resistance') {
      return (symbolTimeframes[selectedSymbol] || []).some(timeframe => {
        const srv2Data = symbolData[timeframe]?.indicators?.['SRv2'] || symbolData[timeframe]?.['SRv2'];
        return srv2Data && Array.isArray(srv2Data.labels) && srv2Data.labels.length > 0;
      });
    }
    if (indicator.key === 'Pivot Points Standard' || indicator.key === 'Pivot Points Standard Resistance' || indicator.key === 'Pivot Points Standard Support' || indicator.key === 'Pivot Points Std') {
      return (symbolTimeframes[selectedSymbol] || []).some(timeframe => {
        const pivotData = symbolData[timeframe]?.indicators?.['Pivot Points Standard'] || symbolData[timeframe]?.['Pivot Points Standard'];
        return pivotData && Array.isArray(pivotData.labels) && pivotData.labels.length > 0;
      });
    }
    return (symbolTimeframes[selectedSymbol] || []).some(timeframe => {
      const indicatorsObj = symbolData[timeframe]?.indicators;
      return indicatorsObj && indicatorsObj[indicator.key] !== undefined || symbolData[timeframe]?.[indicator.key] !== undefined;
    });
  });

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', p: 0 }}>
      <Header
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        marketData={marketData}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showBuySell={showBuySell}
        setShowBuySell={setShowBuySell}
      />
      <Container sx={{ py: 0, px: 1 }}>
        {showBuySell && (
          <Card sx={{ mb: 1, borderRadius: 2, boxShadow: 2 }}>
            <CardContent sx={{ p: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, maxWidth: 800 }}>
                  <Typography variant="h6" sx={{ color: '#4CAF50', mb: 0.5, fontWeight: 500, fontSize: '0.9rem' }}>
                    💰 Buy Levels (All Symbols)
                  </Typography>
                  <Table sx={{ minWidth: 300, '& .MuiTableCell-root': { py: 0.2, px: 0.5 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', fontSize: '0.7rem' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', fontSize: '0.7rem' }}>Symbol</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', fontSize: '0.7rem' }}>Entry Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {buySymbols.map((symbol) => {
                        const displaySymbol = symbols.find(s => s.full === symbol.symbol)?.display || symbol.symbol;
                        return (
                          <TableRow key={symbol._id}>
                            <TableCell sx={{ color: '#4CAF50', fontSize: '0.6rem' }}>Buy</TableCell>
                            <TableCell sx={{ fontSize: '0.6rem' }}>{displaySymbol}</TableCell>
                            <TableCell sx={{ fontSize: '0.6rem' }}>{symbol.entryPrice.toFixed(6)}</TableCell>
                          </TableRow>
                        );
                      })}
                      {buySymbols.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ fontSize: '0.6rem', py: 0.2 }}>
                            <Typography color="text.secondary" variant="body2">No Buy levels received</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
                <Box sx={{ flex: 1, maxWidth: 700 }}>
                  <Typography variant="h6" sx={{ color: '#F44336', mb: 0.5, fontWeight: 500, fontSize: '0.9rem' }}>
                    💰 Sell Levels (All Symbols)
                  </Typography>
                  <Table sx={{ minWidth: 300, '& .MuiTableCell-root': { py: 0.2, px: 0.5 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', fontSize: '0.7rem' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', fontSize: '0.7rem' }}>Symbol</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', fontSize: '0.7rem' }}>Entry Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sellSymbols.map((symbol) => {
                        const displaySymbol = symbols.find(s => s.full === symbol.symbol)?.display || symbol.symbol;
                        return (
                          <TableRow key={symbol._id}>
                            <TableCell sx={{ color: '#F44336', fontSize: '0.6rem' }}>Sell</TableCell>
                            <TableCell sx={{ fontSize: '0.6rem' }}>{displaySymbol}</TableCell>
                            <TableCell sx={{ fontSize: '0.6rem' }}>{symbol.entryPrice.toFixed(6)}</TableCell>
                          </TableRow>
                        );
                      })}
                      {sellSymbols.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ fontSize: '0.6rem', py: 0.2 }}>
                            <Typography color="text.secondary" variant="body2">No Sell levels received</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        <Card sx={{ mb: 1, borderRadius: 2, boxShadow: 2, width: '100%' }}>
          <CardContent sx={{ p: 0.5 }}>
            <Box sx={{ maxHeight: 'none', overflowY: 'auto', overflowX: 'auto' }}>
              <Table sx={{ minWidth: 650, tableLayout: 'fixed', '& .MuiTableCell-root': { py: 0.2, px: 0.5 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        backgroundColor: 'background.paper',
                        position: 'sticky',
                        top: 0,
                        left: 0,
                        zIndex: 3,
                        minWidth: 100,
                        borderRight: '1px solid #ccc',
                        fontSize: '0.7rem'
                      }}
                    >
                      Indicator
                    </TableCell>
                    {(symbolTimeframes[selectedSymbol] || []).map((timeframe) => (
                      <TableCell
                        key={timeframe}
                        align="center"
                        sx={{
                          fontWeight: 600,
                          backgroundColor: 'background.paper',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2,
                          minWidth: 150,
                          borderRight: '1px solid #ccc',
                          fontSize: '0.7rem'
                        }}
                      >
                        {timeframeLabels[timeframe] || timeframe}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredIndicatorDefinitions.map((indicator) => {
                    const nameColor =
                      ['EMA50', 'EMA200', 'RSI', 'MACD', 'FibonacciBollingerBands', 'VWAP', 'BollingerBands', 'CandlestickPatterns', 'Nadaraya-Watson-LuxAlgo'].includes(indicator.key)
                        ? typeof indicator.color === 'string'
                          ? indicator.color
                          : indicator.color ? indicator.color[Object.keys(indicator.color)[0]] : 'inherit'
                        : indicator.key === 'SRv2 Resistance' || indicator.key === 'Pivot Points Standard Resistance'
                        ? '#ff0000'
                        : indicator.key === 'SRv2 Support' || indicator.key === 'Pivot Points Standard Support'
                        ? '#1cf01cff'
                        : indicator.key === 'Pivot Points Standard' || indicator.key === 'Pivot Points Std'
                        ? '#ffd700'
                        : 'inherit';
                    const borderColor = nameColor;
                    const thickLineIndicators = [
                      { key: 'EMA50', subKey: 'EMA' },
                      { key: 'EMA200', subKey: 'EMA' },
                      { key: 'RSI', subKey: 'RSI' },
                      { key: 'MACD', subKey: 'Histogram' },
                      { key: 'FibonacciBollingerBands', subKey: '1_2' },
                      { key: 'VWAP', subKey: 'Upper_Band_3' },
                      { key: 'BollingerBands', subKey: 'Upper' },
                      { key: 'CandlestickPatterns', subKey: null },
                      { key: 'SRv2 Resistance', subKey: 'Level1' },
                      { key: 'Pivot Points Standard Resistance', subKey: 'R5' },
                      { key: 'Pivot Points Std', subKey: 'P' },
                    ];
                    if (indicator.subKeys && indicator.subKeys.length > 0) {
                      const dynamicSubKeys = indicator.subKeys.filter(subKey => {
                        return (symbolTimeframes[selectedSymbol] || []).some(timeframe => {
                          const currentValue = indicator.key === 'SRv2 Support' || indicator.key === 'SRv2 Resistance'
                            ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['SRv2'] ?? 
                              indicators[selectedSymbol]?.[timeframe]?.['SRv2']
                            : indicator.key === 'Pivot Points Standard' || indicator.key === 'Pivot Points Standard Resistance' || indicator.key === 'Pivot Points Standard Support' || indicator.key === 'Pivot Points Std'
                            ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points Standard'] ?? 
                              indicators[selectedSymbol]?.[timeframe]?.['Pivot Points Standard']
                            : indicator.key === 'Pivot Points High Low'
                            ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points High Low'] ?? 
                              indicators[selectedSymbol]?.[timeframe]?.['Pivot Points High Low']
                            : indicator.key === 'Nadaraya-Watson-LuxAlgo'
                            ? indicators[selectedSymbol]?.[timeframe]?.indicators?.[indicator.key] ?? 
                              indicators[selectedSymbol]?.[timeframe]?.[indicator.key]
                            : indicators[selectedSymbol]?.[timeframe]?.indicators?.[indicator.key] ?? 
                              indicators[selectedSymbol]?.[timeframe]?.[indicator.key];
                          if (!currentValue) return false;
                          if (indicator.key === 'Pivot Points High Low') {
                            const pivotPoints = currentValue.processedPivotPoints || [];
                            const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
                            if (subKey.startsWith('Res')) {
                              const index = parseInt(subKey.replace('Res', '')) - 1;
                              const levelsAbove = pivotPoints
                                .filter((point: any) => parseFloat(point.value) >= currentPrice)
                                .sort((a: any, b: any) => b.value - a.value);
                              return index >= 0 && index < levelsAbove.length;
                            } else if (subKey.startsWith('Sup')) {
                              const index = parseInt(subKey.replace('Sup', '')) - 1;
                              const levelsBelow = pivotPoints
                                .filter((point: any) => parseFloat(point.value) < currentPrice)
                                .sort((a: any, b: any) => b.value - a.value);
                              return index >= 0 && index < levelsBelow.length;
                            } else if (subKey === 'CurrentPrice') {
                              return currentPrice > 0;
                            }
                            return false;
                          }
                          if (indicator.key === 'SRv2 Support' || indicator.key === 'SRv2 Resistance') {
                            const labels = currentValue?.labels || [];
                            const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
                            const isSupport = indicator.key === 'SRv2 Support';
                            const allLevels = labels
                              .filter((label: any) => label && typeof label.y === 'number')
                              .map((label: any) => ({
                                id: label.id || `label-${Math.random()}`,
                                text: label.text || (label.y <= currentPrice ? 'Support' : 'Resistance'),
                                y: label.y,
                                isSupport: label.text?.toLowerCase().includes('support') || label.y <= currentPrice,
                              }));
                            const filteredLevels = isSupport 
                              ? allLevels.filter((label: any) => label.isSupport && label.y <= currentPrice).sort((a: any, b: any) => b.y - a.y)
                              : allLevels.filter((label: any) => !label.isSupport && label.y > currentPrice).sort((a: any, b: any) => a.y - b.y);
                            const index = parseInt(subKey.replace('Level', '')) - 1;
                            return index >= 0 && index < filteredLevels.length || (subKey === 'CurrentPrice' && currentPrice > 0);
                          }
                          if (indicator.key === 'Pivot Points Standard' || indicator.key === 'Pivot Points Standard Resistance' || indicator.key === 'Pivot Points Standard Support' || indicator.key === 'Pivot Points Std') {
                            const labels = currentValue?.labels || [];
                            const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
                            const allLevels = labels.map((label: any) => {
                              const y = parseFloat(label.text.match(/\((\d+\.?\d*)\)/)?.[1] || '0');
                              return { text: label.text, y };
                            });
                            const filteredLevels = indicator.key === 'Pivot Points Standard Support' 
                              ? allLevels.filter((label: any) => label.y <= currentPrice)
                              : indicator.key === 'Pivot Points Std' 
                              ? allLevels.filter((label: any) => label.text.startsWith('P ('))
                              : indicator.key === 'Pivot Points Standard' 
                              ? allLevels.filter((label: any) => label.text.startsWith('P ('))
                              : allLevels.filter((label: any) => label.y > currentPrice);
                            const matching = filteredLevels.find((item: any) => item.text.startsWith(`${subKey} (`));
                            const value = matching ? matching.text.match(/\((\d+\.?\d*)\)/)?.[1] : null;
                            return value !== null && value !== undefined && value !== '-' || (subKey === 'CurrentPrice' && currentPrice > 0);
                          }
                          if (indicator.key === 'Nadaraya-Watson-LuxAlgo') {
                            const lines = currentValue?.lines || [];
                            return lines.length >= 2 && lines[0]?.y2 !== undefined && lines[1]?.y2 !== undefined;
                          }
                          const subValue = currentValue[subKey];
                          return subValue !== undefined && subValue !== null && subValue !== 1e100;
                        });
                      });
                      return dynamicSubKeys.map((subKey) => {
                        const subColor = typeof indicator.color === 'object' 
                          ? indicator.color[subKey] || indicator.color[subKey.startsWith('R') || subKey.startsWith('Res') ? 'Resistance' 
                            : subKey.startsWith('S') || subKey.startsWith('Sup') ? 'Support' 
                            : subKey === 'P' ? 'Pivot' : ''] || (subKey === 'CurrentPrice' ? '#11b3d8ff' : nameColor)
                          : (subKey === 'CurrentPrice' ? '#11b3d8ff' : nameColor);
                        const isThickLine = thickLineIndicators.some(
                          (item) => item.key === indicator.key && (item.subKey === subKey || (!item.subKey && !subKey))
                        );
                        const displayName = (indicator.key === 'SRv2 Resistance' || indicator.key === 'Pivot Points Standard Resistance' || indicator.key === 'Pivot Points High Low') && subKey === 'CurrentPrice' 
                          ? 'Current Price' 
                          : indicator.name;
                        return (
                          <TableRow 
                            key={`${indicator.name}-${subKey}`} 
                            sx={{ borderTop: isThickLine ? `2px solid ${borderColor}` : `1px solid ${borderColor}` }}
                          >
                            <TableCell
                              sx={{
                                fontWeight: 50,
                                color: subColor,
                                backgroundColor: 'background.paper',
                                borderRight: '1px solid #ccc',
                                fontSize: '0.7rem',
                                py: 0.2,
                                px: 0.5
                              }}
                            >
                              {displayName} {subKey !== 'CurrentPrice' ? subKey : ''}
                            </TableCell>
                            {(symbolTimeframes[selectedSymbol] || []).map((timeframe) => {
                              const currentValue = indicator.key === 'SRv2 Support' || indicator.key === 'SRv2 Resistance'
                                ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['SRv2'] ?? 
                                  indicators[selectedSymbol]?.[timeframe]?.['SRv2']
                                : indicator.key === 'Pivot Points Standard' || indicator.key === 'Pivot Points Standard Resistance' || indicator.key === 'Pivot Points Standard Support' || indicator.key === 'Pivot Points Std'
                                ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points Standard'] ?? 
                                  indicators[selectedSymbol]?.[timeframe]?.['Pivot Points Standard']
                                : indicator.key === 'Pivot Points High Low'
                                ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points High Low'] ?? 
                                  indicators[selectedSymbol]?.[timeframe]?.['Pivot Points High Low']
                                : indicator.key === 'Nadaraya-Watson-LuxAlgo'
                                ? indicators[selectedSymbol]?.[timeframe]?.indicators?.[indicator.key] ?? 
                                  indicators[selectedSymbol]?.[timeframe]?.[indicator.key]
                                : indicators[selectedSymbol]?.[timeframe]?.indicators?.[indicator.key] ?? 
                                  indicators[selectedSymbol]?.[timeframe]?.[indicator.key];
                              const subValue = currentValue ? currentValue[subKey] : undefined;
                              const hasData = subValue !== undefined && subValue !== null;
                              return (
                                <TableCell
                                  key={timeframe}
                                  align="center"
                                  sx={{
                                    fontWeight: 'bold',
                                    color: subColor,
                                    fontSize: '0.6rem',
                                    borderRight: '1px solid #ccc',
                                    py: 0.2,
                                    px: 0.5
                                  }}
                                >
                                  {hasData ? formatValue(subValue, indicator.key, subKey) : formatValue(currentValue, indicator.key, subKey)}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      });
                    } else {
                      const isThickLine = thickLineIndicators.some(
                        (item) => item.key === indicator.key && !item.subKey
                      );
                      return (
                        <TableRow 
                          key={indicator.name} 
                          sx={{ borderTop: isThickLine ? `2px solid ${borderColor}` : `1px solid ${borderColor}` }}
                        >
                          <TableCell
                            sx={{
                              fontWeight: 50,
                              color: nameColor,
                              backgroundColor: 'background.paper',
                              borderRight: '1px solid #ccc',
                              fontSize: '0.7rem',
                              py: 0.2,
                              px: 0.5
                            }}
                          >
                            {indicator.name}
                          </TableCell>
                          {(symbolTimeframes[selectedSymbol] || []).map((timeframe) => {
                            const currentValue = indicator.key === 'SRv2 Support' || indicator.key === 'SRv2 Resistance'
                              ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['SRv2'] ?? 
                                indicators[selectedSymbol]?.[timeframe]?.['SRv2']
                              : indicator.key === 'Pivot Points Standard' || indicator.key === 'Pivot Points Standard Resistance' || indicator.key === 'Pivot Points Standard Support' || indicator.key === 'Pivot Points Std'
                              ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points Standard'] ?? 
                                indicators[selectedSymbol]?.[timeframe]?.['Pivot Points Standard']
                              : indicator.key === 'Pivot Points High Low'
                              ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points High Low'] ?? 
                                indicators[selectedSymbol]?.[timeframe]?.['Pivot Points High Low']
                              : indicators[selectedSymbol]?.[timeframe]?.indicators?.[indicator.key] ?? 
                                indicators[selectedSymbol]?.[timeframe]?.[indicator.key];
                            const hasData = indicator.key === 'SRv2 Support' || indicator.key === 'SRv2 Resistance'
                              ? currentValue && Array.isArray(currentValue?.labels) && currentValue.labels.length > 0
                              : indicator.key === 'Pivot Points Standard' || indicator.key === 'Pivot Points Standard Resistance' || indicator.key === 'Pivot Points Standard Support' || indicator.key === 'Pivot Points Std'
                              ? currentValue && Array.isArray(currentValue?.labels) && currentValue.labels.length > 0
                              : indicator.key === 'Pivot Points High Low'
                              ? currentValue && Array.isArray(currentValue?.processedPivotPoints) && currentValue.processedPivotPoints.length > 0
                              : currentValue !== undefined && currentValue !== null;
                            return (
                              <TableCell
                                key={timeframe}
                                align="center"
                                sx={{
                                  fontWeight: 'bold',
                                  color:
                                    indicator.key === 'EMA50' ? '#1e90ff' :
                                    indicator.key === 'EMA200' ? '#ffd700' :
                                    indicator.key === 'RSI' ? '#f71ff7ff' :
                                    indicator.key === 'CandlestickPatterns' ? '#c6f170ff' :
                                    indicator.key === 'Nadaraya-Watson-LuxAlgo' ? '#9913ecff' :
                                    indicator.key === 'SRv2 Support' ? '#81ee42ff' :
                                    indicator.key === 'SRv2 Resistance' ? '#ff0000' :
                                    indicator.key === 'Pivot Points High Low' ? '#ff0000' :
                                    indicator.key === 'Pivot Points Standard' ? '#ffd700' :
                                    indicator.key === 'Pivot Points Std' ? '#ffd700' :
                                    indicator.key === 'Pivot Points Standard Resistance' ? '#ff0000' :
                                    indicator.key === 'Pivot Points Standard Support' ? '#30e830ff' :
                                    '#efca12ff',
                                  fontSize: '0.6rem',
                                  borderRight: '1px solid #ccc',
                                  py: 0.2,
                                  px: 0.5
                                }}
                              >
                                {hasData ? indicator.format(currentValue || {}, indicator.key) : '-'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    }
                  })}
                </TableBody>
              </Table>
            </Box>
            {!indicators[selectedSymbol] && (
              <Typography color="text.secondary" sx={{ fontSize: '0.6rem', py: 0.2 }}>Waiting for indicator data for {symbols.find(s => s.full === selectedSymbol)?.display || selectedSymbol}...</Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Dashboard;


/*
import { useEffect, useState, type JSX } from 'react';
import { io, Socket } from 'socket.io-client';
import { Container, Typography, Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody, Box } from '@mui/material';
import Header from '../components/Header';
import axios from 'axios';

type IndicatorData = {
  [symbol: string]: {
    [timeframe: string]: {
      symbol: string;
      timeframe: string;
      indicators?: { [key: string]: any };
      [key: string]: any;
    };
  };
};

type Symbol = {
  _id: string;
  symbol: string;
  entryPrice: number;
  side: 'long' | 'short';
};

const Dashboard: React.FC = () => {
  const [indicators, setIndicators] = useState<IndicatorData>({});
  const [, setRawData] = useState<IndicatorData>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string>('VANTAGE:XAUUSD');
  const [availableTimeframes, setAvailableTimeframes] = useState<string[]>([]);
  const [buySymbols, setBuySymbols] = useState<Symbol[]>([]);
  const [sellSymbols, setSellSymbols] = useState<Symbol[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [marketData, setMarketData] = useState<{ [symbol: string]: { marketPrice: number; volume: number } }>({});
  const [viewMode, setViewMode] = useState<'standard' | 'pivot'>('standard');
  const [showBuySell, setShowBuySell] = useState<boolean>(false);

  const symbols = [
    { full: 'VANTAGE:XAUUSD', display: 'XAUUSD' },
    { full: 'VANTAGE:GER40', display: 'GER40' },
    { full: 'VANTAGE:NAS100', display: 'NAS100' },
    { full: 'VANTAGE:BTCUSD', display: 'BTCUSD' },
    { full: 'VANTAGE:XRPUSD', display: 'XRPUSD' },
    { full: 'BINANCE:SUIUSDT', display: 'SUIUSDT' },
  ];

  const timeframeLabels: { [key: string]: string } = {
    '15': '15m',
    '60': '1h',
    '240': '4h',
    '1D': '1D',
    '1W': '1W',
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      symbols.forEach(({ full }) => newSocket.emit('select-symbol', { symbol: full }));
    });

    newSocket.on('live-data-all', (data: any) => {
      if (data.symbols && Array.isArray(data.symbols)) {
        const buy = data.symbols.filter((s: Symbol) => s.side === 'long');
        const sell = data.symbols.filter((s: Symbol) => s.side === 'short');
        setBuySymbols(buy);
        setSellSymbols(sell);
      } else {
        if (data.marketPrice || data.volume) {
          setMarketData((prev) => ({
            ...prev,
            [data.symbol]: {
              marketPrice: data.marketPrice || prev[data.symbol]?.marketPrice || 0,
              volume: data.volume || prev[data.symbol]?.volume || 0,
            },
          }));
        }
        setRawData((prev) => {
          const newData = structuredClone(prev);
          newData[data.symbol] = {
            ...(newData[data.symbol] || {}),
            [data.timeframe]: data,
          };
          return newData;
        });
        setIndicators((prev) => {
          const newIndicators = structuredClone(prev);
          const symbolData = newIndicators[data.symbol] || {};
          const timeframeData = symbolData[data.timeframe] || { symbol: data.symbol, timeframe: data.timeframe, indicators: {} };
          
          const mergedIndicators = {
            ...timeframeData.indicators,
            ...data.indicators,
            ...(data.EMA50 && { EMA50: data.EMA50 }),
            ...(data.EMA200 && { EMA200: data.EMA200 }),
            ...(data.RSI && { RSI: data.RSI }),
            ...(data.MACD && { MACD: data.MACD }),
            ...(data.FibonacciBollingerBands && { FibonacciBollingerBands: data.FibonacciBollingerBands }),
            ...(data.VWAP && { VWAP: data.VWAP }),
            ...(data.BollingerBands && { BollingerBands: data.BollingerBands }),
            ...(data.CandlestickPatterns && { CandlestickPatterns: data.CandlestickPatterns }),
            ...(data['Nadaraya-Watson-LuxAlgo'] && { 'Nadaraya-Watson-LuxAlgo': data['Nadaraya-Watson-LuxAlgo'] }),
            ...(data.SRv2 && { SRv2: data.SRv2 }),
            ...(data['Pivot Points High Low'] && { 'Pivot Points High Low': data['Pivot Points High Low'] }),
            ...(data['Pivot Points Standard'] && { 'Pivot Points Standard': data['Pivot Points Standard'] }),
          };

          newIndicators[data.symbol] = {
            ...symbolData,
            [data.timeframe]: {
              ...timeframeData,
              indicators: mergedIndicators,
            },
          };
          return newIndicators;
        });

        
        setAvailableTimeframes((prev) => {
          if (!data.timeframe || !Object.keys(timeframeLabels).includes(data.timeframe)) {
            return prev;
          }
          const newTimeframes = [...new Set([...prev, data.timeframe])].sort((a, b) => {
            const order = ['15', '60', '240', '1D', '1W'];
            return order.indexOf(a) - order.indexOf(b);
          });
          return newTimeframes;
        });


        
      }
    });

    newSocket.on('disconnect', () => {});

    newSocket.on('connect_error', (error) => {
      console.error(`[${new Date().toISOString()}] WebSocket connection error: ${error.message}`);
    });

    setSocket(newSocket);

    const fetchSymbols = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/symbols`);
        if (response.data.success && Array.isArray(response.data.symbols)) {
          setBuySymbols(response.data.symbols.filter((s: Symbol) => s.side === 'long'));
          setSellSymbols(response.data.symbols.filter((s: Symbol) => s.side === 'short'));
        } else {
          setBuySymbols([]);
          setSellSymbols([]);
        }
      } catch (error) {
        setBuySymbols([]);
        setSellSymbols([]);
      }
    };
    fetchSymbols();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && selectedSymbol) {
      socket.emit('select-symbol', { symbol: selectedSymbol });
    }
  }, [selectedSymbol, socket]);

  const formatValue = (val: any, indicatorKey: string, subKey?: string): JSX.Element | string => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') {
      if (val > 1e10 || val === 1e100) return '-';
      return val.toFixed(5);
    }
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      if (val[0] && typeof val[0] === 'object') {
        return (
          <Box>
            {val.map((item: any, index: number) => (
              <Box key={index}>
                {Object.entries(item).map(([key, value]) => (
                  value !== 1e100 && (
                    <Box key={key} sx={{ fontWeight: 'bold', fontSize: '0.4rem', lineHeight: 1 }}>
                      {`${key}: ${formatValue(value, indicatorKey, subKey)}`}
                    </Box>
                  )
                ))}
              </Box>
            ))}
          </Box>
        );
      }
      return val[val.length - 1]?.toFixed(2) || '';
    }
    if (typeof val === 'object') {
      if (subKey && (indicatorKey.includes('SRv2') || indicatorKey.includes('Pivot Points') || indicatorKey === 'Nadaraya-Watson-LuxAlgo')) {
        let currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
        if (subKey === 'CurrentPrice') {
          if (indicatorKey.endsWith('Resistance') || indicatorKey === 'Pivot Points High Low') {
            return `Cu. Price=${currentPrice.toFixed(5)}`;
          } else {
            return '-';
          }
        }
        if (indicatorKey === 'Nadaraya-Watson-LuxAlgo') {
          const lines = val.lines || [];
          const sortedLines = [...lines].sort((a, b) => (typeof b.y2 === 'number' && typeof a.y2 === 'number' ? b.y2 - a.y2 : 0));
          const isLower = subKey === 'LowerBand';
          const line = isLower ? sortedLines[1] : sortedLines[0];
          return line && typeof line.y2 === 'number' ? `${subKey} y=${line.y2.toFixed(2)}` : '-';
        }
        if (indicatorKey === 'Pivot Points High Low') {
          const pivotPoints = val.processedPivotPoints || [];
          currentPrice = marketData[selectedSymbol]?.marketPrice || 3313.8;
          const levelsAbove = pivotPoints
            .filter((point: any) => parseFloat(point.value) >= currentPrice)
            .sort((a: any, b: any) => b.value - a.value);
          const levelsBelow = pivotPoints
            .filter((point: any) => parseFloat(point.value) < currentPrice)
            .sort((a: any, b: any) => b.value - a.value);
          if (subKey.startsWith('Res')) {
            const index = parseInt(subKey.replace('Res', '')) - 1;
            const item = levelsAbove[index];
            return item ? `${item.value} (Count: ${item.count}, Diff: ${item.difference})` : '-';
          } else if (subKey.startsWith('Sup')) {
            const index = parseInt(subKey.replace('Sup', '')) - 1;
            const item = levelsBelow[index];
            return item ? `${item.value} (Count: ${item.count}, Diff: ${item.difference})` : '-';
          }
          return '-';
        } else if (indicatorKey.includes('SRv2')) {
          const labels = val?.labels || [];
          currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          const isSupport = indicatorKey === 'SRv2 Support';
          const allLevels = labels
            .filter((label: any) => label && typeof label.y === 'number')
            .map((label: any) => ({
              id: label.id || `label-${Math.random()}`,
              text: label.text || (label.y <= currentPrice ? 'Support' : 'Resistance'),
              y: label.y,
              isSupport: label.text?.toLowerCase().includes('support') || label.y <= currentPrice,
            }));
          let filteredLevels = isSupport 
            ? allLevels.filter((label: any) => label.isSupport && label.y <= currentPrice).sort((a: any, b: any) => b.y - a.y)
            : allLevels.filter((label: any) => !label.isSupport && label.y > currentPrice).sort((a: any, b: any) => a.y - b.y);
          const index = parseInt(subKey.replace('Level', '')) - 1;
          const item = filteredLevels[index];
          return item ? item.text : '-';
        } else if (indicatorKey === 'Pivot Points Standard Resistance' || indicatorKey === 'Pivot Points Standard Support') {
          const labels = val.labels || [];
        //  console.log("gffffgfgfg",labels)
          currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          const allLevels = labels.map((label: any) => {
            const y = parseFloat(label.text.match(/\((\d+\.?\d*)\)/)?.[1] || '0');
            return {
              text: label.text,
              y,
            };
          });
          const matching = allLevels.find((item: any) => item.text.startsWith(`${subKey} (`));
        //  console.log("subkey",matching)
          if (!matching) return '-';
          const isResistance = indicatorKey === 'Pivot Points Standard Resistance';
          const condition = isResistance ? matching.y > currentPrice : matching.y <= currentPrice;
          return condition ? matching.text : '-';
        } else if (indicatorKey.includes('Pivot Points Standard')) {
          const labels = val.labels || [];
          currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          const allLevels = labels.map((label: any) => {
            const y = parseFloat(label.text.match(/\((\d+\.?\d*)\)/)?.[1] || '0');
            return {
              text: label.text,
              y,
            };
          });
          const matching = allLevels.find((item: any) => item.text.startsWith(`${subKey} (`));
          return matching ? matching.text : '-';
        }
        return '-';
      }
      if (indicatorKey === 'CandlestickPatterns') {
        const activePatterns = Object.entries(val)
          .filter(([key, value]) => value === 1 && key !== '$time')
          .map(([key]) => key);
        return activePatterns.length > 0 ? (
          <Box sx={{ fontWeight: 'normal', color: '#e0f808ff', fontSize: '0.4rem', lineHeight: 1 }}>{activePatterns.join(', ')}</Box>
        ) : (
          'None'
        );
      }
      if (indicatorKey === 'Nadaraya-Watson-LuxAlgo') {
        const lines = val.lines || [];
        const sortedLines = [...lines].sort((a, b) => (typeof b.y2 === 'number' && typeof a.y2 === 'number' ? b.y2 - a.y2 : 0));
        return (
          <Box>
            {sortedLines.map((line: any, index: number) => {
              const isLowerBand = index === 1;
              return (
                <Box key={index}>
                  <Box
                    sx={{
                      fontWeight: 'bold',
                      color: isLowerBand ? '#ff0000' : '#36f236ff',
                      fontSize: '0.4rem',
                      lineHeight: 1
                    }}
                  >
                    {isLowerBand ? 'LowerBand' : 'UpperBand'} y={(typeof line.y2 === 'number' ? line.y2.toFixed(2) : '-')}
                  </Box>
                  {index === 0 && <Box sx={{ my: 0.2, borderBottom: '1px solid #ccccccff', width: '60%', mx: 'auto' }} />}
                </Box>
              );
            })}
          </Box>
        );
      }
      if (indicatorKey === 'Pivot Points High Low') {
        const pivotPoints = val.processedPivotPoints || [];
        const currentPrice = marketData[selectedSymbol]?.marketPrice || 3313.8;
        const displayItems = currentPrice > 0
          ? [
              ...pivotPoints.filter((point: any) => parseFloat(point.value) >= currentPrice),
              { id: 'current-price', value: `Cu. Price=${currentPrice.toFixed(5)}`, count: 0, difference: "-", isCurrentPrice: true, y: currentPrice },
              ...pivotPoints.filter((point: any) => parseFloat(point.value) < currentPrice),
            ]
          : pivotPoints;
        return (
          <Box>
            {displayItems.map((item: any, index: number) => (
              <Box
                key={item.id || index}
                sx={{
                  fontWeight: 'bold',
                  color: item.isCurrentPrice ? '#11b3d8ff' : parseFloat(item.value) >= currentPrice ? '#ff0000' : '#008000',
                  mt: index > 0 && pivotPoints.length > 0 && parseFloat(item.value) < currentPrice && parseFloat(displayItems[index - 1].value) >= currentPrice ? 0.2 : 0,
                  fontSize: '0.4rem',
                  lineHeight: 1
                }}
              >
                {item.value}
                {!item.isCurrentPrice && (
                  <Box sx={{ fontWeight: 'normal', color: '#ffffff', fontSize: '0.35rem', lineHeight: 1 }}>
                    Count: {item.count}, Diff: {item.difference}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        );
      }
      if (indicatorKey === 'SRv2 Support' || indicatorKey === 'SRv2 Resistance') {
        const labels = val?.labels || [];
        const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
        const isSupport = indicatorKey === 'SRv2 Support';
        const allLevels = labels
          .filter((label: any) => label && typeof label.y === 'number')
          .map((label: any) => ({
            id: label.id || `label-${Math.random()}`,
            text: label.text || (label.y <= currentPrice ? 'Support' : 'Resistance'),
            y: label.y,
            isSupport: label.text?.toLowerCase().includes('support') || label.y <= currentPrice,
          }));
        const supportLevels = allLevels.filter((label: any) => label.isSupport && label.y <= currentPrice);
        const resistanceLevels = allLevels.filter((label: any) => !label.isSupport && label.y > currentPrice);
        const maxSupport = supportLevels.length > 0 ? Math.max(...supportLevels.map((l: any) => l.y)) : -Infinity;
        const minResistance = resistanceLevels.length > 0 ? Math.min(...resistanceLevels.map((l: any) => l.y)) : Infinity;
        const showCurrentPrice = currentPrice > 0 && !isSupport && currentPrice > maxSupport && currentPrice <= minResistance;
        const filteredLevels = isSupport ? supportLevels : resistanceLevels;
        const displayItems = showCurrentPrice
          ? [
              ...filteredLevels.filter((level: any) => level.y > currentPrice),
              { id: 'current-price', text: `Cu. Price=${currentPrice.toFixed(5)}`, y: currentPrice, isCurrentPrice: true },
              ...filteredLevels.filter((level: any) => level.y <= currentPrice),
            ]
          : filteredLevels;
        return (
          <Box>
            {displayItems.length > 0 ? (
              displayItems
                .sort((a: any, b: any) => b.y - a.y)
                .map((item: any, index: number) => (
                  <Box
                    key={item.id}
                    sx={{
                      fontWeight: 'bold',
                      color: item.isCurrentPrice ? '#11b3d8ff' : isSupport ? '#33ef33ff' : '#ff0000',
                      mt: index > 0 && filteredLevels.length > 0 && item.y < currentPrice && filteredLevels[index - 1]?.y >= currentPrice ? 0.2 : 0,
                      fontSize: '0.4rem',
                      lineHeight: 1
                    }}
                  >
                    {item.text}
                  </Box>
                ))
            ) : (
              <Box sx={{ fontSize: '0.4rem', lineHeight: 1 }}>No {isSupport ? 'support' : 'resistance'} levels available</Box>
            )}
          </Box>
        );
      }
      if (indicatorKey === 'Pivot Points Standard') {
        const labels = val.labels || [];
        const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
        const allLevels = labels.map((label: any) => {
          const y = parseFloat(label.text.match(/\((\d+\.?\d*)\)/)?.[1] || '0');
          return {
            text: label.text,
            y,
          };
        });
      
        const showCurrentPrice = currentPrice > 0;
        let displayItems: any[] = [
            ...allLevels.map((level: any) => ({
              ...level,
              type: level.y > currentPrice ? 'Resistance' : level.y < currentPrice ? 'Support' : 'Pivot',
            })),
            ...(showCurrentPrice ? [{ id: 'current-price', text: `Cu. Price=${currentPrice.toFixed(5)}`, y: currentPrice, isCurrentPrice: true, type: 'CurrentPrice' }] : []),
          ].sort((a: any, b: any) => b.y - a.y);
        return (
          <Box>
            {displayItems.length > 0 ? (
              displayItems.map((item: any, index: number) => (
                <Box
                  key={item.id || item.text}
                  sx={{
                    fontWeight: 'bold',
                    color: item.isCurrentPrice ? '#11b3d8ff' : item.type === 'Support' ? '#33ef33ff' : item.type === 'Pivot' ? '#ffd700' : '#ff0000',
                    mt: index > 0 && displayItems.length > 0 && item.y < currentPrice && displayItems[index - 1]?.y >= currentPrice ? 0.2 : 0,
                    fontSize: '0.4rem',
                    lineHeight: 1
                  }}
                >
                  {item.text}
                </Box>
              ))
            ) : (
              <Box sx={{ fontSize: '0.4rem', lineHeight: 1 }}>No levels available</Box>
            )}
          </Box>
        );
      }
      const relevantFields: Record<string, string[]> = {
        EMA50: ['EMA'],
        EMA200: ['EMA'],
        RSI: ['RSI', 'RSIbased_MA'],
        MACD: ['Histogram', 'MACD', 'Signal'],
        FibonacciBollingerBands: [
          '1_2', '0764_2', '0618_2', '05', '0382', '0236',
          'Plot', '0236_2', '0382_2', '05_2', '0618', '0764', '1',
        ],
        VWAP: [
          'Upper_Band_3', 'Upper_Band_2', 'Upper_Band_1', 'VWAP',
          'Lower_Band_1', 'Lower_Band_2', 'Lower_Band_3',
        ],
        BollingerBands: ['Upper', 'Basis', 'Lower'],
      };
      const fields = relevantFields[indicatorKey] || Object.keys(val);
      return (
        <Box>
          {fields.map((key) =>
            val[key] !== undefined && val[key] !== 1e100 ? (
              <Box
                key={key}
                sx={{
                  fontWeight: 'bold',
                  color:
                    indicatorKey === 'EMA50' ? '#1e90ff' :
                    indicatorKey === 'EMA200' ? '#ffd700' :
                    indicatorKey === 'RSI' ? '#ec10fbff' :
                    indicatorKey === 'MACD' && key === 'Histogram' ? '#93ed93ff' :
                    indicatorKey === 'MACD' && key === 'MACD' ? '#1e90ff' :
                    indicatorKey === 'MACD' && key === 'Signal' ? '#ff8c00' :
                    indicatorKey === 'FibonacciBollingerBands' && key === '1_2' ? '#ff0000' :
                    indicatorKey === 'FibonacciBollingerBands' && key === 'Plot' ? '#f6a4fbff' :
                    indicatorKey === 'FibonacciBollingerBands' && key === '1' ? '#a1e9a1ff' :
                    indicatorKey === 'VWAP' && key === 'VWAP' ? '#9b62f0ff' :
                    indicatorKey === 'VWAP' && key === 'Upper_Band_1' ? '#ff0000' :
                    indicatorKey === 'VWAP' && key === 'Lower_Band_1' ? '#70eb70ff' :
                    indicatorKey === 'VWAP' && key === 'Upper_Band_2' ? '#ff0000' :
                    indicatorKey === 'VWAP' && key === 'Lower_Band_2' ? '#70eb70ff' :
                    indicatorKey === 'VWAP' && key === 'Upper_Band_3' ? '#ff0000' :
                    indicatorKey === 'VWAP' && key === 'Lower_Band_3' ? '#70eb70ff' :
                    indicatorKey === 'BollingerBands' && key === 'Basis' ? '#ef2a83ff' :
                    indicatorKey === 'BollingerBands' && key === 'Upper' ? '#ff0000' :
                    indicatorKey === 'BollingerBands' && key === 'Lower' ? '#83e683ff' :
                    '#11b3d8ff',
                  fontSize: '0.4rem',
                  lineHeight: 1
                }}
              >
                {`${key}: ${formatValue(val[key], indicatorKey, subKey)}`}
              </Box>
            ) : null
          )}
        </Box>
      );
    }
    return String(val);
  };

  type IndicatorDefinition = {
    name: string;
    key: string;
    format: (val: any, key: string) => JSX.Element | string;
    color?: string | Record<string, string>;
    subKeys?: string[];
  };

  let maxResLevels = 0;
  let maxSupLevels = 0;
  if (indicators[selectedSymbol]) {
    availableTimeframes.forEach((timeframe) => {
      const timeframeData = indicators[selectedSymbol]?.[timeframe];
      if (timeframeData) {
        const pivotData = timeframeData.indicators?.['Pivot Points High Low'] || timeframeData['Pivot Points High Low'];
        if (pivotData?.processedPivotPoints) {
          const pivotPoints = pivotData.processedPivotPoints;
          const currentPrice = marketData[selectedSymbol]?.marketPrice || 3313.8;
          const levelsAbove = pivotPoints
            .filter((point: any) => parseFloat(point.value) >= currentPrice)
            .sort((a: any, b: any) => b.value - a.value);
          const levelsBelow = pivotPoints
            .filter((point: any) => parseFloat(point.value) < currentPrice)
            .sort((a: any, b: any) => b.value - a.value);
          maxResLevels = Math.max(maxResLevels, levelsAbove.length);
          maxSupLevels = Math.max(maxSupLevels, levelsBelow.length);
        }
      }
    });
  }

  const indicatorDefinitions: IndicatorDefinition[] = [
    { name: 'EMA50', key: 'EMA50', format: formatValue, color: '#1e90ff', subKeys: ['EMA'] },
    { name: 'EMA200', key: 'EMA200', format: formatValue, color: '#ffd700', subKeys: ['EMA'] },
    { name: 'RSI', key: 'RSI', format: formatValue, color: '#f535f5ff', subKeys: ['RSI', 'RSIbased_MA'] },
    {
      name: 'MACD',
      key: 'MACD',
      format: formatValue,
      color: { Histogram: '#c6f258ff', MACD: '#1e90ff', Signal: '#ff8c00' },
      subKeys: ['Histogram', 'MACD', 'Signal'],
    },
    {
      name: 'Fibonacci Bollinger Bands',
      key: 'FibonacciBollingerBands',
      format: formatValue,
      color: { '1': '#43e8eeff', Plot: '#ff00ff', '1_2': '#a2eea2ff' },
      subKeys: [
        '1_2', '0764_2', '0618_2', '05', '0382', '0236',
        'Plot', '0236_2', '0382_2', '05_2', '0618', '0764', '1',
      ],
    },
    {
      name: 'VWAP',
      key: 'VWAP',
      format: formatValue,
      color: {
        VWAP: '#9b62f0ff',
        Upper_Band_1: '#ff0000',
        Upper_Band_2: '#ff0000',
        Upper_Band_3: '#ff0000',
        Lower_Band_1: '#70eb70ff',
        Lower_Band_2: '#70eb70ff',
        Lower_Band_3: '#70eb70ff',
      },
      subKeys: [
        'Upper_Band_3', 'Upper_Band_2', 'Upper_Band_1', 'VWAP',
        'Lower_Band_1', 'Lower_Band_2', 'Lower_Band_3',
      ],
    },
    {
      name: 'Bollinger Bands',
      key: 'BollingerBands',
      format: formatValue,
      color: { Basis: '#f471acff', Upper: '#ff0000', Lower: '#84ef84ff' },
      subKeys: ['Upper', 'Basis', 'Lower'],
    },
    { name: 'Candlestick Patterns', key: 'CandlestickPatterns', format: formatValue, color: '#eaf207ff' },
    {
      name: 'Nada-Watson-LuxAlgo',
      key: 'Nadaraya-Watson-LuxAlgo',
      format: formatValue,
      color: { UpperBand: '#2eef2eff', LowerBand: '#ff0000' },
      subKeys: ['UpperBand', 'LowerBand'],
    },
    {
      name: 'SRv2 Resistance',
      key: 'SRv2 Resistance',
      format: formatValue,
      color: { Resistance: '#ff0000' },
      subKeys: Array.from({ length: 5 }, (_, i) => `Level${i + 1}`).concat('CurrentPrice').filter(subKey => {
        return availableTimeframes.some(timeframe => {
          const srv2Data = indicators[selectedSymbol]?.[timeframe]?.indicators?.['SRv2'] || indicators[selectedSymbol]?.[timeframe]?.['SRv2'];
          const labels = srv2Data?.labels || [];
          const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          const allLevels = labels
            .filter((label: any) => label && typeof label.y === 'number')
            .map((label: any) => ({
              id: label.id || `label-${Math.random()}`,
              text: label.text || (label.y <= currentPrice ? 'Support' : 'Resistance'),
              y: label.y,
              isSupport: label.text?.toLowerCase().includes('support') || label.y <= currentPrice,
            }));
          const resistanceLevels = allLevels.filter((label: any) => !label.isSupport && label.y > currentPrice).sort((a: any, b: any) => a.y - b.y);
          const index = parseInt(subKey.replace('Level', '')) - 1;
          const item = resistanceLevels[index];
          return item ? true : subKey === 'CurrentPrice' && currentPrice > 0;
        });
      }),
    },
    {
      name: 'SRv2 Support',
      key: 'SRv2 Support',
      format: formatValue,
      color: { Support: '#2eef2eff' },
      subKeys: Array.from({ length: 5 }, (_, i) => `Level${i + 1}`).filter(subKey => {
        return availableTimeframes.some(timeframe => {
          const srv2Data = indicators[selectedSymbol]?.[timeframe]?.indicators?.['SRv2'] || indicators[selectedSymbol]?.[timeframe]?.['SRv2'];
          const labels = srv2Data?.labels || [];
          const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          const allLevels = labels
            .filter((label: any) => label && typeof label.y === 'number')
            .map((label: any) => ({
              id: label.id || `label-${Math.random()}`,
              text: label.text || (label.y <= currentPrice ? 'Support' : 'Resistance'),
              y: label.y,
              isSupport: label.text?.toLowerCase().includes('support') || label.y <= currentPrice,
            }));
          const supportLevels = allLevels.filter((label: any) => label.isSupport && label.y <= currentPrice).sort((a: any, b: any) => b.y - a.y);
          const index = parseInt(subKey.replace('Level', '')) - 1;
          const item = supportLevels[index];
          return item ? true : false;
        });
      }),
    },
    {
      name: 'Pivot Points High Low',
      key: 'Pivot Points High Low',
      format: formatValue,
      color: { Resistance: '#ff0000', Support: '#008000' },
      subKeys: Array.from({ length: maxResLevels }, (_, i) => `Res${maxResLevels - i}`).concat('CurrentPrice').concat(Array.from({ length: maxSupLevels }, (_, i) => `Sup${i + 1}`)),
    },
  
    {
      name: 'Pivot Points Std Resistance',
      key: 'Pivot Points Standard Resistance',
      format: formatValue,
      color: { Resistance: '#ff0000',Pivot: '#ffd700' },
      subKeys: ['R5', 'R4', 'R3', 'R2', 'R1', ' P', 'S1', 'S2', 'S3', 'S4', 'S5', 'CurrentPrice'].filter(subKey => {
        return availableTimeframes.some(timeframe => {
          const pivotData = indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points Standard'] || indicators[selectedSymbol]?.[timeframe]?.['Pivot Points Standard'];
          const labels = pivotData?.labels || [];
          const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          if (subKey === 'CurrentPrice') return currentPrice > 0;
          const allLevels = labels.map((label: any) => {
            const y = parseFloat(label.text.match(/\((\d+\.?\d*)\)/)?.[1] || '0');
            return { text: label.text, y };
          });
          const matching = allLevels.find((item: any) => item.text.startsWith(`${subKey} (`));
          if (!matching) return false;
          return matching.y > currentPrice;
        });
      }),
    },
    {
      name: 'Pivot Points Std Support',
      key: 'Pivot Points Standard Support',
      format: formatValue,
      color: { Support: '#2eef2eff',Pivot: '#ffd700' },
      subKeys: ['R5', 'R4', 'R3', 'R2', 'R1', ' P', 'S1', 'S2', 'S3', 'S4', 'S5'].filter(subKey => {
        return availableTimeframes.some(timeframe => {
          const pivotData = indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points Standard'] || indicators[selectedSymbol]?.[timeframe]?.['Pivot Points Standard'];
          const labels = pivotData?.labels || [];
          const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
          const allLevels = labels.map((label: any) => {
            const y = parseFloat(label.text.match(/\((\d+\.?\d*)\)/)?.[1] || '0');
            return { text: label.text, y };
          });
          const matching = allLevels.find((item: any) => item.text.startsWith(`${subKey} (`));
          if (!matching) return false;
          return matching.y <= currentPrice;
        });
      }),
    },
  ];

  const filteredIndicatorDefinitions = indicatorDefinitions.filter(indicator => {
    if (viewMode === 'standard' && indicator.key === 'Pivot Points High Low') return false;
    if (viewMode === 'pivot' && indicator.key !== 'Pivot Points High Low') return false;
    const symbolData = indicators[selectedSymbol];
    if (!symbolData) return false;
    if (indicator.key === 'SRv2 Support' || indicator.key === 'SRv2 Resistance') {
      const hasSRv2Data = Object.keys(symbolData).some(timeframe => {
        const srv2Data = symbolData[timeframe]?.indicators?.['SRv2'] || symbolData[timeframe]?.['SRv2'];
        return srv2Data && Array.isArray(srv2Data.labels) && srv2Data.labels.length > 0;
      });
      return hasSRv2Data;
    }
    if (indicator.key === 'Pivot Points Standard' || indicator.key === 'Pivot Points Standard Resistance' || indicator.key === 'Pivot Points Standard Support' || indicator.key === 'Pivot Points Std') {
      const hasPivotData = Object.keys(symbolData).some(timeframe => {
        const pivotData = symbolData[timeframe]?.indicators?.['Pivot Points Standard'] || symbolData[timeframe]?.['Pivot Points Standard'];
        return pivotData && Array.isArray(pivotData.labels) && pivotData.labels.length > 0;
      });
      return hasPivotData;
    }
    return Object.keys(symbolData).some(timeframe => {
      return symbolData[timeframe]?.indicators?.[indicator.key] !== undefined ||
             symbolData[timeframe]?.[indicator.key] !== undefined;
    });
  });

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', p: 0 }}>
      <Header
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        marketData={marketData}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showBuySell={showBuySell}
        setShowBuySell={setShowBuySell}
      />
      <Container sx={{ py: 0, px: 1 }}>
        {showBuySell && (
          <Card sx={{ mb: 1, borderRadius: 2, boxShadow: 2 }}>
            <CardContent sx={{ p: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, maxWidth: 800 }}>
                  <Typography variant="h6" sx={{ color: '#4CAF50', mb: 0.5, fontWeight: 500, fontSize: '0.9rem' }}>
                    💰 Buy Levels (All Symbols)
                  </Typography>
                  <Table sx={{ minWidth: 300, '& .MuiTableCell-root': { py: 0.2, px: 0.5 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', fontSize: '0.7rem' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', fontSize: '0.7rem' }}>Symbol</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', fontSize: '0.7rem' }}>Entry Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {buySymbols.map((symbol) => {
                        const displaySymbol = symbols.find(s => s.full === symbol.symbol)?.display || symbol.symbol;
                        return (
                          <TableRow key={symbol._id}>
                            <TableCell sx={{ color: '#4CAF50', fontSize: '0.6rem' }}>Buy</TableCell>
                            <TableCell sx={{ fontSize: '0.6rem' }}>{displaySymbol}</TableCell>
                            <TableCell sx={{ fontSize: '0.6rem' }}>{symbol.entryPrice.toFixed(6)}</TableCell>
                          </TableRow>
                        );
                      })}
                      {buySymbols.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ fontSize: '0.6rem', py: 0.2 }}>
                            <Typography color="text.secondary" variant="body2">No Buy levels received</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
                <Box sx={{ flex: 1, maxWidth: 700 }}>
                  <Typography variant="h6" sx={{ color: '#F44336', mb: 0.5, fontWeight: 500, fontSize: '0.9rem' }}>
                    💰 Sell Levels (All Symbols)
                  </Typography>
                  <Table sx={{ minWidth: 300, '& .MuiTableCell-root': { py: 0.2, px: 0.5 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', fontSize: '0.7rem' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', fontSize: '0.7rem' }}>Symbol</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', fontSize: '0.7rem' }}>Entry Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sellSymbols.map((symbol) => {
                        const displaySymbol = symbols.find(s => s.full === symbol.symbol)?.display || symbol.symbol;
                        return (
                          <TableRow key={symbol._id}>
                            <TableCell sx={{ color: '#F44336', fontSize: '0.6rem' }}>Sell</TableCell>
                            <TableCell sx={{ fontSize: '0.6rem' }}>{displaySymbol}</TableCell>
                            <TableCell sx={{ fontSize: '0.6rem' }}>{symbol.entryPrice.toFixed(6)}</TableCell>
                          </TableRow>
                        );
                      })}
                      {sellSymbols.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ fontSize: '0.6rem', py: 0.2 }}>
                            <Typography color="text.secondary" variant="body2">No Sell levels received</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        <Card sx={{ mb: 1, borderRadius: 2, boxShadow: 2, width: '100%' }}>
          <CardContent sx={{ p: 0.5 }}>
            <Box sx={{ maxHeight: 'none', overflowY: 'auto', overflowX: 'auto' }}>
              <Table sx={{ minWidth: 650, tableLayout: 'fixed', '& .MuiTableCell-root': { py: 0.2, px: 0.5 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        backgroundColor: 'background.paper',
                        position: 'sticky',
                        top: 0,
                        left: 0,
                        zIndex: 3,
                        minWidth: 100,
                        borderRight: '1px solid #ccc',
                        fontSize: '0.7rem'
                      }}
                    >
                      Indicator
                    </TableCell>
                    {availableTimeframes.map((timeframe) => (
                      <TableCell
                        key={timeframe}
                        align="center"
                        sx={{
                          fontWeight: 600,
                          backgroundColor: 'background.paper',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2,
                          minWidth: 150,
                          borderRight: '1px solid #ccc',
                          fontSize: '0.7rem'
                        }}
                      >
                        {timeframeLabels[timeframe] || timeframe}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredIndicatorDefinitions.map((indicator) => {
                    const nameColor =
                      ['EMA50', 'EMA200', 'RSI', 'MACD', 'FibonacciBollingerBands', 'VWAP', 'BollingerBands', 'CandlestickPatterns', 'Nadaraya-Watson-LuxAlgo'].includes(indicator.key)
                        ? typeof indicator.color === 'string'
                          ? indicator.color
                          : indicator.color ? indicator.color[Object.keys(indicator.color)[0]] : 'inherit'
                        : indicator.key === 'SRv2 Resistance' || indicator.key === 'Pivot Points Standard Resistance'
                        ? '#ff0000'
                        : indicator.key === 'SRv2 Support' || indicator.key === 'Pivot Points Standard Support'
                        ? '#1cf01cff'
                        : indicator.key === 'Pivot Points Standard' || indicator.key === 'Pivot Points Std'
                        ? '#ffd700'
                        : 'inherit';
                    const borderColor = nameColor;
                    const thickLineIndicators = [
                      { key: 'EMA50', subKey: 'EMA' },
                      { key: 'EMA200', subKey: 'EMA' },
                      { key: 'RSI', subKey: 'RSI' },
                      { key: 'MACD', subKey: 'Histogram' },
                      { key: 'FibonacciBollingerBands', subKey: '1_2' },
                      { key: 'VWAP', subKey: 'Upper_Band_3' },
                      { key: 'BollingerBands', subKey: 'Upper' },
                      { key: 'CandlestickPatterns', subKey: null },
                      { key: 'SRv2 Resistance', subKey: 'Level1' },
                      { key: 'Pivot Points Standard Resistance', subKey: 'R5' },
                      { key: 'Pivot Points Std', subKey: 'P' },
                    ];
                    if (indicator.subKeys && indicator.subKeys.length > 0) {
                      const dynamicSubKeys = indicator.subKeys.filter(subKey => {
                        return availableTimeframes.some(timeframe => {
                          const currentValue = indicator.key === 'SRv2 Support' || indicator.key === 'SRv2 Resistance'
                            ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['SRv2'] ?? 
                              indicators[selectedSymbol]?.[timeframe]?.['SRv2']
                            : indicator.key === 'Pivot Points Standard' || indicator.key === 'Pivot Points Standard Resistance' || indicator.key === 'Pivot Points Standard Support' || indicator.key === 'Pivot Points Std'
                            ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points Standard'] ?? 
                              indicators[selectedSymbol]?.[timeframe]?.['Pivot Points Standard']
                            : indicator.key === 'Pivot Points High Low'
                            ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points High Low'] ?? 
                              indicators[selectedSymbol]?.[timeframe]?.['Pivot Points High Low']
                            : indicator.key === 'Nadaraya-Watson-LuxAlgo'
                            ? indicators[selectedSymbol]?.[timeframe]?.indicators?.[indicator.key] ?? 
                              indicators[selectedSymbol]?.[timeframe]?.[indicator.key]
                            : indicators[selectedSymbol]?.[timeframe]?.indicators?.[indicator.key] ?? 
                              indicators[selectedSymbol]?.[timeframe]?.[indicator.key];
                          if (!currentValue) return false;
                          if (indicator.key === 'Pivot Points High Low') {
                            const pivotPoints = currentValue.processedPivotPoints || [];
                            const currentPrice = marketData[selectedSymbol]?.marketPrice || 3313.8;
                            if (subKey.startsWith('Res')) {
                              const index = parseInt(subKey.replace('Res', '')) - 1;
                              const levelsAbove = pivotPoints
                                .filter((point: any) => parseFloat(point.value) >= currentPrice)
                                .sort((a: any, b: any) => b.value - a.value);
                              return index >= 0 && index < levelsAbove.length;
                            } else if (subKey.startsWith('Sup')) {
                              const index = parseInt(subKey.replace('Sup', '')) - 1;
                              const levelsBelow = pivotPoints
                                .filter((point: any) => parseFloat(point.value) < currentPrice)
                                .sort((a: any, b: any) => b.value - a.value);
                              return index >= 0 && index < levelsBelow.length;
                            } else if (subKey === 'CurrentPrice') {
                              return currentPrice > 0;
                            }
                            return false;
                          }
                          if (indicator.key === 'SRv2 Support' || indicator.key === 'SRv2 Resistance') {
                            const labels = currentValue?.labels || [];
                            const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
                            const isSupport = indicator.key === 'SRv2 Support';
                            const allLevels = labels
                              .filter((label: any) => label && typeof label.y === 'number')
                              .map((label: any) => ({
                                id: label.id || `label-${Math.random()}`,
                                text: label.text || (label.y <= currentPrice ? 'Support' : 'Resistance'),
                                y: label.y,
                                isSupport: label.text?.toLowerCase().includes('support') || label.y <= currentPrice,
                              }));
                            const filteredLevels = isSupport 
                              ? allLevels.filter((label: any) => label.isSupport && label.y <= currentPrice).sort((a: any, b: any) => b.y - a.y)
                              : allLevels.filter((label: any) => !label.isSupport && label.y > currentPrice).sort((a: any, b: any) => a.y - b.y);
                            const index = parseInt(subKey.replace('Level', '')) - 1;
                            return index >= 0 && index < filteredLevels.length || (subKey === 'CurrentPrice' && currentPrice > 0);
                          }
                          if (indicator.key === 'Pivot Points Standard' || indicator.key === 'Pivot Points Standard Resistance' || indicator.key === 'Pivot Points Standard Support' || indicator.key === 'Pivot Points Std') {
                            const labels = currentValue?.labels || [];
                            const currentPrice = marketData[selectedSymbol]?.marketPrice || 0;
                            const allLevels = labels.map((label: any) => {
                              const y = parseFloat(label.text.match(/\((\d+\.?\d*)\)/)?.[1] || '0');
                              return { text: label.text, y };
                            });
                            const filteredLevels = indicator.key === 'Pivot Points Standard Support' 
                              ? allLevels.filter((label: any) => label.y <= currentPrice)
                              : indicator.key === 'Pivot Points Std' 
                              ? allLevels.filter((label: any) => label.text.startsWith(' P ('))
                              : indicator.key === 'Pivot Points Standard' 
                              ? allLevels.filter((label: any) => label.text.startsWith(' P ('))
                              : allLevels.filter((label: any) => label.y > currentPrice);
                            const matching = filteredLevels.find((item: any) => item.text.startsWith(`${subKey} (`));
                            const value = matching ? matching.text.match(/\((\d+\.?\d*)\)/)?.[1] : null;
                            return value !== null && value !== undefined && value !== '-' || (subKey === 'CurrentPrice' && currentPrice > 0);
                          }
                          if (indicator.key === 'Nadaraya-Watson-LuxAlgo') {
                            const lines = currentValue?.lines || [];
                            return lines.length >= 2 && lines[0]?.y2 !== undefined && lines[1]?.y2 !== undefined;
                          }
                          const subValue = currentValue[subKey];
                          return subValue !== undefined && subValue !== null && subValue !== 1e100;
                        });
                      });
                      return dynamicSubKeys.map((subKey) => {
                        const subColor = typeof indicator.color === 'object' 
                          ? indicator.color[subKey] || indicator.color[subKey.startsWith('R') || subKey.startsWith('Res') ? 'Resistance' 
                            : subKey.startsWith('S') || subKey.startsWith('Sup') ? 'Support' 
                            : subKey === 'P' ? 'Pivot' : ''] || (subKey === 'CurrentPrice' ? '#11b3d8ff' : nameColor)
                          : (subKey === 'CurrentPrice' ? '#11b3d8ff' : nameColor);
                        const isThickLine = thickLineIndicators.some(
                          (item) => item.key === indicator.key && (item.subKey === subKey || (!item.subKey && !subKey))
                        );
                        const displayName = (indicator.key === 'SRv2 Resistance' || indicator.key === 'Pivot Points Standard Resistance' || indicator.key === 'Pivot Points High Low') && subKey === 'CurrentPrice' 
                          ? 'Current Price' 
                          : indicator.name;
                        return (
                          <TableRow 
                            key={`${indicator.name}-${subKey}`} 
                            sx={{ borderTop: isThickLine ? `2px solid ${borderColor}` : `1px solid ${borderColor}` }}
                          >
                            <TableCell
                              sx={{
                                fontWeight: 50,
                                color: subColor,
                                backgroundColor: 'background.paper',
                                borderRight: '1px solid #ccc',
                                fontSize: '0.7rem',
                                py: 0.2,
                                px: 0.5
                              }}
                            >
                              {displayName} {subKey !== 'CurrentPrice' ? subKey : ''}
                            </TableCell>
                            {availableTimeframes.map((timeframe) => {
                              const currentValue = indicator.key === 'SRv2 Support' || indicator.key === 'SRv2 Resistance'
                                ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['SRv2'] ?? 
                                  indicators[selectedSymbol]?.[timeframe]?.['SRv2']
                                : indicator.key === 'Pivot Points Standard' || indicator.key === 'Pivot Points Standard Resistance' || indicator.key === 'Pivot Points Standard Support' || indicator.key === 'Pivot Points Std'
                                ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points Standard'] ?? 
                                  indicators[selectedSymbol]?.[timeframe]?.['Pivot Points Standard']
                                : indicator.key === 'Pivot Points High Low'
                                ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points High Low'] ?? 
                                  indicators[selectedSymbol]?.[timeframe]?.['Pivot Points High Low']
                                : indicators[selectedSymbol]?.[timeframe]?.indicators?.[indicator.key] ?? 
                                  indicators[selectedSymbol]?.[timeframe]?.[indicator.key];
                              const subValue = currentValue ? currentValue[subKey] : undefined;
                              const hasData = subValue !== undefined && subValue !== null;
                              return (
                                <TableCell
                                  key={timeframe}
                                  align="center"
                                  sx={{
                                    fontWeight: 'bold',
                                    color: subColor,
                                    fontSize: '0.6rem',
                                    borderRight: '1px solid #ccc',
                                    py: 0.2,
                                    px: 0.5
                                  }}
                                >
                                  {hasData ? formatValue(subValue, indicator.key, subKey) : formatValue(currentValue, indicator.key, subKey)}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      });
                    } else {
                      const isThickLine = thickLineIndicators.some(
                        (item) => item.key === indicator.key && !item.subKey
                      );
                      return (
                        <TableRow 
                          key={indicator.name} 
                          sx={{ borderTop: isThickLine ? `2px solid ${borderColor}` : `1px solid ${borderColor}` }}
                        >
                          <TableCell
                            sx={{
                              fontWeight: 50,
                              color: nameColor,
                              backgroundColor: 'background.paper',
                              borderRight: '1px solid #ccc',
                              fontSize: '0.7rem',
                              py: 0.2,
                              px: 0.5
                            }}
                          >
                            {indicator.name}
                          </TableCell>
                          {availableTimeframes.map((timeframe) => {
                            const currentValue = indicator.key === 'SRv2 Support' || indicator.key === 'SRv2 Resistance'
                              ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['SRv2'] ?? 
                                indicators[selectedSymbol]?.[timeframe]?.['SRv2']
                              : indicator.key === 'Pivot Points Standard' || indicator.key === 'Pivot Points Standard Resistance' || indicator.key === 'Pivot Points Standard Support' || indicator.key === 'Pivot Points Std'
                              ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points Standard'] ?? 
                                indicators[selectedSymbol]?.[timeframe]?.['Pivot Points Standard']
                              : indicator.key === 'Pivot Points High Low'
                              ? indicators[selectedSymbol]?.[timeframe]?.indicators?.['Pivot Points High Low'] ?? 
                                indicators[selectedSymbol]?.[timeframe]?.['Pivot Points High Low']
                              : indicators[selectedSymbol]?.[timeframe]?.indicators?.[indicator.key] ?? 
                                indicators[selectedSymbol]?.[timeframe]?.[indicator.key];
                            const hasData = indicator.key === 'SRv2 Support' || indicator.key === 'SRv2 Resistance'
                              ? currentValue && Array.isArray(currentValue?.labels) && currentValue.labels.length > 0
                              : indicator.key === 'Pivot Points Standard' || indicator.key === 'Pivot Points Standard Resistance' || indicator.key === 'Pivot Points Standard Support' || indicator.key === 'Pivot Points Std'
                              ? currentValue && Array.isArray(currentValue?.labels) && currentValue.labels.length > 0
                              : indicator.key === 'Pivot Points High Low'
                              ? currentValue && Array.isArray(currentValue?.processedPivotPoints) && currentValue.processedPivotPoints.length > 0
                              : currentValue !== undefined && currentValue !== null;
                            return (
                              <TableCell
                                key={timeframe}
                                align="center"
                                sx={{
                                  fontWeight: 'bold',
                                  color:
                                    indicator.key === 'EMA50' ? '#1e90ff' :
                                    indicator.key === 'EMA200' ? '#ffd700' :
                                    indicator.key === 'RSI' ? '#f71ff7ff' :
                                    indicator.key === 'CandlestickPatterns' ? '#c6f170ff' :
                                    indicator.key === 'Nadaraya-Watson-LuxAlgo' ? '#9913ecff' :
                                    indicator.key === 'SRv2 Support' ? '#81ee42ff' :
                                    indicator.key === 'SRv2 Resistance' ? '#ff0000' :
                                    indicator.key === 'Pivot Points High Low' ? '#ff0000' :
                                    indicator.key === 'Pivot Points Standard' ? '#ffd700' :
                                    indicator.key === 'Pivot Points Std' ? '#ffd700' :
                                    indicator.key === 'Pivot Points Standard Resistance' ? '#ff0000' :
                                    indicator.key === 'Pivot Points Standard Support' ? '#30e830ff' :
                                    '#efca12ff',
                                  fontSize: '0.6rem',
                                  borderRight: '1px solid #ccc',
                                  py: 0.2,
                                  px: 0.5
                                }}
                              >
                                {hasData ? indicator.format(currentValue || {}, indicator.key) : '-'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    }
                  })}
                </TableBody>
              </Table>
            </Box>
            {!indicators[selectedSymbol] && (
              <Typography color="text.secondary" sx={{ fontSize: '0.6rem', py: 0.2 }}>Waiting for indicator data for {symbols.find(s => s.full === selectedSymbol)?.display || selectedSymbol}...</Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Dashboard;

*/