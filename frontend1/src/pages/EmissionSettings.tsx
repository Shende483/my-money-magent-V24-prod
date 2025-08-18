






import React, { useState } from 'react';
import { Box, Card, CardHeader, CardContent, Typography, Grid, FormControlLabel, Checkbox, TextField, Button, Alert, CircularProgress, Snackbar } from '@mui/material';
import axios from 'axios';

interface EmissionParameters {
  symbol: string;
  enabledIndicators: string[];
  enabledTimeframes: string[];
}

const EmissionSettings: React.FC = () => {
  const [emissionSettings, setEmissionSettings] = useState<EmissionParameters[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [symbol, setSymbol] = useState('');

  const symbols: string[] = ['VANTAGE:BTCUSD', 'VANTAGE:XAUUSD', 'VANTAGE:GER40', 'VANTAGE:NAS100','VANTAGE:XRPUSD',
    'BINANCE:SUIUSDT'];
  const timeframes: string[] = ['15', '60', '240', '1D', '1W'];
  const indicators: string[] = [
    'EMA50', 'EMA200', 'RSI', 'MACD', 'FibonacciBollingerBands', 'VWAP', 'BollingerBands', 'CandlestickPatterns',
    'Nadaraya-Watson-LuxAlgo', 'SRv2', 'Pivot Points High Low', 'Pivot Points Standard'
  ];
  const groupColors: { [key: string]: string } = {
    'Emission Settings': '#607D8B'
  };

  const timeframeLabels: { [key: string]: string } = {
    '15': '15m',
    '60': '1h',
    '240': '4h',
    '1D': '1D',
    '1W': '1W'
  };

  // Helper function to extract symbol part for display
  const getDisplaySymbol = (fullSymbol: string): string => {
    return fullSymbol.split(':').pop() || fullSymbol;
  };

  const fetchSettings = async () => {
    if (!symbols.includes(symbol)) {
      setError('Please select a valid symbol.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/indicators/emission-settings`, {
        params: { symbol }
      });

      const emissionData = Array.isArray(response.data)
        ? response.data
        : response.data ? [response.data] : [{ symbol, enabledIndicators: indicators, enabledTimeframes: timeframes }];
      setEmissionSettings(emissionData);
      setError('');
      setSuccess('');
    } catch (err) {
      setError('Failed to fetch emission settings.');
      console.error('Fetch emission settings failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmissionInputChange = (index: number, field: keyof EmissionParameters, value: string, checked?: boolean) => {
    setEmissionSettings(prev => {
      if (!prev) return prev;
      const updated = [...prev];
      if (field === 'enabledIndicators' || field === 'enabledTimeframes') {
        const current = updated[index][field];
        const newValue = checked
          ? [...current, value]
          : current.filter(item => item !== value);
        updated[index] = { ...updated[index], [field]: newValue };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
    setError('');
  };

  const handleSave = async () => {
    if (!emissionSettings) {
      setError('Settings are not initialized.');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(emissionSettings.map(setting =>
        axios.post(`${import.meta.env.VITE_API_URL}/indicators/emission-settings`, setting)
      ));
      setSuccess('Emission settings saved successfully');
      setError('');
    } catch (err) {
      setError('Failed to save settings: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => setSuccess('');

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
          {symbols.map((sym) => (
            <option key={sym} value={sym}>{getDisplaySymbol(sym)}</option>
          ))}
        </TextField>
        <Button
          variant="contained"
          color="primary"
          onClick={fetchSettings}
          disabled={loading || !symbol}
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

      {emissionSettings.length > 0 && emissionSettings.map((setting, index) => {
        const key = setting.symbol;
        return (
          <Card key={`emission-${key}`} sx={{ mb: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardHeader
              title={`Emission Settings: ${getDisplaySymbol(setting.symbol)}`}
              sx={{
                bgcolor: groupColors['Emission Settings'],
                color: theme => theme.palette.getContrastText(groupColors['Emission Settings']),
                '& .MuiCardHeader-title': { fontWeight: 'bold', fontSize: '1.25rem' }
              }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid component="div" item xs={12} {...({} as any)}>
                  <Typography variant="subtitle1" fontWeight="bold">Enabled Indicators:</Typography>
                  <Grid container spacing={2}>
                    {indicators.map((indicator) => (
                      <Grid component="div" item xs={12} sm={3} key={indicator} {...({} as any)}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={setting.enabledIndicators.includes(indicator)}
                              onChange={(e) => handleEmissionInputChange(index, 'enabledIndicators', indicator, e.target.checked)}
                            />
                          }
                          label={indicator}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
                <Grid component="div" item xs={12} {...({} as any)}>
                  <Typography variant="subtitle1" fontWeight="bold">Enabled Timeframes:</Typography>
                  <Grid container spacing={2}>
                    {timeframes.map((tf) => (
                      <Grid component="div" item xs={12} sm={3} key={tf} {...({} as any)}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={setting.enabledTimeframes.includes(tf)}
                              onChange={(e) => handleEmissionInputChange(index, 'enabledTimeframes', tf, e.target.checked)}
                            />
                          }
                          label={timeframeLabels[tf] || tf}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={saving || !emissionSettings.length}
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

export default EmissionSettings;

