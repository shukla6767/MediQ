const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * ============================================================================
 * BACKEND SOCKET.IO INITIALIZATION
 * ============================================================================
 * What this file does:
 * Bootstraps the WebSocket server that allows the backend to push real-time
 * updates to the React frontend without the frontend having to "poll" (ask repeatedly).
 * 
 * How it works with the rest of the app:
 * In `server.js`, we pass the raw HTTP server into `initSocketServer()`. 
 * Then, we wrap the resulting `io` instance in our `WebSocketPublisher` (from Batch 2)
 * so our QueueService can broadcast events without knowing about Socket.io directly!
 */

const initSocketServer = (server) => {
  // 1. Configure the Socket.io Server with CORS
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true // Crucial for accepting HTTP-Only cookies if we used them
    }
  });

  // 2. MIDDLEWARE: Secure the WebSocket connection
  // Just like our REST API has `verifyJWT`, our WebSockets MUST be secured.
  // Otherwise, a hacker could listen in on other patients' token calls.
  io.use(async (socket, next) => {
    try {
      // The React frontend (`useQueueSocket.js`) will pass the JWT here
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Cryptographically verify the token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "default_access_secret");
      
      // Attach the user identity to this specific socket connection
      socket.user = decoded;
      next(); // Let them connect!
    } catch (err) {
      next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  // 3. EVENT LISTENERS
  // Once a user successfully connects, what can they do?
  io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id} (Role: ${socket.user?.role})`);

    // The frontend sends "queue:subscribe" with a departmentId.
    // We place this user into a specific "Room" (Channel). 
    // This ensures a patient in Cardiology doesn't receive updates for the Dental queue!
    socket.on("queue:subscribe", (departmentId) => {
      const channelName = `department:${departmentId}`;
      socket.join(channelName);
      console.log(`[Socket] User ${socket.id} subscribed to ${channelName}`);
    });

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
