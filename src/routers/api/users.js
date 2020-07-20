/**
 * Created by championswimmer on 10/03/17.
 *
 * This is the /api/v1/users path
 */

const router = require('express').Router()
const passport = require('../../passport/passporthandler')
const {db: sequelize, models} = require('../../db/models')
const makeGaEvent = require('../../utils/ga').makeGaEvent
const Raven = require('raven')
const {findUserById, findUserForTrustedClient, findAllUsersWithFilter} = require('../../controllers/user')
const {deleteAuthToken} = require('../../controllers/oauth')
const {findAllAddresses} = require('../../controllers/demographics')
const DukaanService = require('../../services/dukaan')

const passutils = require('../../utils/password')
const mail = require('../../utils/email')
const {generateReferralCode} = require('../../utils/referral')
const uid = require('uid2')
const {upsertDemographic, upsertAddress} = require("../../controllers/demographics")
const {createAddress} = require("../../controllers/demographics")
const {hasNull} = require('../../utils/nullCheck')
const {
    findUserByParams,
    createUserLocal,
    createUserWithoutPassword,
    clearSessionForUser
} = require('../../controllers/user')
const {
    createVerifyEmailEntry
} = require('../../controllers/verify_emails')
const {parseNumberEntireString, validateNumber} = require('../../utils/mobile_validator')
const {setVerifiedMobileNull} = require('../../controllers/demographics')
const {updateUserById} = require('../../controllers/user')


router.get('/',
    passport.authenticate('bearer', {session: false}),
    async function (req, res) {
        // Send the user his own object if the token is user scoped
        if (req.user && !req.authInfo.clientOnly && req.user.id) {
            if (req.params.id == req.user.id) {
                return res.send(req.user)
            }
        }

        let trustedClient = req.client && req.client.trusted
        try {
            let users = await findAllUsersWithFilter(trustedClient, req.query)
            if (!users) {
                throw new Error("User not found")
            }
            if (!Array.isArray(users)) {
                users = [users]
            }
            res.send(users)
        } catch (error) {
            res.send('Unknown user or unauthorized request')
        }
    }
)


router.get('/me',
    // Frontend clients can use this API via session (using the '.codingblocks.com' cookie)
    passport.authenticate(['bearer', 'session']),
    async function (req, res) {

        if (req.user && req.user.id) {
            let includes = []
            if (req.query.include) {
                let includedAccounts = req.query.include.split(',')
                for (let ia of includedAccounts) {
                    switch (ia) {
                        case 'facebook':
                            includes.push({
                                model: models.UserFacebook,
                                attributes: {exclude: ["accessToken", "refreshToken"]}
                            })
                            break
                        case 'twitter':
                            includes.push({model: models.UserTwitter, attributes: {exclude: ["token", "tokenSecret"]}})
                            break
                        case 'github':
                            includes.push({model: models.UserGithub, attributes: {exclude: ["token", "tokenSecret"]}})
                            break
                        case 'google':
                            includes.push({model: models.UserGoogle, attributes: {exclude: ["token", "tokenSecret"]}})
                            break
                        case 'linkedin':
                            includes.push({model: models.UserLinkedin, attributes: {exclude: ["token", "tokenSecret"]}})
                            break
                        case 'lms':
                            includes.push({model: models.UserLms, attributes: {exclude: ["accessToken"]}})
                            break
                        case 'discord':
                            includes.push({model: models.UserDiscord, attributes: {exclude: ["accessToken", "refreshToken"]}})
                            break
                        case 'demographic':
                            includes.push({model: models.Demographic, include: [models.College]})
                            break
                        case 'organisation':
                            includes.push({model: models.Organisation})
                            break
                    }
                }
            }
            try {
                const user = await findUserById(req.user.id, includes)
                if (!user) {
                    throw new Error("User not found")
                }
                res.send(user)
            } catch (error) {
                res.send('Unknown user or unauthorized request')
            }
        } else {
            return res.status(403).json({error: 'Unauthorized'})
        }
    })

