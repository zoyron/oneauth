/**
 * Created by himank on 4/1/18.
 *
 * This is the verify email path
 */
const router = require('express').Router()
const moment = require('moment')
const Raven = require('raven')
const uid = require('uid2')
const cel = require('connect-ensure-login')

const models = require('../db/models').models
const makeGaEvent = require('../utils/ga').makeGaEvent
const mail = require('../utils/email')
const {
    findUserByParams,
    updateUserByParams
} = require('../controllers/user')
const {
    createVerifyEmailEntry,
    findVerifyEmailEntryByKey
} = require('../controllers/verify_emails')

router.post(
    '/',
    cel.ensureLoggedIn('/login'),
    makeGaEvent('submit', 'form', 'verifyemail'),
    async (req, res, next) => {

        if (req.body.email.trim() === '') {
            req.flash('error', 'Email cannot be empty')
            return res.redirect('/verifyemail')
        }
        let user = await findUserByParams({
            verifiedemail: req.body.email
        })
        if (!user) {
            //Email not verified, go to next middleware
            return next()
        } else {
            // Email already verified, take person to profile page
            req.flash('error',
                'Email already verified with codingblocks account ID:' + user.get('id'))
            return res.redirect('/users/me')
        }
    },
    async (req, res) => {

        try {

            if (!req.user.email) {
                await updateUserByParams(
                    {id: req.user.id},
                    {email: req.body.email}
                )
            }
            let user = await findUserByParams({
                email: req.body.email, id: req.user.id
            })

            if (!user) {
                // No user with this email
                req.flash('error', 'The email id entered is not registered with this codingblocks account. Please enter your registered email.')
                return res.redirect('/users/me')
            }

            await createVerifyEmailEntry(user, true)
            return res.redirect('/verifyemail/inter')

        } catch (err) {
            Raven.captureException(err)
            console.error(err.toString())
            req.flash('error', 'Something went wrong. Please try again with your registered email.')
            return res.redirect('/users/me')
        }
    }
)

router.get('/key/:key', function (req, res) {

    if ((req.params.key === '') || req.params.key.length < 15) {
        req.flash('error', 'Invalid key. please try again.')
        return res.redirect('/users/me')
    }

    findVerifyEmailEntryByKey(req.params.key)
        .then((resetEntry) => {

            if (!resetEntry) {
                req.flash('error', 'Invalid key. please try again.')
                return []
            }

            if (resetEntry.deletedAt) {
                return []
            }

            if (req.user) {

                if (req.user.dataValues.id !== resetEntry.dataValues.userId) {

                    req.flash('error', 'Key authorization failed.')
                    return []
                }
            }

            if (moment().diff(resetEntry.createdAt, 'seconds') <= 86400) {

                return Promise.all([models.Verifyemail.update({
                        deletedAt: moment().format()
                    },
                    {
                        where: {userId: resetEntry.dataValues.userId, key: resetEntry.dataValues.key}
                    }), models.User.findOne({
                    where: {id: resetEntry.dataValues.userId}
                })])

            } else {

                req.flash('error', 'Key expired. Please try again.')
                return []
            }


        })
        .then(([updates, user]) => {

            if (req.user) {
                if (req.user.dataValues.verifiedemail) {
                    req.flash('success', 'Your email is already verified.')
                    return
                }
            }

            if (updates) {

                return models.User.update({
                        verifiedemail: user.dataValues.email
                    },
                    {where: {id: user.dataValues.id}})
            } else {
                return
            }
        })
        .then((verifiedemail) => {

            if (verifiedemail) {
                req.flash('success', 'Your email is verified. Thank you.')
                return res.redirect('/users/me')
            } else {
                return res.redirect('/')
            }

        })
        .catch(function (err) {
            Raven.captureException(err)
            console.error(err.toString())
            req.flash('error', 'There was some problem verifying your email. Please try again.')
            return res.redirect('/')

        })
})

module.exports = router

