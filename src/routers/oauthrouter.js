/**
 * Created by championswimmer on 10/03/17.
 *
 * This is the /oauth path
 */
const router = require('express').Router()
const OauthMiddewares = require('../oauth/oauthserver').Middlewares
const { authLimiter, apiLimiter } = require('../middlewares/ratelimit')

router.get('/authorize', authLimiter, OauthMiddewares.authorizationMiddleware)
router.post('/dialog/authorize/decision', authLimiter, OauthMiddewares.decisionMiddleware)
router.post('/token', apiLimiter, OauthMiddewares.tokenMiddleware)
module.exports = router
