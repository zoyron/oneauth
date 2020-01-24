const Raven = require('raven')
const passutils = require("../utils/password")
const models = require('../db/models').models
const UserController = require('../controllers/user')


const isValidOtpForUser = async (user, otp) => {
    try {
        const lastLoginOTP = await models.UserMobileOTP.findOne({
            where: {
                mobile_number: user.get().verifiedmobile,
                used_at: null
            },
            order: [['createdAt', 'DESC']]
        })

        if (!lastLoginOTP) {
            return false
        }

        if (lastLoginOTP.get('login_otp') === otp && (new Date(lastLoginOTP.dataValues.createdAt).getTime() > (new Date().getTime() - 10 * 60 * 1000))) {
            await lastLoginOTP.update({
                used_at: new Date()
            })
            return true
        }

        return false
    } catch (err) {
        Raven.captureException(err)
        return false
    }
}

const isValidPasswordForUser = async (user, password) => {
    return await passutils.compare2hash(password, user.password)
}

const makeTempOTPUserPermanent = async (userMobile) => {
    return models.User.findOne({
        where: {
            mobile_number: userMobile.mobile_number
        },
        paranoid: false
    }).then((user) => {
        if (!user) {
            throw new Error("Temp user not found")
        }
        return user.restore()
    }).catch((err) => {
        Raven.captureException(err)
    })
}

const isValidOtpForTempUser = async (tempUser, otp) => {
    try {
        const lastLoginOTP = await models.UserMobileOTP.findOne({
            where: {
                userId: tempUser.get().id,
                used_at: null
            },
            order: [['createdAt', 'DESC']]
        })

        if (!lastLoginOTP) {
            return false
        }

        if (lastLoginOTP.get('login_otp') === otp && (new Date(lastLoginOTP.dataValues.createdAt).getTime() > (new Date().getTime() - 10 * 60 * 1000))) {
            await lastLoginOTP.update({
                used_at: new Date()
            })
            return true
        }

        return false
    } catch (err) {
        Raven.captureException(err)
        return false
    }
}

module.exports = {
    isValidOtpForUser, isValidPasswordForUser, makeTempOTPUserPermanent, isValidOtpForTempUser
}

