/**
 * Created by championswimmer on 10/03/17.
 *
 * This is the /api/v1 path
 */
const router = require('express').Router()
const { apiLimiter } = require('../../middlewares/ratelimit')
router.use((req, res, next) => {
    res.set('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization')
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

    let origin = req.get('origin') || ""
    if (origin.indexOf('codingblocks.com') !== -1) {
        res.set('Access-Control-Allow-Credentials', true)
        res.set('Access-Control-Allow-Origin', origin)
    }

    next()
})
router.use(apiLimiter)
router.use('/users', require('./users'))
router.use('/clients', require('./clients'))
router.use('/address', require('./address'))
router.use('/organisations', require('./organisations'))
router.use('/demographics', require('./demographics'))
router.use('/signup_check', require('./signupcheck'))

module.exports = router
