import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, Button, FormControl, InputLabel, Select, MenuItem, type SelectChangeEvent } from '@mui/material';
import { Brightness4, Brightness7, Logout } from '@mui/icons-material';
import { ThemeContext } from '../main';

type HeaderProps = {
  selectedSymbol: string;
  setSelectedSymbol: (value: string) => void;
  marketData: { [symbol: string]: { marketPrice: number; volume: number } };
  viewMode: 'standard' | 'pivot';
  setViewMode: (mode: 'standard' | 'pivot') => void;
  showBuySell: boolean;
  setShowBuySell: (value: boolean) => void;
};

const Header: React.FC<HeaderProps> = ({
  selectedSymbol,
  setSelectedSymbol,
  marketData,
  viewMode,
  setViewMode,
  showBuySell,
  setShowBuySell,
}) => {
  const { toggleTheme, mode } = React.useContext(ThemeContext);
  const navigate = useNavigate();

  const symbols = [
    { full: 'VANTAGE:XAUUSD', display: 'XAUUSD' },
    { full: 'VANTAGE:GER40', display: 'GER40' },
    { full: 'VANTAGE:NAS100', display: 'NAS100' },
    { full: 'VANTAGE:BTCUSD', display: 'BTCUSD' },
    { full: 'VANTAGE:XRPUSD', display: 'XRPUSD' },
    { full: 'BINANCE:SUIUSDT', display: 'SUIUSDT' },
  ];

  const handleSymbolChange = (event: SelectChangeEvent) => {
    setSelectedSymbol(event.target.value as string);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
    window.location.reload();
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      p: 1, 
      bgcolor: mode === 'light' ? '#1e293b' : '#0f172a',
      color: '#e2e8f0',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      borderBottom: '1px solid #475569'
    }}>
      <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: '1rem', mr: 1 }}>
        MyMoneyMagnet
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1, justifyContent: 'center' }}>
        <FormControl sx={{ minWidth: 120 }} variant="outlined" size="small">
          <InputLabel id="symbol-select-label" sx={{ fontSize: '0.8rem', color: '#e2e8f0' }}>Symbol</InputLabel>
          <Select
            labelId="symbol-select-label"
            id="symbol-select"
            value={selectedSymbol}
            onChange={handleSymbolChange}
            label="Symbol"
            sx={{ fontSize: '0.8rem', color: '#e2e8f0', height: '32px', '.MuiOutlinedInput-notchedOutline': { borderColor: '#64748b' } }}
          >
            {symbols.map(({ full, display }) => (
              <MenuItem key={full} value={full} sx={{ fontSize: '0.8rem' }}>
                {display}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {marketData[selectedSymbol] && (
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
            <span style={{ color: '#facc15' }}>Symbol:{symbols.find(s => s.full === selectedSymbol)?.display || 'N/A'}</span>
            <span style={{ color: '#11b3d8ff' }}> Current Price: {marketData[selectedSymbol].marketPrice.toFixed(5)}</span>
          </Typography>
        )}
        <Button 
          variant={viewMode === 'standard' ? 'contained' : 'outlined'} 
          onClick={() => setViewMode('standard')}
          sx={{ fontSize: '0.7rem', minWidth: '80px', height: '32px', borderColor: '#64748b', color: '#e2e8f0', '&:hover': { bgcolor: mode === 'light' ? '#475569' : '#334155' } }}
        >
          Standard
        </Button>
        <Button 
          variant={viewMode === 'pivot' ? 'contained' : 'outlined'} 
          onClick={() => setViewMode('pivot')}
          sx={{ fontSize: '0.7rem', minWidth: '80px', height: '32px', borderColor: '#64748b', color: '#e2e8f0', '&:hover': { bgcolor: mode === 'light' ? '#475569' : '#334155' } }}
        >
          Pivot Points
        </Button>
        <Button 
          variant={showBuySell ? 'contained' : 'outlined'} 
          onClick={() => setShowBuySell(!showBuySell)}
          sx={{ fontSize: '0.7rem', minWidth: '80px', height: '32px', borderColor: '#64748b', color: '#e2e8f0', '&:hover': { bgcolor: mode === 'light' ? '#475569' : '#334155' } }}
        >
          {showBuySell ? 'Hide Levels' : 'Show Levels'}
        </Button>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton 
          onClick={toggleTheme} 
          sx={{ color: '#e2e8f0', p: 0.5 }}
        >
          {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
        </IconButton>
        <Button
          variant="outlined"
          sx={{ 
            fontSize: '0.7rem', 
            minWidth: '80px', 
            height: '32px', 
            color: '#e2e8f0', 
            borderColor: '#64748b',
            '&:hover': { 
              bgcolor: mode === 'light' ? '#475569' : '#334155',
              borderColor: '#94a3b8',
            }
          }}
          startIcon={<Logout fontSize="small" />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
};

export default Header;