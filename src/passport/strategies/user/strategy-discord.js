/**
 * Created by hereisnaman on 01/07/20.
 */
const Raven = require('raven');
const DiscordStrategy = require('passport-discord').Strategy;

const models = require('../../../db/models').models;

const config = require('../../../../config');
const secrets = config.SECRETS;

/**
 * This is to authenticate _users_ using their
 * Discord accounts
 */

module.exports = new DiscordStrategy(
  {
    clientID: secrets.DISCORD_CONSUMER_KEY,
    clientSecret: secrets.DISCORD_CONSUMER_SECRET,
    callbackURL: config.SERVER_URL + config.DISCORD_CALLBACK,
    scopes: config.DISCORD_LOGIN_SCOPES,
    passReqToCallback: true,
  },
  async function(req, accessToken, refreshToken, profile, cb) {
    let oldUser = req.user;

    try {
      if (oldUser) {
        /*
            This means an already logged in users is trying to
            connect Discord to his account. Let us see if there
            are any connections to his discord already
             */
        const discordUser = await models.UserDiscord.findOne({
          where: { id: profile.id },
        });

        if (discordUser) {
          throw new Error(
            'Your Discord account is already linked with codingblocks account Id: ' +
              discordUser.dataValues.userId,
          );
        } else {
          await models.UserDiscord.upsert({
            id: profile.id,
            username: profile.username,
            accessToken,
            refreshToken,
            userId: oldUser.id,
          });

          const user = await models.User.findById(oldUser.id);

          if (user) {
            return cb(null, user.get());
          } else {
            return cb(err, null, {
              message: 'Could not retrieve existing Discord linked account',
            });
          }
        }
      }
    } catch (err) {
      Raven.captureException(err);
      return cb(null, false, { message: err.message });
    }
  },
);
