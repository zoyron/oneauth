const Raven = require('raven')
const passutils = require("../utils/password")
const models = require('../db/models').models
const UserController = require('../controllers/user')


const isValidOtpForUser = async (user, otp) => {
    try {
        const lastLoginOTP = await models.UserMobileOTP.findOne({
            where: {
                userId: user.get().id,
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
    const user = await models.User.findById(userMobile.id)
    if (!user) {
        throw new Error("Temp user not found")
    }
    return user.restore()
}


module.exports = {
    isValidOtpForUser, isValidPasswordForUser, makeTempOTPUserPermanent
}

