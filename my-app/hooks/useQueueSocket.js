import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

// Singleton instance to prevent multiple connections across re-renders
let socketInstance = null;

export const useQueueSocket = (departmentId, onEvent) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // We expect the JWT token to be stored in localStorage or cookies
    // For this example, assuming the apiClient handles cookies, 
    // but Socket.io needs it explicitly if not using same-site cookies effectively,
    // though Socket.io works with withCredentials: true.
    // If JWT is in cookies, the browser sends it automatically.
    
    if (!socketInstance) {
      socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
    }

    const socket = socketInstance;

    const handleConnect = () => {
      setIsConnected(true);
      if (departmentId) {
        socket.emit("queue:subscribe", departmentId);
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // Generic event dispatcher
    const handleQueueEvent = (event) => (payload) => {
      if (onEvent) onEvent(event, payload);
    };

    // Listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("queue:token_called", handleQueueEvent("queue:token_called"));
    socket.on("queue:token_skipped", handleQueueEvent("queue:token_skipped"));
    socket.on("queue:token_recalled", handleQueueEvent("queue:token_recalled"));
    socket.on("queue:queue_updated", handleQueueEvent("queue:queue_updated"));
    socket.on("queue:patient_turn", handleQueueEvent("queue:patient_turn"));

    // If already connected, handle the sub manually
    if (socket.connected) {
      handleConnect();
    }

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
  }, [departmentId, onEvent]);

  return { isConnected };
};
