

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, TextField, Button, FormControl, InputLabel, OutlinedInput, InputAdornment, IconButton, Alert } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import Header from '../components/Header';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check localStorage for accessType on component mount
  useEffect(() => {
    const accessType = localStorage.getItem('accessType');
    if (accessType === 'user-access') {
      navigate('/dashboard');
    } else if (accessType === 'admin-access') {
      navigate('/admin');
    }
  }, [navigate]);

  const handleSubmit = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, { email, password });
      const accessType = response.data.user.access; // Assuming backend returns { access: "user-access" or "admin-access" }
      setError('');
   //   console.log("we recrr", accessType);
      localStorage.setItem('accessType', accessType); // Store access type
      if (accessType === 'user-access') {
        navigate('/dashboard');
      } else if (accessType === 'admin-access') {
        navigate('/admin');
      } else {
        setError('Invalid Credentials.');
      }
    } catch (error) {
      setError('Invalid email or password.');
      console.error('Login failed:', error);
    }
  };

  return (
    <>
      <Header selectedSymbol={''} setSelectedSymbol={function (_value: string): void {
        throw new Error('Function not implemented.');
      } } marketData={{}} viewMode={'standard'} setViewMode={function (_mode: 'standard' | 'pivot'): void {
        throw new Error('Function not implemented.');
      } } showBuySell={false} setShowBuySell={function (_value: boolean): void {
        throw new Error('Function not implemented.');
      } } />
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', bgcolor: 'background.default', minHeight: '100vh' }}>
        <Card sx={{ maxWidth: 400, width: '100%', maxHeight: 400, overflow: 'auto' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom color="text.primary">
              Login Page
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 1.5 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ mb: 1 }}>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 1.5 }}
              />
              <FormControl fullWidth variant="outlined">
                <InputLabel>Password</InputLabel>
                <OutlinedInput
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Password"
                />
              </FormControl>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                sx={{ mt: 1.5 }}
              >
                Login
              </Button>
            </Box>
            <Box component="nav" sx={{ mb: 1 }}>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default Login;

