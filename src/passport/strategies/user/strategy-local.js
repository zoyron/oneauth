/**
 * Created by championswimmer on 07/05/17.
 */
const Raven = require('raven')
const {Op} = require('sequelize')
const LocalStrategy = require('passport-local').Strategy
const models = require('../../../db/models').models

const passutils = require('../../../utils/password')

const { createVerifyEmailEntry } = require('../../../controllers/verify_emails')


/**
 * This is to authenticate _users_ using a username and password
 * via a simple post request
 */

module.exports = new LocalStrategy({
    passReqToCallback: true,
}, async function (req, username, password, cb) {
    req.visitor.event({
        ec: 'login',
        ea: 'attempt',
        el: 'local'
    }).send()

    Raven.setContext({extra: {file: 'localstrategy'}});
    try {

        const userLocals = await models.UserLocal.findAll({
            include: [
                {
                    model: models.User,
                    where: {
                        [Op.or]: [
                            {username: username},
                            {email: username}// allow login via verified email too
                        ]
                    }
                }
            ],
        });

        if (!userLocals.length) {
            return cb(null, false, {message: 'Invalid Username'})
        }

        // pick one of the verified or the first one that matches
        const userLocal = userLocals.find(userLocal => userLocal.user.verifiedemail) || userLocals[0]
       
        if(!userLocal.user.verifiedemail && userLocal.user.username !== username) {
            await createVerifyEmailEntry(userLocal.user, true, '/users/me')
            return cb(null, false, {message: 'Unverified Email. Click on the link sent to your email address'})
        }

        const match = await passutils.compare2hash(password, userLocal.password);
        if (match) {
            return cb(null, userLocal.user.get())
        } else {
            return cb(null, false, {message: 'Invalid Password'});
        }

    } catch (err) {
        Raven.captureException(err);
        console.log(err);
        return cb(null, false, {message: 'Error connecting to user database'})
    }
});
