/**
 * Created by dhroovgupta7 on 27/09/18
 */


const route = require('express').Router();
const models = require('../db/models').models;
const cel = require('connect-ensure-login');
const {findUserById} = require('../controllers/user');
const Raven = require('raven');
const request = require('request');
const secrets = require('../../secrets');
const debug = require('debug')('mobileVerification:routes:verifymobile');
const sequelize = require('sequelize');
const {createAndSendOTP} = require('../controllers/verify_otp');


route.get('/', cel.ensureLoggedIn('/login'), async (req, res, next) => {


    try {
        const user = await findUserById(req.user.id);
        if (!user) {
            req.flash('Invalid user, Please login.');
            res.redirect('/login')
        }
        const key = Math.floor(100000 + Math.random() * 900000); //creates a 6 digit random number.

        const lastOTP = await models.VerifyMobile.findOne({  // Find the last OTP sent to this number.
            where: {
                mobile_number: user.dataValues.mobile_number,
            },
            order: [['createdAt', 'DESC']]
        });

        if (!lastOTP || new Date(lastOTP.dataValues.createdAt).getTime() < (new Date().getTime() - 10 * 60 * 1000)) {


            await models.VerifyMobile.upsert({
                mobile_number: user.dataValues.mobile_number,
                key: key,
                userId: req.user.id,
                include: [models.User]
            });

            createAndSendOTP(user.get('mobile_number'), key).then(function (body) {
                debug(body);
            }).catch(function (error) {
                throw new Error(error);
            });


            return res.render('verifymobile', {user})
        } else {
            return res.render('verifymobile', {user});
        }

    } catch (err) {
        Raven.captureException(err);
        req.flash('error', 'Could not verify mobile number.');
        res.redirect('/users/me')
    }
});

route.post('/verify', cel.ensureLoggedIn('/login'), async (req, res) => {

    try {

        if (req.body.otp.trim() === '') {
            req.flash('error', 'OTP cannot be empty');
            return res.redirect('/verifymobile')
        }

        const user = await models.User.findOne({
            where: {
                verifiedmobile: req.body.mobile_number
            }
        });

        if (user) {
            // Mobile Number already verified, take person to profile page
            req.flash('error', 'Mobile number already verified with codingblocks account ID:' + user.get('id'))
            return res.redirect('/users/me')
        }

        const key = await models.VerifyMobile.findOne({
            where: {
                userId: req.user.id,
            },
            order: [['createdAt', 'DESC']]
        });

        if (key.get('key') === req.body.otp && !new Date(key.dataValues.createdAt).getTime() < (new Date().getTime() - 10 * 60 * 1000)) {
            await models.User.update({verifiedmobile: req.body.mobile_number}, {
                where: {
                    id: req.user.id
                }
            });

            await key.destroy();

        } else {
            req.flash('error', 'You have entered an incorrect OTP.');
            return res.redirect('/verifymobile');
        }

        req.flash('info', 'Your mobile number is verified. Thank you.');
        return res.redirect('/users/me')

    } catch (err) {
        Raven.captureException(err);
        req.flash('error', 'Could not verify mobile number.');
        res.redirect('/users/me')
    }


});


route.post('/resend_otp', cel.ensureLoggedIn('/login'), async (req, res, next) => {

    try {
        const user = await findUserById(req.user.id);
        if (!user) {
            req.flash('Invalid user, Please login.');
            res.redirect('/login')
        } else {
            if (user.get('verifiedmobile')) {
                // Mobile Number already verified, take person to profile page
                req.flash('error', 'Mobile number already verified with codingblocks account ID:' + user.get('id'));
                return res.redirect('/users/me')
            }
        }
        const key = Math.floor(100000 + Math.random() * 900000); //creates a 6 digit random number.

        await models.VerifyMobile.destroy({
            where: {
                userId: user.dataValues.id
            }
        });

        await models.VerifyMobile.upsert({
            mobile_number: user.dataValues.mobile_number,
            key: key,
            userId: req.user.id,
            include: [models.User]
        });

        createAndSendOTP(user.mobile_number, key).then(function (body) {
            debug(body);
        }).catch(function (error) {
            throw new Error(error);
        });

        req.flash('info', 'OTP has been Resent');
        return res.render('verifymobile', {user})


    } catch
        (err) {
        Raven.captureException(err);
        req.flash('error', 'Could not verify mobile number.');
        res.redirect('/users/me')
    }


});

module.exports = route;