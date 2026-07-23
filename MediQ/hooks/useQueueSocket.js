import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

/**
 * ============================================================================
 * FRONTEND SOCKET.IO HOOK
 * ============================================================================
 * What this file does:
 * It's a Custom React Hook that establishes and manages the WebSocket connection
 * to the Node.js backend.
 * 
 * Why use a global singleton (`socketInstance`)?
 * In React, components re-render constantly. If we created a `new io()` inside 
 * the component, React would rapidly disconnect and reconnect to the server 
 * 100 times a second, crashing the backend. The singleton ensures we only EVER
 * have ONE physical connection to the server per browser tab.
 */

let socketInstance = null;

export const useQueueSocket = (departmentId, onEvent) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 1. Initialize the singleton if it doesn't exist yet
    if (!socketInstance) {
      socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
        withCredentials: true, // Automatically sends cookies (JWT) to the server
        reconnection: true, // Auto-reconnect if the server restarts
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
    }

    const socket = socketInstance;

    // 2. Define Connection Handlers
    const handleConnect = () => {
      setIsConnected(true);
      // As soon as we connect, tell the backend which "Room" we want to listen to.
      // (e.g., "Put me in the Cardiology room so I can hear my token being called")
      if (departmentId) {
        socket.emit("queue:subscribe", departmentId);
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // Generic event dispatcher: Wraps the callback so we can reuse it
    const handleQueueEvent = (event) => (payload) => {
      if (onEvent) onEvent(event, payload);
    };

    // 3. Attach Listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    
    // These are the exact event names published by `QueueService.js` in the backend!
    socket.on("queue:token_called", handleQueueEvent("queue:token_called"));
    socket.on("queue:token_skipped", handleQueueEvent("queue:token_skipped"));
    socket.on("queue:token_recalled", handleQueueEvent("queue:token_recalled"));
    socket.on("queue:queue_updated", handleQueueEvent("queue:queue_updated"));
    socket.on("queue:patient_turn", handleQueueEvent("queue:patient_turn"));

    // Edge Case: If the socket was already connected BEFORE this component mounted
    if (socket.connected) {
      handleConnect();
    }

    // 4. CLEANUP (Component Unmount)
    // When the patient navigates away from the dashboard, we MUST unsubscribe
    // and remove listeners, otherwise we create a massive Memory Leak in the browser.
    return () => {
      if (departmentId) {
        socket.emit("queue:unsubscribe", departmentId);
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("queue:token_called");
      socket.off("queue:token_skipped");
      socket.off("queue:token_recalled");
      socket.off("queue:queue_updated");
      socket.off("queue:patient_turn");
    };
  }, [departmentId, onEvent]); // Re-run this effect ONLY if the departmentId changes

  return { isConnected };
};
