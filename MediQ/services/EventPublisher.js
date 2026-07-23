/**
 * Base EventPublisher Interface
 * 
 * ============================================================================
 * What this file does:
 * Defines a contract (an Interface) for publishing real-time events.
 * 
 * Why do we need this?
 * In enterprise software, you want to decouple your "Business Logic" from your "Transport Layer".
 * Our `QueueService` needs to tell the frontend "A token was called", but the `QueueService`
 * shouldn't care if we are using WebSockets, Server-Sent Events, or Redis Pub/Sub to send that message.
 * By injecting this generic Interface into the `QueueService`, we can swap out the underlying
 * transport technology anytime without changing a single line of business logic!
 * ============================================================================
 */
class EventPublisher {
  /**
   * Publishes an event to a specific channel/room.
   * This is an abstract method that MUST be overridden by child classes.
   * 
   * @param {string} channel - The target room or channel (e.g., 'department:123')
   * @param {string} event - The event name (e.g., 'queue:token_called')
   * @param {Object} payload - The JSON data payload containing the update
   */
  publish(channel, event, payload) {
    throw new Error("Method 'publish()' must be implemented by the child class.");
  }
}

module.exports = EventPublisher;
