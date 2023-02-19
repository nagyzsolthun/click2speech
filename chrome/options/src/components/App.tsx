import React from 'react';
import ReactDOM from 'react-dom';
import { Routes, Route, HashRouter, Navigate } from 'react-router-dom';
import { ThemeProvider, Paper, Box } from '@mui/material';
import Header from './Header';
import General from './General';
import Contact from './Contact';
import { Speech } from './Speech';
import theme from '../theme';

if (process.env.NODE_ENV !== 'production') {
  const axe = require('react-axe');
  axe(React, ReactDOM, 1000);
}

const App = () => (
  <ThemeProvider theme={theme}>
    <HashRouter>
      <Paper>
        <Header/>
        <Box role="main">
          <Routes>
            <Route path="/general" element={<General/>}/>
            <Route path="/speech" element={<Speech/>}/>
            <Route path="/contact" element={<Contact/>}/>
            <Route path="/" element={<Navigate replace to="/general" />} />
          </Routes>
        </Box>
      </Paper>
    </HashRouter>
  </ThemeProvider>
);

export default App as React.FC;
