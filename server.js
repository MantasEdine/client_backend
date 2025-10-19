import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middlewares/errorHandle.js";
import authRoutes from "./routes/authRoute.js";
import fournisseurRoute from "./routes/fournisseurRoute.js";
import laboRoute from "./routes/laboRoute.js";
import productRoute from "./routes/productRoute.js";
import remiseRoute from "./routes/remiseRoute.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.get("/", (req, res) => res.send("✅ API en marche..."));
app.use("/api/auth", authRoutes);
app.use("/api/fournisseur", fournisseurRoute);
app.use("/api/laboratoire", laboRoute);
app.use("/api/produit", productRoute);
app.use("/api/remise", remiseRoute);

// Errors
app.use(notFound);
app.use(errorHandler);

// Socket.io
io.on("connection", (socket) => {
  console.log(`🟢 Nouveau client connecté: ${socket.id}`);
  socket.on("disconnect", () => console.log(`🔴 Client déconnecté: ${socket.id}`));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));
