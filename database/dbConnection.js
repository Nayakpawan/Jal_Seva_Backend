import mongoose from "mongoose";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

dns.setServers([
  '1.1.1.1',
  '8.8.8.8'
])
export const connection = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      dbName: "Water_Supply_DB",
      family: 4,
    })
    .then(() => {
      console.log("Connected to database.");
    })
    .catch((err) => {
      console.log(`Some error occured while connecting to database: ${err}`);
    });
};
