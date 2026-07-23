const redisConnection = require("../config/redis");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");

/**
 * ============================================================================
 * REDIS RATE LIMITER MIDDLEWARE
 * ============================================================================
 * What this file does:
 * Protects the API from Spam, Bots, and Denial of Service (DDoS) attacks.
 * We attach this to vulnerable endpoints like `/api/queue/book`.
 * 
 * Why use Redis instead of memory?
 * If we spin up 5 Node.js servers behind a Load Balancer, local memory limiters fail 
 * because Server 1 doesn't know about requests hitting Server 2. By using a centralized 
 * Redis cache, all 5 servers instantly share rate limit counts.
 * 
 * @param {number} maxRequests - Maximum allowed requests in the time window
 * @param {number} windowSeconds - The time window in seconds
 * @param {string} keyPrefix - Unique prefix for the route being limited
 */
const rateLimiter = (maxRequests, windowSeconds, keyPrefix = "rate_limit") => {
  
  return asyncHandler(async (req, res, next) => {
    // 1. Identify the user. Use their DB _id if logged in, otherwise fallback to IP address
    const identifier = req.user ? req.user._id.toString() : req.ip;
    const redisKey = `${keyPrefix}:${identifier}`;

    // 2. Redis `INCR` is an Atomic Operation.
    // It increments the number and returns the new value. 
    // If the key doesn't exist yet, Redis seamlessly creates it with a value of 1.
    const requests = await redisConnection.incr(redisKey);

    // 3. Set the Time-to-Live (TTL)
    // If this is their first request, set the timer to expire (e.g., in 900 seconds)
    if (requests === 1) {
      await redisConnection.expire(redisKey, windowSeconds);
    }

    // 4. Enforce the limit
    if (requests > maxRequests) {
      // Find out exactly how many seconds are left until the ban lifts
      const ttl = await redisConnection.ttl(redisKey);
      throw new ApiError(
        429, 
        `Too many requests. Please wait ${ttl} seconds before trying again.`
      );
    }

    // 5. Allowed! Pass to the next middleware or controller
    next();
  });
};

module.exports = {
  rateLimiter,
};
