const request = require('request')
const { 
  EventSubscriptions,
  Client
} = require('../db/models').models

function getSubscriptions(model, type) {
  return EventSubscriptions.findAll({
    where: {
      model,
      type
    },
    include: {
      model: Client
    }
  })
}

function sendEvent(subscriptions, model, type, id, userId) {
  return Promise.all(subscriptions.map(subsctiption => {
    const webhookURL = subsctiption.client.webhookURL
    return request.post(webhookURL, {
      type,
      model,
      success: 'true',
      id,
      userId
    })
  }))
}

module.exports = {
  getSubscriptions,
  sendEvent
}
