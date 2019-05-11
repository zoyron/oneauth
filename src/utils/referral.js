/**
 * Created by tdevm on 11/5/19.
 */

const generateReferralCode = function(username) {
    if (!username) {
        return 'username is required to generate referral'
    }
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < 3; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return username.substring(0, 3).toUpperCase() + result;
}


module.exports = {
    generateReferralCode
}