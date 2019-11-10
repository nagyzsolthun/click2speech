import React from 'react';
import translate from '../translate';

const selectionOptions = [
  { name: "hoverSelect", selected: false },
  { name: "arrowSelect", selected: false },
  { name: "browserSelect", selected: false },
];

// TODO take settings from chrome.storage, maybe use useState ?

const General = (props: any) => (
  <div className="GeneralSettings setting hoverable">
    <div>{"selectionOptions"}</div>
    <ul className="choiceList selectionList">
        {selectionOptions
          .map(option => translate(option.name))
          .map(name => <li><span>{name}</span></li>)
        }
    </ul>
  </div>
);

export default General as React.FC;