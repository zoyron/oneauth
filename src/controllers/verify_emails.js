/**
 * @author championswimmer 2018-10-25
 */

const uid = require('uid2')

const {
    Verifyemail,
    User
} = require('../db/models').models
const mail = require('../utils/email')

/**
 * create a verify email entry and (optionally) send email
 * @param user {User}
 * @param [sendEmail] {boolean}
 * @returns {Verifyemail}
 */
async function createVerifyEmailEntry (user, sendEmail = false) {
    let uniqueKey = uid(15)

    let verifyEntry =  await Verifyemail.create({
        key: uniqueKey,
        userId: user.dataValues.id,
        include: [User]
    })

    if (sendEmail) {
        mail.verifyEmail(user.dataValues, verifyEntry.key)
    }

    return verifyEntry

}

/**
 * find verify entry with key
 * @param key
 * @returns {Promise<Verifyemail>}
 */
function findVerifyEmailEntryByKey(key) {
    return Verifyemail.findOne({
        where: {key}
    })
}

module.exports = {
    createVerifyEmailEntry,
    findVerifyEmailEntryByKey
}