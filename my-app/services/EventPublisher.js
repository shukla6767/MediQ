/**
 * Base EventPublisher Interface
 * 
 * This ensures that our business logic is fully decoupled from the
 * actual transport mechanism (WebSockets today, Redis Pub/Sub tomorrow).
 */
class EventPublisher {
  /**
   * Publishes an event to a specific channel/room
   * @param {string} channel - The target room or channel (e.g., 'department:123')
   * @param {string} event - The event name (e.g., 'queue:token_called')
   * @param {Object} payload - The data payload
   */
  publish(channel, event, payload) {
    throw new Error("Method 'publish()' must be implemented.");
  }
}

module.exports = EventPublisher;