router.get('/me/address',
    // Frontend clients can use this API via session (using the '.codingblocks.com' cookie)
    passport.authenticate(['bearer', 'session']),
    async function (req, res) {
        if (req.user && req.user.id) {
            let includes = [{
                model: models.Demographic,
                include: [models.Address]
            }]
            if (req.query.include) {
                let includedAccounts = req.query.include.split(',')
                for (let ia of includedAccounts) {
                    switch (ia) {
                        case 'facebook':
                            includes.push({
                                model: models.UserFacebook,
                                attributes: {exclude: ["accessToken", "refreshToken"]}
                            })
                            break
                        case 'twitter':
                            includes.push({model: models.UserTwitter, attributes: {exclude: ["token", "tokenSecret"]}})
                            break
                        case 'github':
                            includes.push({model: models.UserGithub, attributes: {exclude: ["token", "tokenSecret"]}})
                            break
                        case 'google':
                            includes.push({model: models.UserGoogle, attributes: {exclude: ["token", "tokenSecret"]}})
                            break
                        case 'linkedin':
                            includes.push({model: models.UserLinkedin, attributes: {exclude: ["token", "tokenSecret"]}})
                            break
                        case 'lms':
                            includes.push({model: models.UserLms, attributes: {exclude: ["accessToken"]}})
                            break
                    }
                }
            }
            try {
                const user = await findUserById(req.user.id, includes)
                if (!user) {
                    throw new Error("User not found")
                }
                res.send(user)
            } catch (error) {
                res.send('Unknown user or unauthorized request')
            }
        } else {
            return res.sendStatus(403)
        }
    })

router.get('/me/logout',
    passport.authenticate('bearer', {session: false}),
    async function (req, res) {
        if (req.user && req.user.id) {
            let token = req.header('Authorization').split(' ')[1]
            try {
                await deleteAuthToken(token)
                res.status(202).send({
                    'user_id': req.user.id,
                    'logout': "success"
                })
            } catch (error) {
                res.status(501).send(error)
            }
        } else {
            res.status(403).send("Unauthorized")
        }
    }
)

router.get('/logoutAll/:id',
    passport.authenticate('basic', {session: false}),
    async function (req, res) {
        await clearSessionForUser(req.params.id)
        res.sendStatus(204)
    }
)

router.get('/:id',
    passport.authenticate(['bearer', 'basic'], {session: false}),
    async function (req, res) {
        // Send the user his own object if the token is user scoped
        if (req.user && !req.authInfo.clientOnly && req.user.id) {
            if (req.params.id == req.user.id) {
                return res.send(req.user)
            }
        }
        let trustedClient = req.client && req.client.trusted
        const include = [];

        if (trustedClient && req.query.include) {
            let includedAccounts = req.query.include.split(',')
            includedAccounts.forEach( account => {
                switch (account) {
                    case 'facebook':
                        include.push({ model: models.UserFacebook })
                        break
                    case 'twitter':
                        include.push({model: models.UserTwitter})
                        break
                    case 'github':
                        include.push({model: models.UserGithub})
                        break
                    case 'google':
                        include.push({model: models.UserGoogle})
                        break
                    case 'linkedin':
                        include.push({model: models.UserLinkedin})
                        break
                    case 'lms':
                        include.push({model: models.UserLms})
                        break
                    case 'discord':
                        include.push({model: models.UserDiscord})
                        break
                    case 'organisation':
                        include.push({model: models.Organisation})
                        break
                }
            })
        }

        try {
            const user = await findUserForTrustedClient(trustedClient, req.params.id, { include })
            if (!user) {
                throw new Error("User not found")
            }
            res.send(user)
        } catch (error) {
            res.send('Unknown user or unauthorized request')
        }
    }
)
router.get('/:id/address',
    // Only for server-to-server calls, no session auth
    passport.authenticate('bearer', {session: false}),
    async function (req, res) {
        let includes = [{
            model: models.Demographic,
            include: [{model: models.Address, include: [models.State, models.Country]}]
        }]

        if (!req.authInfo.clientOnly) {
            // If user scoped token

            // Scoped to some other user: Fuck off bro
            if (req.params.id != req.user.id) {
                return res.status(403).json({error: 'Unauthorized'})
            }
        } else {
            // If not user scoped

            // Check if trusted client or not
            if (!req.client.trusted) {
                return res.status(403).json({error: 'Unauthorized'})
            }
        }
        try {
            const addresses = await findAllAddresses(req.params.id, includes)
            return res.json(addresses)
        } catch (error) {
            Raven.captureException(error)
            req.flash('error', 'Something went wrong trying to query address database')
            return res.status(500).json({error: error.message})
        }
    }
)

