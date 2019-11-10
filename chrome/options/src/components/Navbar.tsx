import React from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";
import translate from "../translate";

const general = translate('generalOptionsPage');
const speech = translate('speechOptionsPage');
const contact = translate('contactPage');

// Links in same line to remove space between
const Navbar = () => (
  <div className="Navbar">
    <NavLink to="/general"><span>{general}</span></NavLink>
    <NavLink to="/speech"><span>{speech}</span></NavLink>
    <NavLink to="/contact" id="contactNavButton"><span>{contact}</span></NavLink>
  </div>
);

export default Navbar as React.FC;