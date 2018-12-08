const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

function parseNumber(number) {
    return phoneUtil.parseAndKeepRawInput(number, 'IN');
}

function parseNumberEntireString(numberString) {
    return phoneUtil.parseAndKeepRawInput(numberString);
}

function parseNumberByCountry(number, country) {
    return phoneUtil.parseAndKeepRawInput(number, country)
}

function validateNumber(number) {
    return phoneUtil.isValidNumber(number);
}

module.exports = {
    parseNumber,
    parseNumberEntireString,
    validateNumber,
    parseNumberByCountry
}