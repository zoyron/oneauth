/**
 * Created by tdevm on 16/5/19.
 */


const Raven = require('raven');
const router = require('express').Router()
const passport = require('../../passport/passporthandler')

const {findAllColleges, findAllBranches} = require('../../controllers/demographics')

router.get('/',
    passport.authenticate('bearer', {session: false}),
    async function (req, res, next) {
        try {
            const colleges = await findAllColleges();
            const branches = await findAllBranches();
            res.json({colleges, branches});
        } catch (error) {
            Raven.captureException(error)
            res.status(400).json({error: 'Failed to fetch demographics'})
        }
    })

module.exports = router
