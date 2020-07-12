/**
 * Created by hereisnaman on 01/07/20.
 */
const router = require('express').Router();
const passport = require('../../passport/passporthandler');

const config = require('../../../config');

router.get(
  '/',
  passport.authorize('discord', {
    scope: config.DISCORD_LOGIN_SCOPES,
  }),
);

router.get(
  '/callback',
  passport.authorize('discord', {
    failureRedirect: '/login',
  }),
  function(req, res) {
    res.redirect('/users/me');
  },
);

module.exports = router;
