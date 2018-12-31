/**
 * Created by championswimmer on 13/03/17.
 *
 * This route contains pages that are visible to public (without logging in)
 */
const Raven = require('raven')
const cel = require('connect-ensure-login')
const router = require('express').Router()
const {
    findAllBranches,
    findAllColleges,
    findAllCountries
} = require('../../controllers/demographics');

router.get('/login', cel.ensureNotLoggedIn('/'), function (req, res, next) {
    res.render('login', {
        pageTitle: "Login",
        error: req.flash('error')
    })
})
router.get('/signup', cel.ensureNotLoggedIn('/'), async function (req, res, next) {
    try {
        const [colleges, branches, countries] = await Promise.all([
            findAllColleges(),
            findAllBranches(),
            findAllCountries()
        ])
        res.render('signup', {
            pageTitle: "Signup",
            colleges,
            branches,
            countries
        })
    } catch (err) {
        Raven.captureException(err)
        res.flash('error','Error Fetching College and Branches Data.')
        res.redirect('/')
    }
})

router.get('/forgot/password/new/:key', cel.ensureNotLoggedIn('/'), function (req, res, next) {
    //FIXME: Check if the key is correct, and prevent rendering if so
    res.render('forgot/password/new', {
        pageTitle: "Set new Password",
        key: req.params.key
    })
})

router.get('/verifyemail/inter', cel.ensureLoggedIn('/login'), function (req, res, next) {

    res.render('verifyemail/inter', {
        pageTitle: "Verify Email"
    })

})

router.get('/client/add', cel.ensureLoggedIn('/login'), function (req, res, next) {
        res.render('client/add', {pageTitle: "Add New Client"})
    })

router.get('/organisation/add', cel.ensureLoggedIn('/login'), function (req, res, next) {
        res.render('/organisation/add', {pageTitle: "Add New Organisation"})
    })


module.exports = router
