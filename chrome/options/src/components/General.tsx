import React from 'react';
import translate from '../modules/translate';
import useStorage from '../modules/storage';
import { Checkbox, FormControlLabel, FormGroup, FormLabel, FormControl } from '@material-ui/core';

const General: React.FC = () => {

  const [hoverSelect, setHoverSelect] = useStorage<boolean>("hoverSelect");
  const [arrowSelect, setArrowSelect] = useStorage<boolean>("arrowSelect");
  const [browserSelect, setBrowserSelect] = useStorage<boolean>("browserSelect");

  const settingsLoading = [hoverSelect, arrowSelect, browserSelect].some(value => value === undefined);
  if(settingsLoading) {
    return null;
  }

  return (
    <FormControl>
      <FormLabel>{translate("selectionOptions")}</FormLabel>
      <FormGroup>
        <FormControlLabel
          control={<Checkbox
            checked={hoverSelect}
            color="primary"
            onChange={() => setHoverSelect(!hoverSelect)}
          />}
          label={translate("hoverSelect")}
        />
        <FormControlLabel
          control={<Checkbox
            checked={arrowSelect}
            color="primary"
            onChange={() => setArrowSelect(!arrowSelect)}
          />}
          label={translate("arrowSelect")}
        />
        <FormControlLabel
          control={<Checkbox
            checked={browserSelect}
            color="primary"
            onChange={() => setBrowserSelect(!browserSelect)}
          />}
          label={translate("browserSelect")}
        />
      </FormGroup>
    </FormControl>
  );
};

export default General;