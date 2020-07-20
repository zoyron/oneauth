const { User, UserLocal, Demographic, College, Branch, Address, WhitelistDomains} = require("../db/models").models;
const { db }= require('../db/models')
const sequelize = require('sequelize');
const Raven = require('raven');

const { validateUsername } = require('../utils/username_validator')
const { eventUserCreated, eventUserUpdated } = require('./event/users')

function findAllUsers() {
  return User.findAll({})
}

function findUserById(id, includes) {
    return User.findOne({
        where: { id },
        include: includes
    });
}

function findUserByParams(params) {
    if (params.email) {
        params.email = {
            $iLike: params.email
        }
    }
    return User.findOne({where: params})
}

async function createUserLocal(userParams, pass, includes) {
    const email = userParams.email

    const isWhitelisted = await WhitelistDomains.count({
        where: {
            domain: {
                $iLike: email.split('@')[1]
            }
        }
    })

    if (!isWhitelisted) {
        throw new Error('Email domain not whitelisted')
    }
    const errorMessage = validateUsername(userParams.username) 
    if (errorMessage) throw new Error(errorMessage)
    let userLocal
    try {
        userLocal = await UserLocal.create({user: userParams, password: pass}, {include: includes})
    } catch (err) {
        Raven.captureException(err)
        throw new Error('Unsuccessful registration. Please try again.')
    }
    eventUserCreated(userLocal.user.id).catch(Raven.captureException.bind(Raven))
    return userLocal
}

async function createUserWithoutPassword(userParams) {
    const email = userParams.email

    const isWhitelisted = await WhitelistDomains.count({
        where: {
            domain: {
                $iLike: email.split('@')[1]
            }
        }
    })

    if (!isWhitelisted) {
        throw new Error('Email domain not whitelisted')
    }

    return User.create(userParams, {
        include: [{
            association: User.Demographic
        }]
    })
}

async function createUser(user) {
    const userObj = await User.create(user)
    eventUserCreated(userObj.id).catch(Raven.captureException.bind(Raven))
    return userObj
}


/**
 * update an user
 * @param userid id of user to modify
 * @param newValues object has to merge into old user
 * @returns Promise<User>
 */
async function updateUserById(userid, newValues, opts = {}) {
    const { 
      transaction = null 
    } = opts
    const updated = await User.update(newValues, {
        where: { id: userid },
        returning: true
    }, { transaction });
    eventUserUpdated(userid).catch(Raven.captureException.bind(Raven))
    return updated
}

/**
 * update an user with WHERE params
 * @param whereParams
 * @param newValues
 * @returns Promise<User>
 */
async function updateUserByParams(whereParams, newValues) {
    if (whereParams.email) {
        whereParams.email = {
            $iLike: whereParams.email
        }
    }
    const updated = await User.update(newValues, {
        where: whereParams,
        returning: true
    })
    const user = await User.findOne({
        attributes: ['id'],
        where: whereParams
    })
    eventUserUpdated(user.id).catch(Raven.captureException.bind(Raven))
    return updated
}

function findUserForTrustedClient(trustedClient, userId, query = {}) {
    return User.findOne({
        attributes: trustedClient ? undefined : ["id", "username", "photo", "graduationYear"],
        where: { id: userId },
        include: [
          {
            model: Demographic,
            include: [College, Branch, Address],
          },
          ...(query.include || [])
        ]
    });
}

function findAllUsersWithFilter(trustedClient, filterArgs) {
    return User.findAll({
        attributes: trustedClient ? undefined : ["id", "username", "email", "firstname", "lastname", "mobile_number"],
        where: generateFilter(filterArgs) || {},
    });
}

function generateFilter(filterArgs) {

    let whereObj = {}

    if (filterArgs.username) {
        whereObj.username = filterArgs.username
    }
    if (filterArgs.firstname) {
        whereObj.firstname = {
            $iLike: `${filterArgs.firstname}%`
        }
    }
    if (filterArgs.lastname) {
        whereObj.lastname = {
            $iLike: `${filterArgs.lastname}%`
        }
    }
    if (filterArgs.email) {
        let email = filterArgs.email

        //Testing if email has dots, i.e. ab.c@gmail.com is same as abc@gmail.com
        whereObj.email =  sequelize.where(
            sequelize.fn('replace', sequelize.col('email'), '.', ''),
            {[sequelize.Op.iLike]: sequelize.fn('replace', email, '.', '')}
        )

    }
    if (filterArgs.contact) {
        let contact = filterArgs.contact
        if(/^\d+$/.test(contact)) {
            whereObj.mobile_number = {
                like: `${contact}%`
            }
        } else {
            throw new Error("Invalid Phone Format")
        }
    }
    if (filterArgs.verified) {
        let verify = (filterArgs.verified === 'true')
        if (verify) {
            whereObj.verifiedemail = {
                $ne: null
            }
        } else {
            whereObj.verifiedemail = {
                $eq: null
            }
        }
    }
    return whereObj

}

async function clearSessionForUser (userId) {
    return db.query(`DELETE FROM SESSIONS WHERE "userId" = ${+userId}`)
}


module.exports = {
    findAllUsers,
    findUserById,
    findUserByParams,
    createUserLocal,
    updateUserById,
    updateUserByParams,
    findUserForTrustedClient,
    findAllUsersWithFilter,
    createUserWithoutPassword,
    clearSessionForUser
};
