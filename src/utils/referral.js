/**
 * Created by tdevm on 11/5/19.
 */

const generateReferralCode = function(username) {
    let result = (typeof username === 'string') ? username.substring(0, 3).toUpperCase() : '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let charactersLength = characters.length;
    while(result.length < 6) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const validateReferralCode = function(code) {

    // The code should have a length of 6 digits
    if(code.length !==6) return false;

    // check if the code is alphanumeric
    if(/^[a-z0-9]+$/i.test(code)) return true;
    else return false;
}


module.exports = {
    generateReferralCode,
    validateReferralCode
}