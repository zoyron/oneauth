const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

function parseNumber(number) {
    return phoneUtil.parseAndKeepRawInput(number, 'IN');
}

function validateNumber(number) {
    return phoneUtil.isValidNumber(number);
}

module.exports = {
    parseNumber,
    validateNumber
}