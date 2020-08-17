/**
 * Created by championswimmer on 13/03/17.
 */
const router = require('express').Router()
const publicroute = require('./public')
    , usersroute = require('./users')
    , clientroute = require('./client')
    , addressroute = require('./address')
    , forgotroute = require('./forgot')
    , approute = require('./apps')
    , orgroute = require('./organisation')
const makeGaEvent = require('../../utils/ga').makeGaEvent
const { pageLimiter } = require('../../middlewares/ratelimit')

router.use(pageLimiter)
router.use(function (req, res, next) {
    // One '!' doesn't cancel the other'!'. This is not wrong code. Learn JS
    res.locals.loggedIn = !!req.user
    res.locals.userRole = req.user && req.user.role
    res.locals.userId = req.user && req.user.id
    res.locals.userName= req.user && req.user.firstname
    res.locals.userPhoto= req.user && req.user.photo
    res.locals.user = req.user
    res.locals.title = "Coding Blocks Account"

    if(req.url.includes("address")) {
        res.locals.currentUrl = "address"
    } else if(req.url.includes("organisations")) {
        res.locals.currentUrl = "organisations"
    } else if(req.url.includes("apps")) {
        res.locals.currentUrl = "apps"
    } else if (req.url.includes("clients")) {
        res.locals.currentUrl = "clients"
    } else res.locals.currentUrl = "users"

    next()
})

router.use('/', publicroute)
router.use('/users', usersroute)
router.use('/clients', clientroute)
router.use('/address', addressroute)
router.use('/forgot', forgotroute)
router.use('/apps', approute)
router.use('/organisations', orgroute)


module.exports = router
