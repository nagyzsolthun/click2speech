import React from 'react';
import logo from '../img/logo.png';
import "./Header.css";

const Header = (props: any) => (
  <div className="Header">
    <h1>click2speech</h1>
    <img src={logo} alt="logo"></img>
  </div>
);

export default Header as React.FC;