import React from "react";
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { NavLink, useHistory } from "react-router-dom";
import translate from "../translate";

const general = translate('generalOptionsPage');
const speech = translate('speechOptionsPage');
const contact = translate('contactPage');

// Links in same line to remove space between
const Navbar = () => {
  const general = translate('generalOptionsPage');
  const speech = translate('speechOptionsPage');
  const contact = translate('contactPage');

  const history = useHistory();
  const onChange = (event: React.ChangeEvent<{}>, value: any) => {
    history.push(value)
  };

  return (
    <AppBar position="relative">
      <Tabs value={history.location.pathname} onChange={onChange} aria-label="simple tabs example">
        <Tab label={general} value="/general"/>
        <Tab label={speech} value="/speech"/>
        <Tab label={contact} value="/contact"/>
      </Tabs>
    </AppBar>
  ) 
};

export default Navbar as React.FC;