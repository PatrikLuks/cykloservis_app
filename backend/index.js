
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import corsMiddleware from "./cors.js";

dotenv.config();


const app = express();
app.use(corsMiddleware);
app.use(express.json());
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    app.listen(PORT, () => console.log(`Server běží na portu ${PORT}`));
  })
  .catch((err) => console.error("Chyba připojení k databázi:", err));
