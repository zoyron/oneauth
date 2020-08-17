const rateLimit = require('express-rate-limit')

module.exports = {
    pageLimiter: rateLimit({
        windowMs: 10 * 60 * 1000, // 10 minutes
        max: 1000 //  per ip
    }),
    apiLimiter: rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 300000 //  per ip
    }),
    authLimiter: rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 500 //  per ip
    }),
}