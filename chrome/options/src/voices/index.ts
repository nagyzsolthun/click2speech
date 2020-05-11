import useTtsDev from "./tts-dev";
import useTtsProd from "./tts-prod";

const env = process.env.NODE_ENV;
const useVoices = (env === "production") ? useTtsProd : useTtsDev;
export default useVoices;