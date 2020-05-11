import useStorageDev from "./storage-dev";
import useStorageProd from "./storage-prod";

const env = process.env.NODE_ENV;
const storage = (env === "production") ? useStorageProd : useStorageDev;
export default storage;