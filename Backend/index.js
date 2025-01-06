import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import fileUpload from "express-fileupload";
import connectMongoDB from "../Backend/config/db.js";
import path from "path";
import {app, server} from "./utils/socket.js"

//Routes Importes
import authRoutes from "./routes/authRoute.js";

dotenv.config();
const PORT = process.env.PORT;
const __dirname = path.resolve();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
app.use("/api/auth", authRoutes);
console.log(process.env.PORT);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

server.listen(process.env.PORT, () => {
  console.log(`Server Started at Port ${PORT}`);
  connectMongoDB();
});
