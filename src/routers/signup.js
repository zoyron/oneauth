/**
 * Created by championswimmer on 09/03/17.
 *
 * This is the /signup path
 */
const Raven = require('raven')
const router = require('express').Router()
const models = require('../db/models').models
const passutils = require('../utils/password')
const makeGaEvent = require('../utils/ga').makeGaEvent
const mail = require('../utils/email')
const passport = require('passport')
const {
    findUserByParams,
    createUserLocal
} = require('../controllers/user')
const {
    createVerifyEmailEntry
} = require('../controllers/verify_emails')
const {parseNumberEntireString, validateNumber} = require('../utils/mobile_validator')
const {generateReferralCode} = require('../utils/referral')

router.post('/', makeGaEvent('attempt', 'signup', 'local'),
    async (req, res) => {

    // store the posted data in the session
    req.session.prevForm = {
        username: req.body.username,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        dial_code: req.body.dial_code,
        mobile_number: req.body.mobile_number,
        email: req.body.email,
        refCode: req.body.refcode,
        gradYear: req.body.gradYear ? req.body.gradYear : null,
        demographic: {
            branchId: req.body.branchId,
            collegeId: req.body.collegeId,
        }
    }

    if ((req.body.firstname.trim() === '') || (req.body.lastname.trim() === '')) {
        req.flash('error', 'Firstname and/or Lastname cannot be empty')
        req.visitor.event({
            ea: 'unsuccessful',
                ec: 'signup',
            el: 'Firstname and/or Lastname cannot be empty'
        }).send()
        return res.redirect('/signup')
    }
    if ((req.body.gender.trim() === '')) {
        req.flash('error', 'Gender cannot be empty')
        req.visitor.event({
            ea: 'unsuccessful',
                ec: 'signup',
            el: 'Gender cannot be empty'
        }).send()
        return res.redirect('/signup')
    }
    if (req.body.email.trim() === '') {
        req.flash('error', 'Email cannot be empty')
        req.visitor.event({
            ea: 'unsuccessful',
                ec: 'signup',
            el: 'Email cannot be empty'
        }).send()
        return res.redirect('/signup')
    }
    if (req.body.mobile_number.trim() === '') {
        req.flash('error', 'Contact number cannot be empty')
        req.visitor.event({
            ea: 'unsuccessful',
                ec: 'signup',
            el: 'Mobile cannot be empty'
        }).send()
        return res.redirect('/signup')
    }
    if ((req.body.password.trim() === '') || req.body.password.length < 5) {
        req.flash('error', 'Password too weak. Use 5 characters at least.')
        req.visitor.event({
            ea: 'unsuccessful',
                ec: 'signup',
            el: 'Password too weak'
        }).send()
        return res.redirect('/signup')
    }
    if (!req.body.gradYear || (req.body.gradYear < 2000 || req.body.gradYear > 2025)) {
        req.flash('error', 'Invalid Graduation year')
        req.visitor.event({
            ea: 'unsuccessful',
                ec: 'signup',
            el: 'Invalid Graduation year'
        }).send()
        return res.redirect('/signup')
    }

    try {

        let user = await findUserByParams({username: req.body.username})
        if (user) {
            req.flash('error', 'Username already exists. Please try again.')
            req.visitor.event({
                ea: 'unsuccessful',
                ec: 'signup',
                el: 'Username already exists. Please try again.'
            }).send()
            return res.redirect('/signup')
        }

        if (!(validateNumber(parseNumberEntireString(
            req.body.dial_code + '-' + req.body.mobile_number
        )))) {
            req.flash('error', 'Please provide a Valid Contact Number.')
            req.visitor.event({
                ea: 'unsuccessful',
                ec: 'signup',
                el: 'Please provide a Valid Contact Number.'
            }).send()
            return res.redirect('/signup')
        }

        user = await findUserByParams({email: req.body.email})
        if (user) {
            req.flash('error', 'Email already exists. Please try again.')
            req.visitor.event({
                ea: 'unsuccessful',
                ec: 'signup',
                el: 'Email already exists. Please try again.'
            }).send()
            return res.redirect('/signup')
        }

        const passhash = await passutils.pass2hash(req.body.password)
        const query = {
            username: req.body.username.toLowerCase(),
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            gender: req.body.gender,
            graduationYear: req.body.gradYear,
            mobile_number: req.body.dial_code + '-' + req.body.mobile_number,
            email: req.body.email.toLowerCase(),
            demographic: {
                branchId: req.body.branchId,
                collegeId: req.body.collegeId,
            }
        }

        query.referralCode = generateReferralCode(req.body.username)

        if (req.body.refcode) {
            const userReferredBy = await findUserByParams({referralCode: req.body.refcode})
            query.referredBy = userReferredBy ? userReferredBy.get().id : null
        }

        if (req.session.marketingMeta) {
            query.marketing_meta = req.session.marketingMeta
        }


        let includes = [{model: models.User, include: [models.Demographic]}]

        try {
            let userLocal = await createUserLocal(query, passhash, includes)
            if (!userLocal) {
                req.flash('error', 'Error creating account! Please try in some time')
                req.visitor.event({
                    ea: 'unsuccessful',
                ec: 'signup',
                    el: 'Error creating account! Please try in some time'
                }).send()
                return res.redirect('/signup')
            }

            user = userLocal.user
        } catch (userCreationError) {
            req.flash('error', 'Error creating account! ' + userCreationError.message)
            req.visitor.event({
                ea: 'unsuccessful',
                ec: 'signup',
                el: 'Error creating account! Please try in some time'
            }).send()
            return res.redirect('/signup')
        }

        // Send welcome email
        mail.welcomeEmail(user.dataValues)

        // Send verification email
        await createVerifyEmailEntry(user, true,
            req.session && req.session.returnTo
        )

        req.flash('info',
            'Registered you successfully! ' +
            '<b>You can use your account only after verifying you email id.</b> ' +
            'Please verify your email using the link we sent you.')

        // delete the previous form
        delete req.session.prevForm

        req.visitor.event({
            ea: 'successful',
                    ec: 'signup',
            el: 'local'
        }).send()

        // session flag to identify new signup
        req.session.isNewSignup = true

        // Login after signup automatically
        passport.authenticate('local', {
            failureRedirect: '/login',
            successReturnToOrRedirect: '/users/me',
            failureFlash: true
        })(req, res)


    } catch (err) {
        Raven.captureException(err)
        req.flash('error', err.message)
        return res.redirect('/signup')
    }
})

module.exports = router
