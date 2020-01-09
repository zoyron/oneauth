/**
 * Created by tdevm on 06/01/20.
 */


const {createAndSendOTP} = require("../../controllers/verify_otp");
const {parseNumberByCountry, validateNumber} = require("../../utils/mobile_validator");

const Raven = require('raven');
const router = require('express').Router()
const passport = require('../../passport/passporthandler')
const models = require('../../db/models').models;


const {findUserByParams} = require('../../controllers/user')
const {validateUsername} = require('../../utils/username_validator')
const debug = require('debug')('oauth_using_otp:routes:api:top')

router.post('/', passport.authenticate(['basic', 'oauth2-client-password'], {session: false}), async function (req, res, next) {

    try {
        const mobileCountry = await models.Country.findOne({
            where: {
                dial_code: req.body.username.substring(0, 3)
            }
        })

        if (!validateNumber(parseNumberByCountry(req.body.username.substring(3), mobileCountry.get().id))) {
            return res.status(400).json({err: 'INVALID_MOBILE_NUMBER'})
        }

        const user = await findUserByParams({verifiedmobile: req.body.username})
        const key = Math.floor(100000 + Math.random() * 900000) //creates a 6 digit random number.
        if (!user) {
            debug('Mobile no not verified or no user for OTP login via oauth2-client-password')
            return res.status(403).json({err: 'MOBILE_NOT_VERIFIED'})
        }
        await models.UserMobileOTP.upsert({
            mobile_number: user.dataValues.mobile_number,
            login_otp: key,
            userId: user.dataValues.id,
            include: [models.User]
        })

        createAndSendOTP(user.mobile_number, key, 'accessing your Coding Blocks Account')
        res.status(204).send()
    } catch (error) {
        Raven.captureException(error)
        res.status(500).json({error: 'Failed to send an OTP for oauth2-client-password strategy'})
    }
})

module.exports = router
