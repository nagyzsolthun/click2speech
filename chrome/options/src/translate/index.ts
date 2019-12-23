import transateDev from "./translate-dev";
import transateProd from "./translate-prod";

const env = process.env.NODE_ENV;
const storage = (env === "production") ? transateProd : transateDev;
export default storage;