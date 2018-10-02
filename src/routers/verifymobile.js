/**
 * Created by dhroovgupta7 on 27/09/18
 */


const route = require('express').Router()
const models = require('../db/models').models
const cel = require('connect-ensure-login')
const {findUserById} = require('../controllers/user')
const Raven = require('raven')
const request = require('request')
const secrets = require('../../secrets')
const debug = require('debug')('mobileVerification:routes:verifymobile')

route.get('/', cel.ensureLoggedIn('/login'), async (req, res) => {

    try {

        const user = await findUserById(req.user.id)

        if (!user) {
            req.flash('Invalid user, Please login.')
            res.redirect('/login')
        }

        const key = Math.floor(Math.random() * 1000000) //creates a 6 digit random number.

        var options = {
            method: 'POST',
            url: 'http://sms.smscollection.com/sendsmsv2.asp',
            qs: {
                user: secrets.MOBILE_VERIFY_USERNAME,
                password: secrets.MOBILE_VERIFY_PASS,
                sender: 'CDGBLK',
                text: 'Your OTP for verification is ' + key,
                PhoneNumber: user.mobile_number
            }
        }

        request(options, function (error, response, body) {

            if (error) {
                throw new Error(error)
            }

            debug(body)
        })

        await models.Verifymobile.upsert({
            mobile_number: user.dataValues.mobile_number,
            key: key,
            userId: req.user.id,
            include: [models.User]
        })

        return res.render('verifymobile', {user})

    } catch (err) {
        Raven.captureException(err)
        req.flash('error', 'Could not verify mobile number.')
        res.redirect('/users/me')
    }
})

route.post('/verify', cel.ensureLoggedIn('/login'), async (req, res) => {

    try {

        if (req.body.otp.trim() === '') {
            req.flash('error', 'OTP cannot be empty')
            return res.redirect('/verifymobile')
        }

        const user = await models.User.findOne({
            where: {
                verifiedmobile: req.body.mobile_number
            }
        })

        if (user) {
            // Mobile Number already verified, take person to profile page
            req.flash('error', 'Mobile number already verified with codingblocks account ID:' + user.get('id'))
            return res.redirect('/users/me')
        }

        const key = await models.Verifymobile.findOne({
            where: {
                userId: req.user.id
            }
        })

        if (key.dataValues.key === req.body.otp) {
            await models.User.update({verifiedmobile: req.body.mobile_number}, {
                where: {
                    id: req.user.id
                }
            })

        } else {
            req.flash('error', 'You have entered an incorrect OTP.')
            return res.redirect('/verifymobile')
        }

        req.flash('info', 'Your mobile number is verified. Thank you.')
        return res.redirect('/users/me')

    } catch (err) {
        Raven.captureException(err)
        req.flash('error', 'Could not verify mobile number.')
        res.redirect('/users/me')
    }

})

module.exports = route