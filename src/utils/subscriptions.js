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
    if (webhookURL.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g))
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
