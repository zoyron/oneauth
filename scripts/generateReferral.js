/**
 * Created by tdevm on 14/5/19.
 */

const {
    db, models: {
        User
    }
} = require('.././src/db/models');
const {generateReferralCode} = require('../src/utils/referral');

User.findAll().then((users) => {
    let usersPromise  = [];
    users.forEach((user) => {
        if(!user.get().referralCode){
            usersPromise.push(user.update({
                referralCode: generateReferralCode(user.get().username)
            }))
        }
    });
    return usersPromise
}).then((usersPromise) => {
  return Promise.all(usersPromise)
}).then((updated) => {
    console.log('Referral code generation complete')
}).catch((err) => {
    console.error(err);
}).finally(() => {
    process.exit(0);
});