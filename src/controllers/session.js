/**
 * Created by prathambatra on 12/07/20.
 */

const {Session} = require('../middlewares/sessionstore')
const {AuthToken} = require('../db/models').models
const Op = require('sequelize').Op

function closeOtherSessions(userId,data) {
    return Session.destroy({
        where: {
            'userId': userId,
            'data': {
                [Op.ne]: data
            }
        },
        returning: true
    })
}

function sessionsCount(userId) {
    return Session.count({
        where: {
            'userId': userId
        }
    })
}

function deleteAuthTokens(userId) {
    return AuthToken.destroy({
        where: {
            'userId': userId
        },
        returning: true
    })
}

function authTokensCount(userId) {
    return AuthToken.count({
        where: {
            'userId': userId
        }
    })
}

module.exports = {
    closeOtherSessions,
    sessionsCount,
    deleteAuthTokens,
    authTokensCount
};