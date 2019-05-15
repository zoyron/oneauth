const request = require('request')
const { 
  EventSubscription,
  Client
} = require('../db/models').models

async function getSubscriptions(model, type) {
  return EventSubscription.findAll({
    where: {
      model,
      type
    }
  })
}

function sendEvent(subscriptions, model, type, id, userId) {
  return Promise.all(subscriptions.map(async subscription => {
    const client = await Client.findById(subscription.clientId)
    const webhookURL = client.webhookURL
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
