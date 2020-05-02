import React from 'react';
import { Route, Switch, Redirect, HashRouter } from 'react-router-dom';
import Header from './Header';
import Navbar from './Navbar';
import General from './General';
import Contact from './Contact';
import './App.css';
import { Speech } from './Speech';

const App = () => (
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
);

export default App as React.FC;
