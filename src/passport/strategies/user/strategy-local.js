/**
 * Created by championswimmer on 07/05/17.
 */
const Raven = require('raven')
const {Op} = require('sequelize')
const LocalStrategy = require('passport-local').Strategy
const models = require('../../../db/models').models

const passutils = require('../../../utils/password')


/**
 * This is to authenticate _users_ using a username and password
 * via a simple post request
 */

module.exports = new LocalStrategy({
    passReqToCallback: true,
}, async function (req, username, password, cb) {
    req.ga.event({
        category: 'login',
        action: 'attempt',
        label: 'local'
    });

    Raven.setContext({extra: {file: 'localstrategy'}});
    try {

        const userLocal = await models.UserLocal.findOne({
            include: [
                {
                    model: models.User,
                    where: {
                        [Op.or]: [
                            {username: username},
                            {verifiedemail: { $iLike: username }} // allow login via verified email too
                        ]
                    }
                }
            ],
        });
        if (!userLocal) {
            return cb(null, false, {message: 'Invalid Username or Unverified Email'})
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
