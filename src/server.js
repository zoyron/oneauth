/**
 * Created by championswimmer on 08/03/17.
 */
require('newrelic')
const express = require('express')
    , bodyParser = require('body-parser')
    , session = require('express-session')
    , passport = require('./passport/passporthandler')
    , path = require('path')
    , exphbs = require('express-hbs')
    , cookieParser = require('cookie-parser')
    , expressGa = require('express-universal-analytics')
    , flash = require('express-flash')
    , csurf = require('csurf')
    , Raven = require('raven')
    , debug = require('debug')('oneauth:server')


const config = require('../config')
    , secrets = config.SECRETS
    , {sessionStore, saveIp} = require('./middlewares/sessionstore')
    , {redirectToEditProfile} = require('./middlewares/profilevalidation')
    , loginrouter = require('./routers/login')
    , connectrouter = require('./routers/connect')
    , disconnectrouter = require('./routers/disconnect')
    , logoutrouter = require('./routers/logoutrouter')
    , signuprouter = require('./routers/signup')
    , verifyemailrouter = require('./routers/verifyemail')
    , verifymobilerouter = require('./routers/verifymobile')
    , apirouter = require('./routers/api')
    , oauthrouter = require('./routers/oauthrouter')
    , pagerouter = require('./routers/pages')
    , statusrouter = require('./routers/statusrouter')
    , {expresstracer, datadogRouter} = require('./utils/ddtracer')
    , {expressLogger} = require('./utils/logger')
    , handlebarsHelpers = require('./utils/handlebars')
    ,  { profilePhotoMiddleware } = require('./middlewares/profilephoto');

const app = express()

app.set('trust proxy', 'loopback, linklocal, uniquelocal')

// ============== START DATADOG
app.use(expresstracer)
// ================= END DATADOG
const redirectToHome = function (req, res, next) {

    if (req.path == '/') {
        const { utm_campaign } = req.query

        req.session.marketingMeta = {
            utm_campaign
        }

        return res.redirect('/users/me')
    }

    next()

}
const setuserContext = function (req, res, next) {
    if (req.authInfo) {
        if (req.authInfo.clientOnly) {
            return next()
        }
    }
    if (req.user) {
        if (req.authInfo)
            Raven.setContext({
                user: {
                    username: req.user.dataValues.username,
                    id: req.user.dataValues.id
                }

            })

    }
    next()
}
// ====================== START SENTRY
Raven.config(secrets.SENTRY_DSN).install()
app.use(Raven.requestHandler())
// ====================== END SENTRY

// ====================== Handlebars Config
app.engine('hbs', exphbs.express4({
    partialsDir: path.join(__dirname, '../views/partials'),
    layoutsDir: path.join(__dirname, '../views/layouts'),
    defaultLayout: 'views/layouts/main.hbs',
}))
app.set('views', path.join(__dirname, '../views'))
app.set("view engine", "hbs")
app.set('view cache', true)
// ====================== Handlebars Config


app.use('/status', statusrouter)
app.use(expressLogger)
app.use(express.static(path.join(__dirname, '../public_static')))
app.use(express.static(path.join(__dirname, '../submodules/motley/examples/public')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.use(session({
    store: sessionStore,
    secret: secrets.EXPRESS_SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    name: 'oneauth',
    cookie: {
        domain: config.COOKIE_DOMAIN,
        secure: false,
        maxAge: 86400000,
    }
}))
app.use(saveIp)
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())
app.use(setuserContext)
app.use(redirectToHome)
app.use(datadogRouter)
app.use(expressGa({
    uaCode: 'UA-83327907-12',
    autoTrackPages: false,
    cookieName: '_ga',
    reqToUserId: (req) => req.user && req.user.id
}))
app.use('/api', apirouter)
app.use(profilePhotoMiddleware)
app.use((req, res, next) => {
    if (!req.headers['x-forwarded-for']) {
        req.headers['x-forwarded-for'] = '0.0.0.0';
    }
    req.visitor.pageview({
        dh: config.SERVER_URL,
        dp: req.originalUrl,
        dr: req.get('Referer'),
        ua: req.headers['user-agent'],
        uip: (req.connection.remoteAddress
            || req.socket.remoteAddress
            || req.connection.remoteAddress
            || (req.headers['x-forwarded-for']).split(',').pop())
    }).send()
    next()
})
app.use('/oauth', oauthrouter)
app.use('/verifyemail', verifyemailrouter)
// app.use(csurf({cookie: false}))
app.use((req, res, next) => {
    res.locals.csrfToken = ""; // req.csrfToken() // Inject csrf to hbs views
    next()
})
app.use('/verifymobile', verifymobilerouter)
app.use('/logout', logoutrouter)
app.use('/signup', signuprouter)
app.use('/login', loginrouter)
app.use(redirectToEditProfile);
app.use('/disconnect', disconnectrouter)
app.use('/connect', connectrouter)
app.use('/', pagerouter)
app.get('*', (req, res) => res.render('404'));

app.use(Raven.errorHandler())

if(process.env.ONEAUTH_DEV === 'localhost'){
    Raven.captureException = (E) => console.error (E)
}

app.listen(process.env.PORT || 3838, function () {
    debug("Listening on " + config.SERVER_URL)
})