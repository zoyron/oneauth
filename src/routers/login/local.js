/**
 * Created by championswimmer on 08/03/17.
 */
const router = require('express').Router();
const passport = require('../../passport/passporthandler');

router.post('/', passport.authenticate(['local', 'lms'], {
    failureRedirect: '/login',
    successReturnToOrRedirect: '/users/me',
    failureFlash: true
}));


router.post('/otp/done', function (req, res, next) {


    passport.authenticate('otp_login_strategy', function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('login_otp', {
                pageTitle: "Login with OTP",
                mobile_number:req.body.username,
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

});


// router.post('/otp/done', passport.authenticate('otp_login_strategy', {
//     failureRedirect: '/login',
//     successReturnToOrRedirect: '/users/me',
//     failureFlash: true
// }));


module.exports = router;
