import sendAnalyticsDev from "./analytics-dev";
import sendAnalyticsProd from "./analytics-prod";

const env = process.env.NODE_ENV;
const sendAnalytics = (env === "production") ? sendAnalyticsProd : sendAnalyticsDev;
export default sendAnalytics;