router.post('/',
    makeGaEvent('create', 'user', 'api'),
    passport.authenticate(['basic', 'oauth2-client-password'], {session: false}),
    async (req, res, next) => {

        if (hasNull(req.body, ['username', 'firstname', 'lastname', 'mobile_number', 'email'])) {
            res.status(400).json({error: 'Missing required params'})
        }

        try {
            let user = await findUserByParams({username: req.body.username})
            if (user) {
                return res.status(400).json({
                    err: 'USERNAME_ALREADY_EXISTS',
                    description: 'username already taken'
                })
            }

            if (!(validateNumber(parseNumberEntireString(
                req.body.dial_code + '-' + req.body.mobile_number
            )))) {
                return res.status(400).json({
                    err: 'INVALID_MOBILE_NUMBER',
                    description: 'please enter a valid mobile number'
                })
            }

            user = await findUserByParams({
                $or: [{
                    email:
                        {
                            $eq: req.body.email
                        }
                }, {
                    verifiedemail:
                        {
                            $eq: req.body.email
                        }
                }]
            })
            if (user) {
                return res.status(400).json({
                    err: 'EMAIL_ALREADY_EXISTS',
                    description: 'email address already exist'
                })
            }

            user = await findUserByParams({
                verifiedmobile: {
                    $eq: req.body.dial_code + '-' + req.body.mobile_number
                } 
            })

            if (user) {
                return res.status(400).json({
                    err: 'MOBILE_ALREADY_EXISTS',
                    description: 'mobile number already exist'
                })
            }

            let now = new Date()
            now.setMinutes(now.getMinutes() + 20) // timestamp
            now = new Date(now) // Date object
            const query = {
                username: req.body.username.toLowerCase(),
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                mobile_number: req.body.dial_code + '-' + req.body.mobile_number,
                email: req.body.email.toLowerCase(),
                deletedAt: now
            }

            const createdUser = await createUserWithoutPassword(query)

            if (!createdUser) {
                return res.status(400).json({error: 'Error creating account! Please try in some time'})
            }

            user = createdUser

            req.visitor.event({
                ea: 'successful',
                ec: 'signup',
                el: 'api',
            }).send()

            // Send welcome email
            mail.welcomeEmail(user.dataValues)

            // Send verification email
            await createVerifyEmailEntry(user, true,
                ''
            )

            //Sends a new mail to set a new account password
            let setNewPassword = await models.Resetpassword.create({
                key: uid(15),
                userId: user.dataValues.id,
                include: [models.User]
            })

            mail.setANewPassword(user.dataValues, setNewPassword.key)

            delete user.password
            res.status(200).json(user)

        } catch (err) {
            Raven.captureException(err)
            return res.status(400).json({error: 'Unsuccessful registration. Please try again.'})
        }

    })


