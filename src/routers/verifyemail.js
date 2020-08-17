/**
 * Created by himank on 4/1/18.
 *
 * This is the verify email path
 */
const router = require('express').Router()
const moment = require('moment')
const Raven = require('raven')
const cel = require('connect-ensure-login')

const models = require('../db/models').models
const makeGaEvent = require('../utils/ga').makeGaEvent
const {
    findUserByParams,
    updateUserByParams
} = require('../controllers/user')
const {
    createVerifyEmailEntry,
    findVerifyEmailEntryByKey
} = require('../controllers/verify_emails')
const { eventUserUpdated } = require('../controllers/event/users')

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

            await createVerifyEmailEntry(user, true,
                req.session && req.session.returnTo
            )
            return res.redirect('/verifyemail/inter')

        } catch (err) {
            Raven.captureException(err)
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
    let returnTo = req.session && req.session.returnTo;

    findVerifyEmailEntryByKey(req.params.key)
        .then((resetEntry) => {

            // Key not found
            if (!resetEntry) {
                req.flash('error', 'Invalid key. please try again.')
                return []
            }

            // Key had been deleted
            if (resetEntry.deletedAt) {
                return []
            }

            // Key belongs to some other user
            if (req.user) {
                if (req.user.dataValues.id !== resetEntry.dataValues.userId) {
                    req.flash('error', 'Key authorization failed.')
                    return []
                }
            }
            if (resetEntry.dataValues.returnTo) {
                returnTo = resetEntry.dataValues.returnTo
            }

            if (moment().diff(resetEntry.createdAt, 'seconds') <= 86400) {
                return Promise.all([
                    // Delete this to prevent future usage
                    models.Verifyemail.update(
                        {deletedAt: moment().format()},
                        {
                            where: {
                                userId: resetEntry.dataValues.userId,
                                key: resetEntry.dataValues.key
                            }
                        }
                    ),

                    // Find user of this entry
                    models.User.findOne({
                        where: {
                            id: resetEntry.dataValues.userId
                        }
                    }),
                ])
            } else {

                req.flash('error', 'Key expired. Please try again.')
                return []
            }


        })
        .then(([updates, user]) => {

            if (req.user) {
                // If user's email is already verified
                if (req.user.dataValues.verifiedemail) {
                    req.flash('success', 'Your email is already verified.')
                    return req.user
                }
            }

            if (updates) {
                // Update the value of verifiedEmail for the user
                return models.User.update(
                        {verifiedemail: user.dataValues.email},
                        {
                            where: {id: user.dataValues.id},
                            returning: true
                        }
                    )[1][0]
            } else {
                return req.user
            }
        })
        .then((verifiedUser) => {

            if (verifiedUser) {
                try {
                    eventUserUpdated(verifiedUser.id).catch(Raven.captureException.bind(Raven))
                } catch (e) {
                    Raven.captureException(e)
                }
                req.flash('success', 'Your email is verified. Thank you.')
                return res.redirect(returnTo || '/users/me')
            } else {
                return res.redirect(returnTo || '/')
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

