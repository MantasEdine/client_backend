// server.js ou index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";

// Routes imports
import authRoutes from "./routes/authRoute.js";
import productRoutes from "./routes/productRoute.js";
import laboRoutes from "./routes/laboRoute.js";
import fournisseurRoutes from "./routes/fournisseurRoute.js";
import remiseRoutes from "./routes/remiseRoute.js";
import excelRoutes from "./routes/excelRoute.js";
import userRoutes from "./routes/userRoute.js";
import commandeRoutes from "./routes/commandeRoute.js"; // ✅ NOUVELLE ROUTE

// Middleware imports
import { notFound, errorHandler } from "./middlewares/errorHandle.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});


// Middleware
app.use(cors({ origin: "*" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Database connection
connectDB();

// Socket.io connection
io.on("connection", (socket) => {
  console.log("✅ Client connecté:", socket.id);

  socket.on("remise-update", () => {
    console.log("📡 Broadcasting remise-updated event");
    io.emit("remise-updated");
  });

  socket.on("permission-updated", (data) => {
    console.log("📡 Broadcasting permission-updated event:", data);
    io.emit("permission-updated", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client déconnecté:", socket.id);
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/produit", productRoutes);
app.use("/api/laboratoire", laboRoutes);
app.use("/api/fournisseur", fournisseurRoutes);
app.use("/api/remise", remiseRoutes);
app.use("/api/excel", excelRoutes);
app.use("/api/users", userRoutes);
app.use("/api/commande", commandeRoutes); // ✅ NOUVELLE ROUTE

// Health check
app.get("/", (req, res) => {
  res.json({ message: "API en cours d'exécution" });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});

export { io };