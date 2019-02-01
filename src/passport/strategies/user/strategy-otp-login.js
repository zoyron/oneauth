/**
 * Created by Tridev on 31/01/2019.
 */
const Raven = require('raven');
const LocalStrategy = require('passport-local').Strategy;
const models = require('../../../db/models').models;


module.exports = new LocalStrategy({
    passReqToCallback: true,
}, async function (req, otp, mobile_number, cb) {
    req.ga.event({
        category: 'login',
        action: 'attempt',
        label: 'otp_login'
    });

    Raven.setContext({extra: {file: 'otp_login_strategy'}});
    try {





    } catch (err) {
        Raven.captureException(err);
        console.log(err);
        return cb(null, false, {message: 'Error connecting to user database'})
    }
});
