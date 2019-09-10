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
const { parseNumberEntireString, validateNumber } = require('../utils/mobile_validator')
const {generateReferralCode}  = require('../utils/referral')

router.post('/', makeGaEvent('submit', 'form', 'signup'), async (req, res) => {

    // store the posted data in the session
    req.session.prevForm = {
        username: req.body.username,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        dial_code: req.body.dial_code,
        mobile_number: req.body.mobile_number,
        email: req.body.email,
        refCode: req.body.refcode,
        gradYear: req.body.gradYear ?  req.body.gradYear : null,
        demographic: {
            branchId: req.body.branchId,
            collegeId: req.body.collegeId,
        }
    }

    if ((req.body.firstname.trim() === '') || (req.body.lastname.trim() === '')) {
        req.flash('error', 'Firstname and/or Lastname cannot be empty')
        return res.redirect('/signup')
    }
    if ((req.body.gender.trim() === '')) {
        req.flash('error', 'Gender cannot be empty')
        return res.redirect('/signup')
    }
    if (req.body.email.trim() === '') {
        req.flash('error', 'Email cannot be empty')
        return res.redirect('/signup')
    }
    if (req.body.mobile_number.trim() === '') {
        req.flash('error', 'Contact number cannot be empty')
        return res.redirect('/signup')
    }
    if ((req.body.password.trim() === '') || req.body.password.length < 5) {
        req.flash('error', 'Password too weak. Use 5 characters at least.')
        return res.redirect('/signup')
    }
    if (!req.body.gradYear || (req.body.gradYear < 2000 || req.body.gradYear > 2025)) {
        req.flash('error', 'Invalid Graduation year')
        return res.redirect('/signup')
    }

    try {

        let user = await findUserByParams({username: req.body.username})
        if (user) {
            req.flash('error', 'Username already exists. Please try again.')
            return res.redirect('/signup')
        }

        if(!(validateNumber(parseNumberEntireString(
            req.body.dial_code + '-' + req.body.mobile_number
        )))){
            req.flash('error', 'Please provide a Valid Contact Number.')
            return res.redirect('/signup')
        }

        user = await findUserByParams({email: req.body.email})
        if (user) {
            req.flash('error', 'Email already exists. Please try again.')
            return res.redirect('/signup')
        }

        const passhash = await passutils.pass2hash(req.body.password)
        const query = {
            username: req.body.username,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            graduationYear: req.body.gradYear,
            mobile_number: req.body.dial_code + '-' + req.body.mobile_number,
            email: req.body.email.toLowerCase(),
            demographic: {
                branchId: req.body.branchId,
                collegeId: req.body.collegeId,
            }
        }

        query.referralCode = generateReferralCode(req.body.username)

        if(req.body.refcode){
           const userReferredBy = await findUserByParams({referralCode: req.body.refcode })
           query.referredBy = userReferredBy ? userReferredBy.get().id : null
        }


        let includes = [{model: models.User, include: [models.Demographic]}]
        let userLocal = await createUserLocal(query, passhash, includes)
        if (!userLocal) {
            req.flash('error', 'Error creating account! Please try in some time')
            return res.redirect('/signup')
        }

        user = userLocal.user

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
