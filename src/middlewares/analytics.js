const Raven = require('raven')

const setuserContextRaven = function (req, res, next) {
  if (req.authInfo) {
    if (req.authInfo.clientOnly) {
      return next()
    }
  }
  if (req.user) {
    if (req.authInfo)
      Raven.setContext({
        user: {
          username: req.user.dataValues.username,
          id: req.user.dataValues.id,
        },
      })
  }
  next()
}

const triggerGApageView = (req, res, next) => {
  if (!req.headers['x-forwarded-for']) {
    req.headers['x-forwarded-for'] = '0.0.0.0'
  }
  req.visitor
    .pageview({
      dh: config.SERVER_URL,
      dp: req.originalUrl,
      dr: req.get('Referer'),
      ua: req.headers['user-agent'],
      uip:
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.remoteAddress ||
        req.headers['x-forwarded-for'].split(',').pop(),
    })
    .send()
  next()
}

const setUtmParamsInGa = (req, res, next) => {
  if (req.cookies['_cbutm']) {
    try {
      const cookie = req.cookies['_cbutm']
      const utmJson = new Buffer(cookie, 'base64').toString('ascii')
      const utm = JSON.parse(utmJson)
      const cs = req.query['utm_source'] || utm['utm_source']
      const cm = req.query['utm_medium'] || utm['utm_medium']
      const cn = req.query['utm_campaign'] || utm['utm_campaign']

      if (cs) req.visitor.set('cs', cs)
      if (cm) req.visitor.set('cm', cm)
      if (cn) req.visitor.set('cn', cn)

      req.session.marketingMeta = {
        utm_campaign: cn,
        utm_source: cs,
        utm_medium: cm,
      }
    } catch (e) {
      Raven.captureException(e)
    }
  }
  next()
}

module.exports = {
  setuserContextRaven,
  triggerGApageView,
  setUtmParamsInGa,
}
