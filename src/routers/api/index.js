/**
 * Created by championswimmer on 10/03/17.
 *
 * This is the /api/v1 path
 */
const router = require('express').Router()
const { apiLimiter } = require('../../middlewares/ratelimit')
const CORS = require('express-cors')

router.use(CORS({
    allowedOrigins: [
        '*.codingblocks.com', '*.codingblocks.xyz', 'localhost:*'
    ],
    headers: [
        'X-Requested-With','content-type','Authorization'
    ],
    methods: [
        'GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'
    ]
}))

router.options('*', (req, res, next) => {
    res.sendStatus(204)
})

router.use(apiLimiter)
router.use('/users', require('./users'))
router.use('/clients', require('./clients'))
router.use('/address', require('./address'))
router.use('/organisations', require('./organisations'))
router.use('/demographics', require('./demographics'))
router.use('/signup_check', require('./signupcheck'))
router.use('/otp', require('./otp'))
router.use('/colleges', require('./colleges'))
router.use('/branches', require('./branches'))

module.exports = router
