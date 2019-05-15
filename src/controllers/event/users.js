const { 
  getSubscriptions,
  sendEvent
} = require('../../utils/subscriptions')

const getEventFunction = (type, sendType) => (userId) => {
  const subscriptions = await getSubscriptions('user', type)
  return sendEvent(subscriptions, 'user', sendType, userId, userId)
}

module.exports = {
  eventUserCreated: getEventFunction('create', 'CREATED'),
  eventUserUpdated: getEventFunction('update', 'UPDATED'),
  eventUserDeleted: getEventFunction('delete', 'DELETED')
}
