const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Initialize Socket.io Server
const initSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // JWT Authentication Middleware for WebSockets
  io.use(async (socket, next) => {
    try {
      // Allow token from query param or auth header
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "default_access_secret");
      
      // Optionally fetch user from DB if we need up-to-date roles, but JWT payload is usually enough
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id} (Role: ${socket.user?.role})`);

    // Subscribe to a department's queue
    socket.on("queue:subscribe", (departmentId) => {
      const channelName = `department:${departmentId}`;
      socket.join(channelName);
      console.log(`[Socket] User ${socket.id} subscribed to ${channelName}`);
    });

    // Unsubscribe from a department's queue
    socket.on("queue:unsubscribe", (departmentId) => {
      const channelName = `department:${departmentId}`;
      socket.leave(channelName);
      console.log(`[Socket] User ${socket.id} unsubscribed from ${channelName}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { initSocketServer };
