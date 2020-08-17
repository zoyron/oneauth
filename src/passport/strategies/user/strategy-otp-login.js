/**
 * Created by Tridev on 31/01/2019.
 */
const {isValidOtpForUser}  = require ("../../helpers");

const Raven = require('raven');
const LocalStrategy = require('passport-local').Strategy;
const models = require('../../../db/models').models;
const {findUserByParams} = require('../../../controllers/user');


module.exports = new LocalStrategy({
    passReqToCallback: true,
}, async function (req, mobile_number, otp, cb) {
    req.visitor.event({
        ec: 'login',
        ea: 'attempt',
        el: 'otp_login'
    }).send()

    Raven.setContext({extra: {file: 'otp_login_strategy'}});
    try {

        let user = await findUserByParams({verifiedmobile: mobile_number});

        if (!user) {
            return cb(null, false, {message: 'Invalid Username or Unverified Mobile Number'})
        }

        const valid = await isValidOtpForUser(user, otp)
        if (!valid) {
            return cb(null, false, {message: 'You have entered an incorrect OTP.'});
        }

        return cb(null, user.get())

    } catch (err) {
        Raven.captureException(err);
        console.log(err);
        return cb(null, false, {message: 'Error connecting to user database'})
    }
});
