import React from 'react';
import translate from '../translate';
import useStorage from '../storage';

interface ChechboxProps extends React.HTMLAttributes<HTMLLIElement> {
  selected?: boolean
}

const Checkbox: React.FC<ChechboxProps> =
({children, selected, ...props}) => {

  const classes: string[] = [];
  if(selected === undefined) {
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
        <Checkbox selected={hoverSelect} onClick={() => setHoverSelect(!hoverSelect)}>{translate("hoverSelect")}</Checkbox>
        <Checkbox selected={arrowSelect} onClick={() => setArrowSelect(!arrowSelect)}>{translate("arrowSelect")}</Checkbox>
        <Checkbox selected={browserSelect} onClick={() => setBrowserSelect(!browserSelect)}>{translate("browserSelect")}</Checkbox>
      </ul>
    </div>
  );
};

export default General;