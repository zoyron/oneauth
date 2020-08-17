/**
 * These are authentication strategies to authenticate the user.
 * For example - when user logs in with username+password
 * Or when we logs in via SSO like Facebook/Twitter etc.
 *
 * Created by championswimmer on 10/03/17.
 */

const BasicStrategy = require('passport-http').BasicStrategy
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy
const Raven = require('raven')
const { findClientById } = require('../../controllers/clients')


/**
 * Used as the #verify callback in the client strategies
 * @param clientId
 * @param clientSecret
 * @param done
 */
const verifyClient = async function (req, clientId, clientSecret, done) {
    try {
        const client = await findClientById(clientId)

        if (!client) {
            return done(null, false)
        }
        if (client.secret !== clientSecret) {
            return done(null, false)
        }
        
        req.client = client.get()

        return done(null, client)

    } catch (err) {
        Raven.captureException(err)
        done(err)
    }
}

/**
 * This is used to authenticate a _client_ with
 * Authorization: Basic <base64(clientId:clientSecret)>
 */
const basicStrategy = new BasicStrategy({passReqToCallback: true}, verifyClient)

const clientPasswordStrategy = new ClientPasswordStrategy({passReqToCallback: true}, verifyClient)


module.exports = {basicStrategy, clientPasswordStrategy}
