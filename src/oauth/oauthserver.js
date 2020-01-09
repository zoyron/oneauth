/**
 * Created by championswimmer on 10/03/17.
 */
const {createVerifyEmailEntry} = require("../controllers/verify_emails");
const passutils = require("../utils/password");
const {findUserByParams} = require("../controllers/user");
const models = require('../db/models').models;
const Sequelize = require('sequelize');

const oauth = require('oauth2orize')
    , cel = require('connect-ensure-login')
    , passport = require('../passport/passporthandler')
    , debug = require('debug')('oauth:oauthserver')

const {
    createGrantCode,
    createAuthToken,
    findGrantCode,
    findAuthToken,
    findOrCreateAuthToken
} = require('../controllers/oauth');
const {findClientById} = require('../controllers/clients');

const {isValidPasswordForUser, isValidOtpForUser} = require('../passport/helpers')

const server = oauth.createServer()

server.serializeClient(function (client, done) {
    return done(null, client.id)
})

server.deserializeClient(async function (clientId, done) {
    try {
        const client = await findClientById(clientId);
        return done(null, client);
    } catch (error) {
        debug(error)
    }
})

/**
 * Generates a  _grant code_
 * that has to be exchanged for an access token later
 */
server.grant(oauth.grant.code(
    async function (client, redirectURL, user, ares, done) {
        debug('oauth: getting grant code for ' + client.id + ' and ' + user.id)
        try {
            const grantCode = await createGrantCode(client.id, user.id);
            return done(null, grantCode.code);
        } catch (error) {
            return done(error)
        }
    }
))
/**
 * Generate refresh token
 */
server.grant(oauth.grant.token(
    async function (client, user, ares, done) {
        try {
            const authToken = await createAuthToken(client.id, user.id);
            return done(null, authToken.token);
        } catch (error) {
            return done(error)
        }
    }
))

/**
 * Exchange **grant code** to get access token
 */
server.exchange(oauth.exchange.code(
    async function (client, code, redirectURI, done) {
        try {
            const grantCode = await findGrantCode(code)
            if (!grantCode) {
                return done(null, false) // Grant code does not exist
            }
            if (client.id !== grantCode.client.id) {
                return done(null, false) //Wrong Client ID
            }
            let callbackMatch = false
            for (let url of client.callbackURL) {
                if (redirectURI.startsWith(url)) callbackMatch = true
            }
            if (!callbackMatch) {
                return done(null, false) // Wrong redirect URI
            }
            const [authToken /*, created */] = await findOrCreateAuthToken(grantCode)
            grantCode.destroy()
            return done(null, authToken.token);
        } catch (error) {
            return done(error)
        }
    }
))

/**
 * Oauth2 Password grant type to issue access_token using resource owner's credentials.
 * To be used only if client have a backend to store its client_secret and authenticates via it.
 */

server.exchange(oauth.exchange.password(async (client, username, password, done) => {
    try {

        const [user, userMobile] = await Promise.all([
            models.User.findOne({
                where: {
                    [Sequelize.Op.or]: [
                        {username: username},
                        {verifiedemail: username}// allow login via verified email too
                    ]
                },
                include: {
                    model: models.UserLocal
                }
            }),
            findUserByParams({verifiedmobile: username})
        ])

        // user -> user with either this username or this verifiedemail
        // userMobile -> user with this verifiedmobile as username
        if (!user && !userMobile) {
            return done(null, false)
        }

        if (user) {
            // logging in with (email or username) and password

            // check for password match
            const valid = await isValidPasswordForUser(user.userlocal, password)

            if (!valid) {
                // wrong pass
                return done(null, false)
            }


            const token = await createAuthToken(client.id, user.get().id)
            return done(null, token.get().token)

        } else if (userMobile) {
            // trying to login using mobile
            const valid = await isValidOtpForUser(userMobile, password)

            if (!valid) {
                return done(null, false)
            }
            const token = await createAuthToken(client.id, userMobile.get().id)
            return done(null, token.get().token)
        }

    } catch (e) {
        return done(e)
    }

}))

//TODO: Implement all the other types of tokens and grants !

const authorizationMiddleware = [
    cel.ensureLoggedIn('/login'),
    server.authorization(async function (clientId, callbackURL, done) {
        debug('oauth: authorize')
        try {
            const client = await findClientById(clientId);
            debug(callbackURL)
            for (let url of client.callbackURL) {
                if (callbackURL.startsWith(url)) {
                    return done(null, client, callbackURL)
                }
            }
            return done(null, false);
        } catch (error) {
            debug(error)
        }
    }, async function (client, user, done) {
        // Auto approve if this is trusted client
        if (client.trusted) {
            return done(null, true)
        }
        try {
            const authToken = await findAuthToken(client.id, user.id)
            if (!authToken) {
                return done(null, false)
            } else {
                return done(null, true)
            }
        } catch (error) {
            return done(error);
        }

    }),
    function (req, res) {
        res.render("authdialog", {
            transactionID: req.oauth2.transactionID,
            user: req.user,
            client: req.oauth2.client
        })
    }
]

// Exchange the client id and password/secret for an access token. The callback accepts the
// `client`, which is exchanging the client's id and password/secret from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the client who authorized the code.

server.exchange(oauth.exchange.clientCredentials(async (client, scope, done) => {
    // Validate the client
    try {
        const localClient = await findClientById(client.get().id);
        if (!localClient) {
            return done(null, false);
        }
        if (localClient.get().secret !== client.get().secret) {
            // Password (secret) of client is wrong
            return done(null, false);
        }

        if (!localClient.get().trusted) {
            // Client is not trusted
            return done(null, false);
        }

        // Everything validated, return the token
        // const token = generator.genNcharAlphaNum(config.AUTH_TOKEN_SIZE)
        const authToken = await createAuthToken(client.get().id)
        return done(null, authToken.get().token)
    } catch (error) {
        debug(error)
    }
}));

const decisionMiddleware = [
    cel.ensureLoggedIn('/login'),
    server.decision()
]

const tokenMiddleware = [
    passport.authenticate(['basic', 'oauth2-client-password'], {session: false}),
    server.token(),
    server.errorHandler()
]
module.exports = {
    Middlewares: {tokenMiddleware, decisionMiddleware, authorizationMiddleware}
}
