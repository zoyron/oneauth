/**
 * Created by tdevm on 19/8/19.
 */

const Raven = require('raven');
const router = require('express').Router()
const passport = require('../../passport/passporthandler')

const {findUserByParams} = require('../../controllers/user')
const {validateUsername}  = require('../../utils/username_validator')

router.get('/username',
    passport.authenticate('bearer', {session: false}),
    async function (req, res, next) {
        try {
            const user = await findUserByParams({username: req.query.username});
            if (user || req.query.username.length < 3 || validateUsername(req.query.username)) {
                res.status(422).json()
            } else {
                res.status(200).json()
            }
        } catch (error) {
            Raven.captureException(error)
            res.status(400).json({error: 'Failed to search username'})
        }
    })

router.get('/email',
    passport.authenticate('bearer', {session: false}),
    async function (req, res, next) {
        let emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
        try {
            const user = await findUserByParams({verifiedemail: req.query.email});
            if (user || !emailRegex.test(req.query.email)) {
                res.status(422).json()
            } else {
                res.status(200).json()
            }
        } catch (error) {
            Raven.captureException(error)
            res.status(400).json({error: 'Failed to search email'})
        }
    })

module.exports = router
