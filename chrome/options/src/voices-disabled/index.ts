import useDisabledVoicesDev from "./voices-disabled-dev";
import useDisabledVoicesProd from "./voices-disabled-prod";

const env = process.env.NODE_ENV;
const useDisabledVoices = (env === "production") ? useDisabledVoicesProd : useDisabledVoicesDev;
export default useDisabledVoices;