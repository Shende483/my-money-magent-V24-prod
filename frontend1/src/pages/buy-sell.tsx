
import React, { useState, useEffect } from 'react';
import { Box, Card, CardHeader, Typography, Grid, TextField, Button, CircularProgress, CardContent } from '@mui/material';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

interface Symbol {
  _id: string;
  symbol: string;
  entryPrice: number;
  side: 'long' | 'short';
}

interface BuySellLevelsProps {
  symbols: string[];
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
}

const BuySellLevels: React.FC<BuySellLevelsProps> = ({ symbols, setError, setSuccess }) => {
  const [buySellSymbols, setBuySellSymbols] = useState<Symbol[]>([]);
  const [newLongSymbol, setNewLongSymbol] = useState('');
  const [newLongPrice, setNewLongPrice] = useState('');
  const [newShortSymbol, setNewShortSymbol] = useState('');
  const [newShortPrice, setNewShortPrice] = useState('');
  const [editSymbol, setEditSymbol] = useState<Symbol | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const [updateSaving, setUpdateSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [, setSocket] = useState<Socket | null>(null);

  const vantageSymbols = [
    'VANTAGE:XAUUSD', 'VANTAGE:GER40', 'VANTAGE:NAS100','VANTAGE:BTCUSD', 'VANTAGE:XRPUSD',
    'BINANCE:SUIUSDT',
  ];

  const displaySymbol = (symbol: string) => symbol.replace('VANTAGE:', '').replace('BINANCE:', '');

  const validateBuySellInput = (symbol: string, entryPrice: string, side: string): string | null => {
    if (!symbols.includes(symbol) && !vantageSymbols.includes(symbol)) {
      return 'Symbol must be one of: ' + vantageSymbols.map(displaySymbol).join(', ');
    }
    const price = Number(entryPrice);
    if (isNaN(price) || price <= 0) {
      return 'Entry price must be a positive number';
    }
    if (side !== 'long' && side !== 'short') {
      return 'Side must be either long or short';
    }
    return null;
  };

  const fetchSymbols = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/symbols`);
    //  console.log('Fetch symbols response:', response.data);
      if (response.data.success && Array.isArray(response.data.symbols)) {
        setBuySellSymbols(response.data.symbols);
      //  console.log('buySellSymbols updated:', response.data.symbols);
        setError('');
      } else {
        setError('Invalid response format');
      //  console.error('fetchSymbols: response.data.symbols is not an array', response.data);
        setBuySellSymbols([]);
      }
    } catch (err) {
      setError('Failed to fetch symbols: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error('Fetch symbols failed:', err);
      setBuySellSymbols([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSymbol = async (symbol: string, entryPrice: string, side: 'long' | 'short') => {
    const validationError = validateBuySellInput(symbol, entryPrice, side);
    if (validationError) {
      setError(validationError);
      setSuccess('');
      return;
    }
    setAddSaving(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/symbols`, {
        symbol,
        entryPrice: Number(entryPrice),
        side
      });
      console.log('Add symbol response:', response.data);
      setSuccess(`Symbol ${displaySymbol(symbol)} (${side}) added successfully`);
      setError('');
      if (side === 'long') {
        setNewLongSymbol('');
        setNewLongPrice('');
      } else {
        setNewShortSymbol('');
        setNewShortPrice('');
      }
      setRefreshKey(prev => prev + 1);
      await fetchSymbols();
    } catch (err) {
      setError('Failed to add symbol: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error('Add symbol failed:', err);
    } finally {
      setAddSaving(false);
    }
  };

  const handleUpdateSymbol = async (id: string, symbol: string, entryPrice: string, side: 'long' | 'short') => {
    const validationError = validateBuySellInput(symbol, entryPrice, side);
    if (validationError) {
      setError(validationError);
      setSuccess('');
      return;
    }
    setUpdateSaving(true);
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/symbols/${id}`, {
        symbol,
        entryPrice: Number(entryPrice),
        side
      });
      console.log('Update response:', response.data);
      setSuccess(`Symbol ${displaySymbol(symbol)} (${side}) updated successfully`);
      setError('');
      setEditSymbol(null);
      setRefreshKey(prev => prev + 1);
      await fetchSymbols();
    } catch (err) {
      setError('Failed to update symbol: ' + (err instanceof Error ? err.message : 'Unknown error'));
     // console.error('Update symbol failed:', err);
    } finally {
      setUpdateSaving(false);
    }
  };

  const handleDeleteSymbol = async (id: string, symbol: string, side: 'long' | 'short') => {
    setUpdateSaving(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/symbols/${id}`);
    //  console.log('Delete symbol success:', { id, symbol, side });
      setSuccess(`Symbol ${displaySymbol(symbol)} (${side}) deleted successfully`);
      setError('');
      setRefreshKey(prev => prev + 1);
      await fetchSymbols();
    } catch (err) {
      setError('Failed to delete symbol: ' + (err instanceof Error ? err.message : 'Unknown error'));
    //  console.error('Delete symbol failed:', err);
    } finally {
      setUpdateSaving(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const newSocket = io(`${import.meta.env.VITE_API_URL}`, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
     // console.log(`[${new Date().toISOString()}] ✅ Connected to WebSocket server: ${newSocket.id}`);
    });

    newSocket.on('live-data-all', (data: any) => {
    //  console.log(`[${new Date().toISOString()}] Received live-data-all:`, JSON.stringify(data, null, 2));
      if (data.symbols && Array.isArray(data.symbols)) {
        setBuySellSymbols(data.symbols);
       // console.log('buySellSymbols updated via WebSocket:', data.symbols);
      }
    });

    newSocket.on('disconnect', () => {
     // console.log(`[${new Date().toISOString()}] ❌ Disconnected from WebSocket server`);
    });

    newSocket.on('connect_error', () => {
    //  console.error(`[${new Date().toISOString()}] WebSocket connection error: ${error.message}`);
    });

    setSocket(newSocket);
    fetchSymbols();

    return () => {
      newSocket.disconnect();
    };
  }, [refreshKey]);

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Card sx={{ flex: 1, mb: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <CardHeader
          title="Buy Levels"
          sx={{
            bgcolor: '#4CAF50',
            color: theme => theme.palette.getContrastText('#4CAF50'),
            '& .MuiCardHeader-title': { fontWeight: 'bold', fontSize: '1.25rem' }
          }}
        />
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={5} {...({} as any)}>
              <TextField
                fullWidth
                size="small"
                select
                SelectProps={{ native: true }}
                value={newLongSymbol}
                onChange={(e) => setNewLongSymbol(e.target.value)}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              >
                <option value="">Select Symbol</option>
                {vantageSymbols.map((sym) => (
                  <option key={sym} value={sym}>{displaySymbol(sym)}</option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={5}  {...({} as any)}>
              <TextField
                fullWidth
                label="Entry Price"
                size="small"
                type="number"
                value={newLongPrice}
                onChange={(e) => setNewLongPrice(e.target.value)}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={2}  {...({} as any)}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => handleAddSymbol(newLongSymbol, newLongPrice, 'long')}
                disabled={addSaving || !newLongSymbol || !newLongPrice}
              >
                {addSaving ? <CircularProgress size={24} /> : 'Add'}
              </Button>
            </Grid>
          </Grid>
          {loading ? (
            <CircularProgress />
          ) : (
            buySellSymbols.filter(s => s.side === 'long').map((symbol) => (
              <Box key={symbol._id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                {editSymbol?._id === symbol._id ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={5} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Symbol"
                        size="small"
                        select
                        SelectProps={{ native: true }}
                        value={editSymbol.symbol}
                        onChange={(e) => setEditSymbol({ ...editSymbol, symbol: e.target.value })}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      >
                        <option value="">Select Symbol</option>
                        {vantageSymbols.map((sym) => (
                          <option key={sym} value={sym}>{displaySymbol(sym)}</option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={5} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Entry Price"
                        size="small"
                        type="number"
                        value={editSymbol.entryPrice}
                        onChange={(e) => setEditSymbol({ ...editSymbol, entryPrice: Number(e.target.value) })}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ step: '0.01' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2} {...({} as any)}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={() => handleUpdateSymbol(symbol._id, editSymbol.symbol, editSymbol.entryPrice.toString(), 'long')}
                        disabled={updateSaving}
                      >
                        {updateSaving ? <CircularProgress size={24} /> : 'Save'}
                      </Button>
                    </Grid>
                  </Grid>
                ) : (
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5} {...({} as any)}>
                      <Typography>{displaySymbol(symbol.symbol)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3} {...({} as any)}>
                      <Typography>Price: {symbol.entryPrice}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2} {...({} as any)}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => setEditSymbol(symbol)}
                      >
                        Edit
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={2} {...({} as any)}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteSymbol(symbol._id, symbol.symbol, 'long')}
                        disabled={updateSaving}
                      >
                        Delete
                      </Button>
                    </Grid>
                  </Grid>
                )}
              </Box>
            ))
          )}
        </CardContent>
      </Card>
      <Card sx={{ flex: 1, mb: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <CardHeader
          title="Sell Levels"
          sx={{
            bgcolor: '#F44336',
            color: theme => theme.palette.getContrastText('#F44336'),
            '& .MuiCardHeader-title': { fontWeight: 'bold', fontSize: '1.25rem' }
          }}
        />
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={5} {...({} as any)}>
              <TextField
                fullWidth
                size="small"
                select
                SelectProps={{ native: true }}
                value={newShortSymbol}
                onChange={(e) => setNewShortSymbol(e.target.value)}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
              >
                <option value="">Select Symbol</option>
                {vantageSymbols.map((sym) => (
                  <option key={sym} value={sym}>{displaySymbol(sym)}</option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={5} {...({} as any)}>
              <TextField
                fullWidth
                label="Entry Price"
                size="small"
                type="number"
                value={newShortPrice}
                onChange={(e) => setNewShortPrice(e.target.value)}
                InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                inputProps={{ step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} sm={2} {...({} as any)}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => handleAddSymbol(newShortSymbol, newShortPrice, 'short')}
                disabled={addSaving || !newShortSymbol || !newShortPrice}
              >
                {addSaving ? <CircularProgress size={24} /> : 'Add'}
              </Button>
            </Grid>
          </Grid>
          {loading ? (
            <CircularProgress />
          ) : (
            buySellSymbols.filter(s => s.side === 'short').map((symbol) => (
              <Box key={symbol._id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                {editSymbol?._id === symbol._id ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={5} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Symbol"
                        size="small"
                        select
                        SelectProps={{ native: true }}
                        value={editSymbol.symbol}
                        onChange={(e) => setEditSymbol({ ...editSymbol, symbol: e.target.value })}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                      >
                        <option value="">Select Symbol</option>
                        {vantageSymbols.map((sym) => (
                          <option key={sym} value={sym}>{displaySymbol(sym)}</option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={5} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Entry Price"
                        size="small"
                        type="number"
                        value={editSymbol.entryPrice}
                        onChange={(e) => setEditSymbol({ ...editSymbol, entryPrice: Number(e.target.value) })}
                        InputLabelProps={{ sx: { fontWeight: 'bold' } }}
                        inputProps={{ step: '0.01' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2} {...({} as any)}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={() => handleUpdateSymbol(symbol._id, editSymbol.symbol, editSymbol.entryPrice.toString(), 'short')}
                        disabled={updateSaving}
                      >
                        {updateSaving ? <CircularProgress size={24} /> : 'Save'}
                      </Button>
                    </Grid>
                  </Grid>
                ) : (
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5} {...({} as any)}>
                      <Typography>{displaySymbol(symbol.symbol)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3} {...({} as any)}>
                      <Typography>Price: {symbol.entryPrice}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2} {...({} as any)}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => setEditSymbol(symbol)}
                      >
                        Edit
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={2} {...({} as any)}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteSymbol(symbol._id, symbol.symbol, 'short')}
                        disabled={updateSaving}
                      >
                        Delete
                      </Button>
                    </Grid>
                  </Grid>
                )}
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default BuySellLevels;

