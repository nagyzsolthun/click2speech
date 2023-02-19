import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppBar, Tabs, Tab, Toolbar, Typography } from "@mui/material";
import translate from "../modules/translate";

const logoStyle = {
  height: 64,
  margin: 4
}

const Navbar: React.FC = () => {
  const general = translate('generalOptionsPage');
  const speech = translate('speechOptionsPage');
  const contact = translate('contactPage');

  const navigate = useNavigate();
  const location = useLocation();
  const onChange = (_: React.ChangeEvent<{}>, value: any) => navigate(value);

  // redirect
  const pathName = location.pathname;
  if(pathName === "/") {
    return null;
  }

  return (
    <AppBar position="relative">
      <Toolbar>
        <Typography variant="h1">click2speech</Typography>
        <img style={logoStyle} src={process.env.PUBLIC_URL + "/logo.svg"} alt="logo" />
      </Toolbar>
      <Tabs value={pathName} onChange={onChange} aria-label="simple tabs example">
        <Tab label={general} value="/general"/>
        <Tab label={speech} value="/speech"/>
        <Tab label={contact} value="/contact" sx={{ marginLeft: "auto"}}/>
      </Tabs>
    </AppBar>
  ) 
};

export default Navbar;