router.post('/add',
    makeGaEvent('create', 'user', 'api'),
    passport.authenticate('bearer', {session: false}),
    async (req, res, next) => {

        if (hasNull(req.body, ['firstname', 'lastname', 'mobile_number', 'email', 'pincode', 'street_address', 'landmark', 'city', 'stateId',
            'countryId', 'dial_code', 'whatsapp_number', 'gender'])) {
            res.status(400).json({error: 'Missing required params'})
        }

        try {
            let user = await findUserByParams({username: req.body.username})
            if (user) {
                return res.status(400).json({error: 'Username already exists. Please try again.'})
            }

            if (!(validateNumber(parseNumberEntireString(
                req.body.dial_code + '-' + req.body.mobile_number
            )))) {
                return res.status(400).json({error: 'Please provide a Valid Contact Number.'})
            }

            user = await findUserByParams({email: req.body.email})
            if (user) {
                return res.status(400).json({error: 'Email already exists. Please try again.'})
            }

            const query = {
                username: req.body.username,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                gender: req.body.gender,
                mobile_number: req.body.dial_code + '-' + req.body.mobile_number,
                email: req.body.email.toLowerCase(),
                graduationYear: req.body.gradYear ? req.body.gradYear : null,
                referralCode: generateReferralCode(req.body.username),
                demographic: {
                    branchId: req.body.branchId,
                    collegeId: req.body.collegeId,
                }
            }

            let createdUser = await createUserWithoutPassword(query)
            if (!createdUser) {
                return res.status(400).json({error: 'Error creating account! Please try in some time'})
            }

            const options = {
                label: req.body.label || null,
                first_name: req.body.firstname,
                last_name: req.body.lastname,
                mobile_number: req.body.mobile_number,
                email: req.body.email.toLowerCase(),
                pincode: req.body.pincode,
                street_address: req.body.street_address,
                landmark: req.body.landmark,
                city: req.body.city,
                stateId: req.body.stateId,
                countryId: req.body.countryId,
                dial_code: req.body.dial_code,
                demographicId: createdUser.get().demographic.id,
                whatsapp_number: req.body.whatsapp_number || null,
                // if no addresses, then first one added is primary
                primary: true
            }

            const address = await createAddress(options)

            user = createdUser

            req.visitor.event({
                ea: 'successful',
                ec: 'signup',
                el: 'api',
            }).send()

            // Send welcome email
            mail.welcomeEmail(user.dataValues)

            // Send verification email
            await createVerifyEmailEntry(user, true,
                ''
            )

            //Sends a new mail to set a new account password
            let setNewPassword = await models.Resetpassword.create({
                key: uid(15),
                userId: user.dataValues.id,
                include: [models.User]
            })

            mail.setANewPassword(user.dataValues, setNewPassword.key)

            delete user.password
            res.status(200).json(user)

        } catch (err) {
            Raven.captureException(err)
            return res.status(400).json({error: 'Unsuccessful registration. Please try again.'})
        }

    })


