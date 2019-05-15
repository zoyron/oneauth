const { 
  getSubscriptions,
  sendEvent
} = require('../../utils/subscriptions')

const getEventFunction = (type, sendType) => (clientId, userId) => {
  const subscriptions = await getSubscriptions('client', type)
  return sendEvent(subscriptions, 'client', sendType, clientId, userId)
}

module.exports = {
  eventUserCreated: getEventFunction('create', 'CREATED'),
  eventUserUpdated: getEventFunction('update', 'UPDATED'),
  eventUserDeleted: getEventFunction('delete', 'DELETED')
}
