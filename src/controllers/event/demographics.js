const { 
  getSubscriptions,
  sendEvent
} = require('../../utils/subscriptions')

const getEventFunction = (type, sendType) => (demographicId, userId) => {
  const subscriptions = await getSubscriptions('demographic', type)
  return sendEvent(subscriptions, 'demographic', sendType, demographicId, userId)
}

module.exports = {
  eventUserCreated: getEventFunction('create', 'CREATED'),
  eventUserUpdated: getEventFunction('update', 'UPDATED'),
  eventUserDeleted: getEventFunction('delete', 'DELETED')
}
