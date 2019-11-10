import React from 'react';
import { Route, Switch, Router, Redirect } from 'react-router-dom';
import Header from './Header';
import Navbar from './Navbar';
import General from './General';
import './App.css';
import { createBrowserHistory } from 'history';

const history = createBrowserHistory();

const App = () => (
  <Router history={history}>
    <div className="app">
      <Header/>
      <Navbar/>
      <Switch>
        <Route path="/general"><General/></Route>
        <Redirect exact from="/" to="/general" />
      </Switch>
    </div>
  </Router>
);

export default App as React.FC;
