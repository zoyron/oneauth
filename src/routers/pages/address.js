const router = require('express').Router()
const cel = require('connect-ensure-login')
const Raven = require('raven')

const {
    findAddress,
    findAllAddresses,
    findAllStates,
    findAllCountries
} = require('../../controllers/demographics');

router.get('/',
    cel.ensureLoggedIn('/login'),
    async function (req, res, next) {
        try {
            const addresses = await findAllAddresses(req.user.id)
            return res.render('address/all', {addresses})
        } catch (error) {
            Raven.captureException(error)
            req.flash('error', 'Something went wrong trying to query address database')
            return res.redirect('/users/me')
        }
    }
)

router.get('/add',
    cel.ensureLoggedIn('/login'),
    async function (req, res, next) {
        if (req.query && req.query.returnTo) {
            req.session.returnTo = req.query.returnTo
            res.locals.returnTo = req.query.returnTo
        }
        try {
            const [states, countries] = await Promise.all([
                findAllStates(),
                findAllCountries()
            ])

            const userDetails = req.user;
            return res.render('address/add', {states, countries, userDetails})
        } catch (error) {
            Raven.captureException(error)
            res.send("Error Fetching Data.")
        }
    }
)

router.get('/:id',
    cel.ensureLoggedIn('/login'),
    async function (req, res, next) {
        try {
            const address = await findAddress(req.params.id,req.user.id );
            if (!address) {
                req.flash('error', 'Address not found')
                return res.redirect('.')
            }
            return res.render('address/id', {address})
        } catch (error) {
            Raven.captureException(error)
            req.flash('error', 'Something went wrong trying to query address database')
            return res.redirect('/users/me')
        }
    }
)


router.get('/:id/edit',
    cel.ensureLoggedIn('/login'),
    async function (req, res, next) {
        try {
            const [address, states, countries] = await Promise.all([
                findAddress(req.params.id,req.user.id ),
                findAllStates(),
                findAllCountries()
            ])
            if (!address) {
                req.flash('error', 'Address not found')
                return res.redirect('.')
            }
            return res.render('address/edit', {address, states, countries})
        } catch (err) {
            Raven.captureException(err)
            req.flash('error', 'Something went wrong trying to query address database')
            return res.redirect('/users/me')
        }
    }
)

router.get('/:id/delete', 
    cel.ensureLoggedIn('/login'),
    (async (req, res) => {
        try {
            const address = await findAddress(req.params.id,req.user.id )

            if(!address) {
                return res.send("Invalid Address Id")
            }

            await address.destroy()
            return res.redirect('/address/')
        }
        catch(err) {
            // Raven.captureException(err)
            console.log(err)
            req.flash('error', 'Something went wrong, could not delete address')
            res.redirect('/address/')
        }
    })
)

module.exports = router
