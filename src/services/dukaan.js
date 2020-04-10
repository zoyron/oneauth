const Binder = require('../utils/binder')
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path')
const config = require('../../config');

class Dukaan{
  constructor({
    API, 
    NAMESPACE, 
    SECRET
  }) {
    this._API = API
    this._NAMESPACE = NAMESPACE
    this._SECRET = SECRET

    Binder.bind(this, Dukaan)
  }

  urlForEndpoint (url) {
    return this._API + '/' + path.join(this._NAMESPACE, url)
  }

  jwtForPayload (payload = {}) {
    return jwt.sign({
      data: {
        clientName: 'oneauth',
        ...payload
      }
    }, this._SECRET , { algorithm: 'HS256' })
  }

  addCreditsToWallet ({oneauthId, amount, comment = 'Added Via OneAuth'}) {
    const jwt = this.jwtForPayload({
      oneauthId
    })

    return axios({
      method: 'post',
      url: this.urlForEndpoint('/client/users/wallet'),
      data: {
        amount,
        comment
      },
      headers: {
        'dukaan-token': jwt
      }
    })
  }
}

module.exports = new Dukaan({
  API: config.SECRETS.DUKAAN.ENDPOINT,
  NAMESPACE: config.SECRETS.DUKAAN.NAMESPACE,
  SECRET: config.SECRETS.DUKAAN.SECRET
});
