import React, { useEffect, useState } from 'react';
import translate from '../translate';
import useStorage from '../storage';
import useVoices from '../voices';
import "./Speech.css";
import useDisabledVoices from '../voices-disabled';

export const Speech: React.FC = () => {
  return (
    <>
      <SpeedSettings />
      <VoiceSettings />
    </>
  );
};

const SpeedSettings = () => {
  const MIN = 0.5;
  const MAX = 4;
  const STEP = 0.1;
  const [speed, setSpeed] = useStorage<number>("speed");

  if(speed === undefined) {
    return null;
  }

  return (
    <div className="setting hoverable">
      <div>{translate("speedOptions")}</div>
      <input className="numberInput" type="number" min={MIN} max={MAX} step={STEP} value={speed} onChange={onChange} />
      <input className="rangeInput" type="range" min={MIN} max={MAX} step={STEP} value={speed} onChange={onChange} />
    </div>
  );

  function onChange(event: React.FormEvent<HTMLInputElement>) {
    setSpeed(Number(event.currentTarget.value));
  }
}

const VoiceSettings = () => {
  const [preferredVoice, setPreferredVoice] = useStorage("preferredVoice");
  const voices = useVoices();
  const disabledVoices = useDisabledVoices();

  if(!voices || disabledVoices === undefined) {
    return null;
  }

  return (
    <div className="setting hoverable">
    <div>{translate('ttsOptions')}</div>
    <ul className="choiceList voiceList">
      {voices.map(voice =>
        <VoiceOption
          key={voice.name}
          name={voice.name}
          lan={voice.lan}
          selected={voice.name == preferredVoice}
          disabled={disabledVoices.includes(voice.name)}
          setPreferredVoice={setPreferredVoice} />
      )}
    </ul>
  </div>
  );
}

const VoiceOption: React.FC<{
    name: string,
    lan: string,
    selected: boolean,
    disabled: boolean,
    setPreferredVoice: (value: any) => void
  }> = ({name, lan, selected, disabled, setPreferredVoice}) => {
  const classNames = [];
  classNames.push(selected ? "selected" : null);
  classNames.push(disabled ? "unavailable" : null);
  const className = classNames.filter(name => !!name).join(" ");
  return (
    <li
      className={className}
      onClick={()=> setPreferredVoice(name)}>
      <span>
          <span className="voice-name">{name}</span>
          <span className="voice-lan">{lan}</span>
      </span>
    </li>
  );
}