router.post('/edit',
    makeGaEvent('update', 'user', 'api'),
    passport.authenticate('bearer', {session: false}),
    async function (req, res, next) {

        // Check if update body has null params
        if (hasNull(req.body, ['oneauthId', 'firstname', 'lastname', 'mobile_number', 'pincode', 'street_address', 'landmark', 'city', 'stateId',
            'countryId', 'dial_code', 'whatsapp_number'])) {
            res.status(400).json({error: 'Missing required params'})
        }

        // Find resource (user) with id
        const user = await findUserById(req.body.oneauthId, [{model: models.Demographic, include: [models.Address]}])


        if (!user) {
            return res.status(404).json({error: 'Resource to be updated not found.'})
        }


        if (!req.body.gradYear || (req.body.gradYear < 2000 || req.body.gradYear > 2026)) {
            return res.status(400).json({error: 'Graduation year is not valid'})
        }

        try {
            if (!(validateNumber(parseNumberEntireString(
                req.body.dial_code + '-' + req.body.mobile_number
            )))) {
                return res.status(400).json({error: 'Please provide a Valid Contact Number.'})
            }
        } catch (e) {
            return res.status(400).json({error: 'Please provide a Valid Contact Number.'})
        }


        const userWithVerifiedNumber = await findUserByParams({verifiedmobile: `${req.body.dial_code}-${req.body.mobile_number}`})


        // Check if mobile number to be updated, is verified with any other account
        if (userWithVerifiedNumber && user.get().id !== userWithVerifiedNumber.get().id) {
            return res.status(400).json({error: `${req.body.mobile_number} is already associated with coding blocks account ${userWithVerifiedNumber.get().id}`})
        }

        try {
            // user might have demographic, if not make empty
            const demographic = user.demographic || {}

            user.firstname = req.body.firstname
            user.lastname = req.body.lastname
            if (req.body.gender) {
                user.gender = req.body.gender
            }

            if (req.body.gradYear) {
                user.graduationYear = req.body.gradYear
            }

            // If mobile is verified and there is a change on update, update mobile_number, set verifiedmobile = null
            if (user.verifiedmobile && user.verifiedmobile !== req.body.dial_code + '-' + req.body.mobile_number) {
                user.mobile_number = req.body.dial_code + '-' + req.body.mobile_number
                user.verifiedmobile = null
                // If mobile is verified and there no change on update, just update mobile_number
            } else if (user.verifiedmobile && user.verifiedmobile === req.body.dial_code + '-' + req.body.mobile_number) {
                user.mobile_number = req.body.dial_code + '-' + req.body.mobile_number
            } else {
                //If mobile is not verified, update mobile_number and set verifiedmobile = null
                user.mobile_number = req.body.dial_code + '-' + req.body.mobile_number
                user.verifiedmobile = null
            }


            await user.save()


            // If an empty demographic, then insert userid
            if (!demographic.userId) {
                demographic.userId = user.get().id
            }

            if (req.body.branchId) {
                demographic.branchId = +req.body.branchId
            }
            if (req.body.collegeId) {
                demographic.collegeId = +req.body.collegeId
            }

            const updatedDemographics = await upsertDemographic(
                demographic.id,
                user.get().id,
                demographic.collegeId,
                demographic.branchId
            )

            const updatedUserDemographics = await findUserById(req.body.oneauthId, [models.Demographic])

            const addressOptions = {
                label: req.body.label || null,
                first_name: req.body.firstname,
                last_name: req.body.lastname,
                mobile_number: req.body.mobile_number,
                email: req.body.addressEmail ? req.body.addressEmail.toLowerCase() : updatedUserDemographics.get().email,
                pincode: req.body.pincode,
                street_address: req.body.street_address,
                landmark: req.body.landmark,
                city: req.body.city,
                stateId: req.body.stateId,
                countryId: req.body.countryId,
                dial_code: req.body.dial_code,
                whatsapp_number: req.body.whatsapp_number || null,
                // if no addresses, then first one added is primary
                primary: true
            }

            if (req.body.address_id) {
                addressOptions.id = req.body.address_id
            } else {
                addressOptions.demographicId = updatedUserDemographics.get().demographic.id
            }

            const updatedAddress = upsertAddress(addressOptions)

            res.status(200).json({success: 'Profile updated successfully'})
        } catch (err) {
            Raven.captureException(err)
            return res.status(400).send({err: 'Failed to update user details'})
        }

    })


router.patch('/:id',
    makeGaEvent('update', 'user', 'api'),
    passport.authenticate(['basic', 'oauth2-client-password'], {session: false}),
    async (req, res, next) => {

        if (req.body.mobile_number) {
            try {
                if (!(validateNumber(parseNumberEntireString(
                    req.body.dial_code + '-' + req.body.mobile_number
                )))) {
                    return res.status(400).json({error: 'Please provide a Valid Contact Number.'})
                }
            } catch (e) {
                return res.status(400).json({error: 'Please provide a Valid Contact Number.'})
            }
        }


        try {
            const user = await findUserById(req.params.id, [models.Demographic])
            // user might have demographic, if not make empty
            const demographic = user.demographic || {}

            const update = {
                ...(req.body.firstname && {firstname: req.body.firstname}),
                ...(req.body.lastname && {lastname: req.body.lastname}),
                ...(req.body.gender && {gender: req.body.gender}),
                ...(req.body.gradYear && {graduationYear: req.body.gradYear}),
                ...(req.body.mobile_number && {
                    mobile_number: req.body.dial_code + '-' + req.body.mobile_number
                }),
                ...(setVerifiedMobileNull(user.verifiedmobile,
                    req.body.dial_code + '-' + req.body.mobile_number
                ) && req.body.mobile_number && {verifiedmobile: null}),
                ...(req.body.verifiedmobile && {verifiedmobile: req.body.verifiedmobile})
            }

            await updateUserById(user.id, update)


            // If an empty demographic, then insert userid
            if (!demographic.userId) {
                demographic.userId = req.params.id
            }

            await upsertDemographic(
                demographic.id,
                demographic.userId,
                req.body.collegeId ? +req.body.collegeId : demographic.collegeId,
                req.body.branchId ? +req.body.branchId : demographic.branchId,
            )
            res.status(200).json({success: 'User details updated'})
        } catch (err) {
            Raven.captureException(err)
            return res.status(400).send({err: 'Failed to update user details'})
        }

    })

