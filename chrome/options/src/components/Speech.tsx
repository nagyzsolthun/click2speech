import React from 'react';
import { Divider, Box, Typography, Slider, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Link, makeStyles } from '@mui/material';
import theme from '../theme';
import translate from '../modules/translate';
import useStorage from '../modules/storage';
import useVoices from '../modules/tts';
import useDisabledVoices from '../modules/voices-disabled';

export const Speech: React.FC = () => {
  return (
    <Box>
      <SpeedSettings/>
      <Divider />
      <VoiceSettings />
    </Box>
  );
};

const SpeedSettings = () => {
  const [speed, setSpeed] = useStorage<number>("speed");
  if(speed === undefined) {
    return null;
  }
  return (
    <FormControl>
      <FormLabel>{translate("speedOptions")}</FormLabel>
      <Slider
        aria-label="speed"
        defaultValue={speed}
        step={0.1}
        min={0.5}
        max={4}
        valueLabelDisplay="auto"
        onChange={(_,value) => setSpeed(value as number)}
      />
    </FormControl>
  );
}

const VoiceSettings = () => {
  const voices = useVoices();
  const disabledVoices = useDisabledVoices();
  if(voices === undefined || disabledVoices === undefined) {
    return null;
  }

  return (
    <FormControl>
      <FormLabel>{translate("ttsOptions")}</FormLabel>
      {voices.length ? <VoiceRadioGroup voices={voices} disabledVoices={disabledVoices}/> : <VoiceError/>}
    </FormControl>
  );
}

const VoiceError = () => {
  const readmeUrl = "https://github.com/nagyzsolthun/click2speech/blob/master/README.md";
  return (
    <>
      <Typography sx={alertStyle}>no voice available</Typography>
      <Link href={readmeUrl} target="_blank" rel="noopener">{readmeUrl}</Link>
    </>
  )
}

const VoiceRadioGroup: React.FC<{
  voices: {name: string, lan:string }[],
  disabledVoices: string[]
}> = ({ voices, disabledVoices }) => {
  const [preferredVoice, setPreferredVoice] = useStorage("preferredVoice");

  return (
    <RadioGroup aria-label="voice" name="voice" value={preferredVoice || ""} onChange={(event) => setPreferredVoice(event.target.value)}>
      {voices.map(voice =>
        <FormControlLabel
          key={voice.name}
          value={voice.name}
          aria-label={voice.name}
          control={<Radio color="primary"/>}
          label={
            <>
              <Typography sx={voiceNameStyle}>{voice.name}</Typography>
              <Typography sx={voiceLanStyle}>{voice.lan}</Typography>
            </>
          }
          disabled={disabledVoices.includes(voice.name)}
        />)}
    </RadioGroup>
  )
};

const voiceNameStyle = {
  display: "inline"
};

const voiceLanStyle = {
  display: "inline",
  fontSize: "0.9em",
  color: theme.palette.action.active,
  marginLeft: 1
};

const alertStyle = {
  color: theme.palette.error.main,
};