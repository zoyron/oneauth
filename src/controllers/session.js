/**
 * Created by prathambatra on 12/07/20.
 */

const {Session} = require('../middlewares/sessionstore')
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

module.exports = {
    closeOtherSessions,
    sessionsCount
};