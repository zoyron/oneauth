/**
 * Created by tdevm on 19/8/19.
 */

const Raven = require('raven');
const router = require('express').Router()
const passport = require('../../passport/passporthandler')

const {findUserByParams} = require('../../controllers/user')
const {validateUsername} = require('../../utils/username_validator')

router.get('/username',
    passport.authenticate('bearer', {session: false}),
    async function (req, res, next) {
        try {
            const user = await findUserByParams({username: req.query.username});
            if (user) {
                res.status(422).json({error: `Username ${req.query.username} is not available.`})
            } else if (req.query.username.length < 3 || validateUsername(req.query.username)) {
                res.status(422).json({error: `Username ${req.query.username} is not valid.`})
            } else {
                res.status(200).json({success: `Username ${req.query.username} is available.`})
            }
        } catch (error) {
            Raven.captureException(error)
            res.status(500).json({error: 'Failed to search username'})
        }
    })

router.get('/email',
    passport.authenticate('bearer', {session: false}),
    async function (req, res, next) {
        const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
        try {
            const user = await findUserByParams({email: req.query.email});
            if (user) {
                res.status(422).json({error: `Email ${req.query.email} is already registered on oneauth.`})
            } else if (!emailRegex.test(req.query.email)) {
                res.status(422).json({error: `${req.query.email} is not a valid email.`})
            } else {
                res.status(200).json({success: `Email ${req.query.email} is available.`})
            }
        } catch (error) {
            Raven.captureException(error)
            res.status(500).json({error: 'Failed to search email'})
        }
    })

module.exports = router
