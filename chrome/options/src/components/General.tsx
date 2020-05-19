import React from 'react';
import translate from '../modules/translate';
import useStorage from '../modules/storage';
import { Checkbox, FormControlLabel, FormGroup, FormLabel, FormControl, Box, Divider, Tooltip } from '@material-ui/core';

const General: React.FC = () => {

  const [hoverSelect, setHoverSelect] = useStorage<boolean>("hoverSelect");
  const [arrowSelect, setArrowSelect] = useStorage<boolean>("arrowSelect");
  const [browserSelect, setBrowserSelect] = useStorage<boolean>("browserSelect");
  const [analytics, setAnalytics] = useStorage<boolean>("analytics");

  const settingsLoading = [hoverSelect, arrowSelect, browserSelect, analytics].some(value => value === undefined);
  if(settingsLoading) {
    return null;
  }

  return (
    <Box>
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
      <Divider/>
      <FormControl>
          <FormLabel>{translate("analytics")}</FormLabel>
          <FormGroup>
            <Tooltip title={translate("userActivityTooltip")} placement="bottom-start">
              <FormControlLabel
                control={<Checkbox
                  checked={analytics}
                  color="primary"
                  onChange={() => {setAnalytics(!analytics)}}
                />}
                label={translate("userActivity")}
              />
            </Tooltip>
          </FormGroup>
      </FormControl>
    </Box>
  );
};

export default General;