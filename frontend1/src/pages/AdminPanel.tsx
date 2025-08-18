import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Tabs, Tab } from '@mui/material';
import Header from '../components/Header';
import BuySellLevels from './buy-sell';
import IndicatorSettings from './IndicatorSettings';
import EmissionSettings from './EmissionSettings';

const AdminPanel: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>('Indicator Settings');
  const navigate = useNavigate();

  const groupColors: { [key: string]: string } = {
    'Indicator Settings': '#c018b2ff',
    'Emission Settings': '#dfbe08ff',
    'Buy/Sell Levels': '#12ddebff'
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
  };

  if (localStorage.getItem('accessType') !== 'admin-access') {
    navigate('/login');
    return null;
  }

  return (
    <>
      <Header selectedSymbol={''} setSelectedSymbol={function (_value: string): void {
        throw new Error('Function not implemented.');
      } } marketData={{}} viewMode={'standard'} setViewMode={function (_mode: 'standard' | 'pivot'): void {
        throw new Error('Function not implemented.');
      } } showBuySell={false} setShowBuySell={function (_value: boolean): void {
        throw new Error('Function not implemented.');
      } } />
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', bgcolor: 'background.default', minHeight: '100vh' }}>
        <Card sx={{ width: '100%', maxWidth: 1200, boxShadow: 6, borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography 
              variant="h4" 
              gutterBottom 
              color="text.primary" 
              fontWeight="bold" 
              sx={{ mb: 4, textAlign: 'center' }}
            >
              Admin Panel - Settings
            </Typography>

            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              sx={{ 
                mb: 4, 
                '.MuiTabs-indicator': { 
                  backgroundColor: groupColors[selectedTab], 
                  height: 4 
                }
              }}
              variant="fullWidth"
              centered
            >
              {Object.keys(groupColors).map(group => (
                <Tab
                  key={group}
                  label={group}
                  value={group}
                  sx={{
                    bgcolor: selectedTab === group ? groupColors[group] : (theme => theme.palette.mode === 'dark' ? '#424242' : '#f5f5f5'),
                    color: selectedTab === group ? (theme => theme.palette.getContrastText(groupColors[group])) : (theme => theme.palette.text.primary),
                    textTransform: 'none',
                    fontSize: '1.1rem', // Increased font size
                    fontWeight: selectedTab === group ? 'bold' : 'medium',
                    py: 2, // Increased padding for taller tabs
                    borderRadius: 2, // Rounded corners
                    mx: 0.5, // Small margin between tabs
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: selectedTab === group ? groupColors[group] : (theme => theme.palette.mode === 'dark' ? '#616161' : '#e0e0e0'),
                      transform: 'scale(1.02)', // Slight scale effect on hover
                    }
                  }}
                />
              ))}
            </Tabs>

            {selectedTab === 'Indicator Settings' && <IndicatorSettings />}
            {selectedTab === 'Emission Settings' && <EmissionSettings />}
            {selectedTab === 'Buy/Sell Levels' && <BuySellLevels 
              symbols={[]} 
              setError={function (): void {
                throw new Error('Function not implemented.');
              }} 
              setSuccess={function (): void {
                throw new Error('Function not implemented.');
              }}
            />}
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default AdminPanel;