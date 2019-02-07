/**
 * Created by Tridev on 31/01/2019.
 */
const Raven = require('raven');
const LocalStrategy = require('passport-local').Strategy;
const models = require('../../../db/models').models;
const {findUserByParams} = require('../../../controllers/user');


module.exports = new LocalStrategy({
    passReqToCallback: true,
}, async function (req, mobile_number, otp, cb) {
    req.ga.event({
        category: 'login',
        action: 'attempt',
        label: 'otp_login'
    });

    Raven.setContext({extra: {file: 'otp_login_strategy'}});
    try {

        let user = await findUserByParams({verifiedmobile: mobile_number});

        if (!user) {
            return cb(null, false, {message: 'Invalid Username or Unverified Mobile Number'})
        }

        let lastLoginOTP = await models.UserMobileOTP.findOne({
            where: {
                mobile_number: mobile_number,
            },
            order: [['createdAt', 'DESC']]
        });

        if (!lastLoginOTP) {
            return cb(null, false, {message: 'Resend an OTP Again'});
        }

        if (lastLoginOTP.get('login_otp') === otp && !new Date(lastLoginOTP.dataValues.createdAt).getTime() < (new Date().getTime() - 10 * 60 * 1000)) {

            await lastLoginOTP.update({
                used_at: new Date()
            });

            return cb(null, user.get())

        } else {

            return cb(null, false, {message: 'You have entered an incorrect OTP.'});
        }

    } catch (err) {
        Raven.captureException(err);
        console.log(err);
        return cb(null, false, {message: 'Error connecting to user database'})
    }
});
