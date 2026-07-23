const EventPublisher = require("./EventPublisher");

/**
 * ============================================================================
 * WEBSOCKET PUBLISHER
 * ============================================================================
 * What this file does:
 * This is the concrete implementation of the `EventPublisher` interface.
 * It uses Socket.io to push real-time data directly to the user's browser.
 * 
 * Data Flow:
 * - IN: Receives (channel, event, payload) from `QueueService.js`
 * - OUT: Pushes the payload to all browsers connected to the specific `channel` room.
 */
class WebSocketPublisher extends EventPublisher {
  constructor(io) {
    super(); // Initialize the parent class
    this.io = io; // Store the active Socket.io server instance
  }

  /**
   * Pushes the event to the connected WebSocket clients.
   * 
   * @param {string} channel - The specific room (e.g., "department:64abc123"). 
   *                           Only patients in this specific hospital department will receive the message.
   * @param {string} event - The socket event name (e.g., "queue:patient_turn").
   * @param {Object} payload - The JSON data to send.
   */
  publish(channel, event, payload) {
    if (!this.io) {
      console.warn(`[WebSocketPublisher] IO instance missing. Cannot publish event ${event} to ${channel}`);
      return;
    }
    
    // Broadcast to the specific channel (room)
    // .to(channel) ensures we don't accidentally notify patients in Hospital A about a doctor in Hospital B.
    this.io.to(channel).emit(event, payload);
    console.log(`[Event] Published ${event} to channel ${channel}`);
  }
}

module.exports = WebSocketPublisher;
