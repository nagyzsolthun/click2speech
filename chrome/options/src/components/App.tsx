import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Switch, Redirect, HashRouter } from 'react-router-dom';
import { ThemeProvider, Paper, Box } from '@material-ui/core';
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
          <Switch>
            <Route path="/general"><General/></Route>
            <Route path="/speech"><Speech/></Route>
            <Route path="/contact"><Contact/></Route>
            <Redirect exact from="" to="/general" />
          </Switch>
        </Box>
      </Paper>
    </HashRouter>
  </ThemeProvider>
);

export default App as React.FC;
