const Raven = require('raven')
const cel = require('connect-ensure-login')
const router = require('express').Router()

const models = require('../../db/models').models;
const {parseNumberByCountry, validateNumber} = require('../../utils/mobile_validator')
const {findUserByParams} = require('../../controllers/user')
const {createAndSendOTP} = require('../../controllers/verify_otp')
const passport = require('../../passport/passporthandler')

const debug = require('debug')('login_using_otp:routes:login_otp')

// We do not handle get requests on this path at all
router.get('/', (req, res) => {
    res.redirect('/login')
})

router.post('/', cel.ensureNotLoggedIn('/'), async (req, res, next) => {
    try {

        if (req.body.password) {
            passport.authenticate('otp', function (err, user, info) {
                if (err) {
                    return next(err)
                }
                if (!user) {
                    req.flash('error', 'Incorrect OTP')
                    return res.render('login_otp', {
                        pageTitle: "Login with OTP",
                        mobile_number: req.body.username,
                        messages: {
                            error: req.flash('error'),
                            info: req.flash('info')
                        }
                    })
                }
                req.login(user, function (err) {
                    if (err) {
                        return next(err)
                    }
                    return res.redirect('/users/me')
                })
            })(req, res, next)

        } else {

            try {
                if (!validateNumber(parseNumberByCountry(req.body.username, 'IN'))) {
                    console.log('Invalid Mobile Number')
                    req.flash('error', 'Please enter a valid 10 digit Mobile number.')
                    return res.redirect('/')
                }
            } catch (error) {
                console.log('Invalid Mobile Number Format')
                req.flash('error', 'Please enter a valid 10 digit Mobile number.')
                return res.redirect('/')
            }

            let user = await findUserByParams({verifiedmobile: `+91-${req.body.username}`})

            const key = Math.floor(100000 + Math.random() * 900000) //creates a 6 digit random number.


            if (!user) {
                req.flash('error', 'OTP login works only if you have verified your mobile number')
                debug('Mobile no not verified or no user')
                return res.redirect('/')
            }

            await models.UserMobileOTP.upsert({
                mobile_number: user.dataValues.mobile_number,
                login_otp: key,
                userId: user.dataValues.id,
                include: [models.User]
            })

            createAndSendOTP(user.mobile_number, key, 'accessing your Coding Blocks Account')
                .then(function (body) {
                    debug(body)
                }).catch(function (error) {
                throw new Error(error)
            })
            req.flash('info', 'We have sent you an OTP on your number')
            res.render('login_otp', {
                pageTitle: "Login with OTP",
                mobile_number: user.dataValues.mobile_number,
                messages: {
                    error: req.flash('error'),
                    info: req.flash('info')
                }
            })

        }
    } catch (e) {
        Raven.captureException(e)
        req.flash('error', 'Error logging in with OTP.')
        res.redirect('/')
    }


})


router.post('/resend', cel.ensureNotLoggedIn('/'), async (req, res, next) => {
    try {
        if (!validateNumber(parseNumberByCountry(req.body.username, 'IN'))) {
            console.log('Invalid Mobile Number')
            req.flash('error', 'Please enter a valid 10 digit Mobile number.')
            return res.redirect('/')
        }

        let user = await findUserByParams({verifiedmobile: req.body.username})

        const key = Math.floor(100000 + Math.random() * 900000) //creates a 6 digit random number.


        if (!user) {
            req.flash('error', 'OTP login works only if you have verified your mobile number')
            debug('Mobile no not verified or no user')
            return res.redirect('/')
        }

        await models.UserMobileOTP.upsert({
            mobile_number: user.dataValues.mobile_number,
            login_otp: key,
            userId: user.dataValues.id,
            include: [models.User]
        })

        createAndSendOTP(user.mobile_number, key, 'accessing your Coding Blocks Account')
            .then(function (body) {
                debug(body)
            }).catch(function (error) {
            throw new Error(error)
        })
        req.flash('info', 'We have resent you an OTP on your number')
        res.render('login_otp', {
            pageTitle: "Login with OTP",
            mobile_number: user.dataValues.mobile_number,
            messages: {
                error: req.flash('error'),
                info: req.flash('info')
            }
        })


    } catch (e) {
        Raven.captureException(e)
        req.flash('error', 'Error logging in with OTP.')
        res.redirect('/')
    }


})

module.exports = router