import React from 'react';
import translate from '../translate';
import useStorage from '../storage';

interface SettingProps extends React.HTMLAttributes<HTMLLIElement> {
  available?: boolean,
  selected?: boolean
}

const Setting: React.FC<SettingProps> =
({children, available = true, selected = false, ...props}) => {

  const classes: string[] = [];
  if(!available) {
    classes.push("unavailable")
  }

  if(selected) {
    classes.push("selected");
  }

  return (
    <li className={classes.join(' ')} {...props}><span>{children}</span></li>
  );
}

const General: React.FC = () => {

  const [hoverSelect, setHoverSelect] = useStorage<boolean>("hoverSelect");
  const [arrowSelect, setArrowSelect] = useStorage<boolean>("arrowSelect");
  const [browserSelect, setBrowserSelect] = useStorage<boolean>("browserSelect");

  return (
    <div className="GeneralSettings setting hoverable">
      <div>{"selectionOptions"}</div>
      <ul className="choiceList selectionList">
        <Setting selected={hoverSelect} onClick={() => setHoverSelect(!hoverSelect)}>{translate("hoverSelect")}</Setting>
        <Setting selected={arrowSelect} onClick={() => setArrowSelect(!arrowSelect)}>{translate("arrowSelect")}</Setting>
        <Setting selected={browserSelect} onClick={() => setBrowserSelect(!browserSelect)}>{translate("browserSelect")}</Setting>
      </ul>
    </div>
  );
};

export default General;