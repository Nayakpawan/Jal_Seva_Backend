import { app } from "./app.js";
import { createDefaultAdmin } from "./utils/seedAdmin.js";
import { connection } from "./database/dbConnection.js";
import { config } from "dotenv";
config({ path: "./config/config.env"});
const PORT = 4000;
const startServer = async () => {
  try {
    // 🔥 1. CONNECT DB FIRST
    await connection();

    console.log("MongoDB Connected");

    // 🔥 2. SEED ADMIN
    await createDefaultAdmin();

    // 🔥 3. START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

  } catch (error) {
    console.log("Server Error:", error);
  }
};

startServer();