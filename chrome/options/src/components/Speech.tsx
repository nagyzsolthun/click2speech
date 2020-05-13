import React from 'react';
import { Divider, Box, Typography, Slider, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, makeStyles } from '@material-ui/core';
import translate from '../translate';
import useStorage from '../storage';
import useVoices from '../voices';
import useDisabledVoices from '../voices-disabled';
import theme from '../theme';

export const Speech: React.FC = () => {
  return (
    <Box>
      <SpeedSettings/>
      <Divider />
      <VoiceSettings />
    </Box>
  );
};

const useVoiceNameStyle = makeStyles({
  root: {
    display: "inline"
  }
});

const useVoiceLanStyle = makeStyles({ root: {
  display: "inline",
  fontSize: "0.9em",
  color: theme.palette.action.active,
  marginLeft: 8
}})

const SpeedSettings = () => {
  const [speed, setSpeed] = useStorage<number>("speed");
  if(speed === undefined) {
    return null;
  }
  return (
    <FormControl>
      <FormLabel>{translate("speedOptions")}</FormLabel>
      <Typography>{speed.toFixed(1)}</Typography>
      <Slider
        aria-label="speed"
        defaultValue={1}
        step={0.1}
        min={0.5}
        max={4}
        onChange={(_,value) => setSpeed(value as number)}
      />
    </FormControl>
  );
}

const VoiceSettings = () => {
  const [preferredVoice, setPreferredVoice] = useStorage("preferredVoice");
  const voices = useVoices();
  const disabledVoices = useDisabledVoices();

  const voiceNameClasses = useVoiceNameStyle();
  const voiceLanClasses = useVoiceLanStyle();

  if(!voices || disabledVoices === undefined) {
    return null;
  }

  return (
    <FormControl>
      <FormLabel>{translate("ttsOptions")}</FormLabel>
      <RadioGroup aria-label="voice" name="voice" value={preferredVoice} onChange={(event) => setPreferredVoice(event.target.value)}>
        {voices.map(voice =>
          <FormControlLabel
            key={voice.name}
            value={voice.name}
            aria-label={voice.name}
            control={<Radio color="primary"/>}
            label={
              <>
                <Typography classes={voiceNameClasses}>{voice.name}</Typography>
                <Typography classes={voiceLanClasses}>{voice.lan}</Typography>
              </>
            }
            disabled={disabledVoices.includes(voice.name)}
         />)}
      </RadioGroup>
    </FormControl>
  );
}