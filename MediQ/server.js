require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./db/connect");
const { initSocketServer } = require("./socket/socket");
const WebSocketPublisher = require("./services/WebSocketPublisher");
require("./workers/index");

const app = express();
const server = http.createServer(app);

// Initialize Socket Server & Publisher
const io = initSocketServer(server);
const eventPublisher = new WebSocketPublisher(io);

// Make publisher available to controllers via req.app.locals
app.locals.eventPublisher = eventPublisher;

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Connect Database
connectDB();

// Routes Import
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");
const hospitalRoutes = require("./routes/hospital.routes");
const queueRoutes = require("./routes/queue.routes");

// Route Declarations
app.use("/api/auth", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/queue", queueRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || []
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running at port : ${PORT}`);
});

app.use(
  "/api/maps",
  mapsRoutes
);
