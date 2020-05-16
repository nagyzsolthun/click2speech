import React from "react";
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { useHistory } from "react-router-dom";
import { Toolbar, Typography, makeStyles } from "@material-ui/core";
import translate from "../modules/translate";

const logoStyle = {
  height: 64,
  margin: 4
}
const useRightAlignStyle = makeStyles({
  root: {
    marginLeft: "auto"
  }
});

const Navbar: React.FC = () => {
  const general = translate('generalOptionsPage');
  const speech = translate('speechOptionsPage');
  const contact = translate('contactPage');

  const rightAlignClasses = useRightAlignStyle();

  const history = useHistory();
  const onChange = (_: React.ChangeEvent<{}>, value: any) => history.push(value);

  // redirect
  const pathName = history.location.pathname;
  if(pathName === "/") {
    return null;
  }

  return (
    <AppBar position="relative">
      <Toolbar>
        <Typography variant="h5">click2speech</Typography>
        <img style={logoStyle} src={process.env.PUBLIC_URL + "/logo.svg"} alt="logo" />
      </Toolbar>
      <Tabs value={pathName} onChange={onChange} aria-label="simple tabs example">
        <Tab label={general} value="/general"/>
        <Tab label={speech} value="/speech"/>
        <Tab label={contact} value="/contact" classes={rightAlignClasses}/>
      </Tabs>
    </AppBar>
  ) 
};

export default Navbar;