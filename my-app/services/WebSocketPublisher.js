const EventPublisher = require("./EventPublisher");

/**
 * WebSocket implementation of EventPublisher
 */
class WebSocketPublisher extends EventPublisher {
  constructor(io) {
    super();
    this.io = io;
  }

  publish(channel, event, payload) {
    if (!this.io) {
      console.warn(`[WebSocketPublisher] IO instance missing. Cannot publish event ${event} to ${channel}`);
      return;
    }
    
    // Broadcast to the specific channel (room)
    this.io.to(channel).emit(event, payload);
    console.log(`[Event] Published ${event} to channel ${channel}`);
  }
}

module.exports = WebSocketPublisher;