router.patch('/me/edit',
    makeGaEvent('update', 'user_self', 'api'),
    passport.authenticate('session'),
    async (req, res, next) => {
        try {
            const result = await sequelize.transaction(async t => {
                const user = await findUserById(req.user.id, [models.Demographic])
                // user might have demographic, if not make empty
                const demographic = user.demographic || {}

                const update = {
                    ...(req.body.firstname && {firstname: req.body.firstname}),
                    ...(req.body.lastname && {lastname: req.body.lastname}),
                    ...(req.body.gender && {gender: req.body.gender}),
                    ...(req.body.gradYear && {graduationYear: req.body.gradYear}),
                    ...(req.body.mobile_number && {
                        mobile_number: req.body.dial_code + '-' + req.body.mobile_number
                    }),
                    ...(setVerifiedMobileNull(user.verifiedmobile,
                        req.body.dial_code + '-' + req.body.mobile_number
                    ) && req.body.mobile_number && {verifiedmobile: null}),
                    ...(req.body.verifiedmobile && {verifiedmobile: req.body.verifiedmobile})
                }

                await updateUserById(user.id, update, {transaction: t})

                // If an empty demographic, then insert userid
                if (!demographic.userId) {
                    demographic.userId = req.user.id
                }

                await upsertDemographic(
                    demographic.id,
                    demographic.userId,
                    req.body.collegeId ? +req.body.collegeId : demographic.collegeId,
                    req.body.branchId ? +req.body.branchId : demographic.branchId,
                    req.body.otherCollege ? req.body.otherCollege : demographic.otherCollege,
                    {transaction: t}
                )

                // TODO: Dukaan credit hook
                if (
                    (user.demographic.collegeId === 1 && !user.demographic.otherCollege) && // OLD State
                    (req.body.collegeId !== 1 || req.body.otherCollege) // NEW State
                ) {
                    await DukaanService.addCreditsToWallet({
                        oneauthId: user.id,
                        amount: 1000,
                        comment: 'Reward for Adding college'
                    })
                    // Send Email for credits added
                    mail.profileCompletionCredits(user)
                }
            })
            res.status(200).json({success: 'User details updated'})
        } catch (err) {
            Raven.captureException(err)
            return res.status(400).send({err: 'Failed to update user details'})
        }
    })


router.post(
    '/verifyemail',
    makeGaEvent('create', 'verifyemail', 'api'),
    passport.authenticate('bearer', {session: false}),
    async (req, res, next) => {

        try {
            if (!req.body.email || req.body.email.trim() === '') {
                req.flash('error', 'Email cannot be empty')
                return res.status(400).json({error: ' Email cannot be empty'})
            }
            let user = await findUserByParams({
                verifiedemail: req.body.email
            })
            if (!user) {
                //Email not verified, go to next middleware
                return next()
            } else {
                // Email already verified, take person to profile page
                return res.status(400).json({error: 'Email already verified with codingblocks account ID:' + user.get('id')})
            }
        } catch (err) {
            Raven.captureException(err)
            return res.status(400).json({error: 'Something went wrong. Please try again with your registered email.'})
        }
    },
    async (req, res) => {
        try {

            let user = await findUserByParams({
                email: req.body.email,
            })
            if (!user) {
                // No user with this email
                return res.status(400).json({error: 'This email is not registered with this codingblocks account.'})
            }
            await createVerifyEmailEntry(user, true,
                req.body.returnTo ? req.body.returnTo : null
            )
            return res.status(200).json({success: 'Verification email sent'})

        } catch (err) {
            Raven.captureException(err)
            return res.status(400).json({error: 'Something went wrong. Please try again with your registered email.'})
        }
    }
)

module.exports = router
