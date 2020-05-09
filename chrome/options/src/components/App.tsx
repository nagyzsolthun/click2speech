import React from 'react';
import { Route, Switch, Redirect, HashRouter } from 'react-router-dom';
import Header from './Header';
import Navbar from './Navbar';
import General from './General';
import Contact from './Contact';
import './App.css';
import { Speech } from './Speech';
import { createMuiTheme, ThemeProvider } from '@material-ui/core';
import createPalette from '@material-ui/core/styles/createPalette';

const palette = createPalette({
  primary: { main: "#333" },
  secondary: { main: "#4f4" }
});

const theme = createMuiTheme({
  overrides: {
    MuiTabs: {
      indicator: {
        display: "none"
      }
    },
    MuiTab: {
      textColorInherit: { opacity: 1 },
      root: {
        fontSize: 24,
        textTransform: "none",
        maxWidth: "none",
        padding: 12,
        transition: "background-color .1s linear",
        "&$selected": { backgroundColor: palette.secondary.dark },
        "&:hover": { backgroundColor: palette.secondary.main }
      }
    }
  },
  palette
});

const App = () => (
  <ThemeProvider theme={theme}>
    <HashRouter>
      <div className="app">
        <Header/>
        <Navbar/>
        <Switch>
          <Route path="/general"><General/></Route>
          <Route path="/speech"><Speech/></Route>
          <Route path="/contact"><Contact/></Route>
          <Redirect exact from="" to="/general" />
        </Switch>
      </div>
    </HashRouter>
  </ThemeProvider>
);

export default App as React.FC;
