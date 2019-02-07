/**
 * Created by championswimmer on 13/03/17.
 *
 * This route contains pages that are visible to public (without logging in)
 */
const Raven = require('raven');
const cel = require('connect-ensure-login');
const router = require('express').Router();
const models = require('../../db/models').models;
const {
    findAllBranches,
    findAllColleges,
    findAllCountries
} = require('../../controllers/demographics');
const {parseNumberByCountry, validateNumber} = require('../../utils/mobile_validator');
const {findUserByParams} = require('../../controllers/user');
const {createAndSendOTP} = require('../../controllers/verify_otp');
const debug = require('debug')('login_using_otp:routes:login_otp');
const passport = require('../../passport/passporthandler');


router.get('/login', cel.ensureNotLoggedIn('/'), function (req, res, next) {
    res.render('login', {
        pageTitle: "Login",
        error: req.flash('error')
    })
});

router.post('/login/otp', cel.ensureNotLoggedIn('/'), async (req, res, next) => {
    try {

        if (req.body.password) {
            passport.authenticate('otp', function (err, user, info) {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    return res.render('login_otp', {
                        pageTitle: "Login with OTP",
                        mobile_number: req.body.username,
                        info: req.flash('error', 'Incorrect OTP'),
                        error: req.flash('error')
                    })
                }
                req.login(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    return res.redirect('/users/me');
                });
            })(req, res, next);

        } else {

            if (!validateNumber(parseNumberByCountry(req.body.username, 'IN'))) {
                console.log('Invalid Mobile Number');
                req.flash('error', 'Please enter a valid 10 digit Mobile number.');
                return res.redirect('/');
            }

            let user = await findUserByParams({verifiedmobile: `+91-${req.body.username}`});

            const key = Math.floor(100000 + Math.random() * 900000); //creates a 6 digit random number.


            if (!user) {
                req.flash('error', 'Please verify your mobile number to login');
                console.log('Mobile no not verified or no user');
                return res.redirect('/');
            }

            await models.OTPLoginUser.upsert({
                mobile_number: user.dataValues.mobile_number,
                login_otp: key,
                userId: user.dataValues.id,
                include: [models.User]
            });

            createAndSendOTP(user.mobile_number, key, 'accessing your Coding Blocks Account')
                .then(function (body) {
                    debug(body);
                }).catch(function (error) {
                throw new Error(error);
            });

            res.render('login_otp', {
                pageTitle: "Login with OTP",
                info: req.flash('info', 'We have sent you an OTP on your number'),
                mobile_number: user.dataValues.mobile_number,
                error: req.flash('error')
            })

        }
    } catch (e) {
        Raven.captureException(e);
        req.flash('error', 'Error logging in with OTP.');
        res.redirect('/')
    }


});


router.post('/login/otp/resend', cel.ensureNotLoggedIn('/'), async (req, res, next) => {
    try {
        if (!validateNumber(parseNumberByCountry(req.body.username, 'IN'))) {
            console.log('Invalid Mobile Number');
            req.flash('error', 'Please enter a valid 10 digit Mobile number.');
            return res.redirect('/');
        }

        let user = await findUserByParams({verifiedmobile: req.body.username});

        const key = Math.floor(100000 + Math.random() * 900000); //creates a 6 digit random number.


        if (!user) {
            req.flash('error', 'Please verify your mobile number to login');
            console.log('Mobile no not verified or no user');
            return res.redirect('/');
        }

        await models.OTPLoginUser.upsert({
            mobile_number: user.dataValues.mobile_number,
            login_otp: key,
            userId: user.dataValues.id,
            include: [models.User]
        });

        createAndSendOTP(user.mobile_number, key, 'accessing your Coding Blocks Account')
            .then(function (body) {
                debug(body);
            }).catch(function (error) {
            throw new Error(error);
        });

        res.render('login_otp', {
            pageTitle: "Login with OTP",
            info: req.flash('info', 'We have resent you an OTP on your number'),
            mobile_number: user.dataValues.mobile_number,
            error: req.flash('error')
        })


    } catch (e) {
        Raven.captureException(e);
        req.flash('error', 'Error logging in with OTP.');
        res.redirect('/')
    }


});

router.get('/signup', cel.ensureNotLoggedIn('/'), async function (req, res, next) {
    try {
        const [colleges, branches, countries] = await Promise.all([
            findAllColleges(),
            findAllBranches(),
            findAllCountries()
        ]);
        res.render('signup', {
            pageTitle: "Signup",
            colleges,
            branches,
            countries
        })
    } catch (err) {
        Raven.captureException(err);
        res.flash('error', 'Error Fetching College and Branches Data.');
        res.redirect('/')
    }
});

router.get('/forgot/password/new/:key', cel.ensureNotLoggedIn('/'), function (req, res, next) {
    //FIXME: Check if the key is correct, and prevent rendering if so
    res.render('forgot/password/new', {
        pageTitle: "Set new Password",
        key: req.params.key
    })
});

router.get('/verifyemail/inter', cel.ensureLoggedIn('/login'), function (req, res, next) {

    res.render('verifyemail/inter', {
        pageTitle: "Verify Email"
    })

});

router.get('/client/add', cel.ensureLoggedIn('/login'), function (req, res, next) {
    res.render('client/add', {pageTitle: "Add New Client"})
});

router.get('/organisation/add', cel.ensureLoggedIn('/login'), function (req, res, next) {
    res.render('/organisation/add', {pageTitle: "Add New Organisation"})
});


module.exports = router;
