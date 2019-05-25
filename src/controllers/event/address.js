const { 
  getSubscriptions,
  sendEvent
} = require('../../utils/subscriptions')

const getEventFunction = (type, sendType) => async (addressId, userId) => {
  const subscriptions = await getSubscriptions('address', type);
  return sendEvent(subscriptions, 'address', sendType, addressId, userId)
}

module.exports = {
  eventUserCreated: getEventFunction('create', 'CREATED'),
  eventUserUpdated: getEventFunction('update', 'UPDATED'),
  eventUserDeleted: getEventFunction('delete', 'DELETED')
}
