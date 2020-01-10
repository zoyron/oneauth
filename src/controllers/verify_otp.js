/**
 * Created by  Tridev on 01-02-2019.
 */

const {
    VerifyMobile,
    User
} = require('../db/models').models;
const request = require('request');
const secrets = require('../../secrets');


const createAndSendOTP = function (mobile_number, otp, otp_purpose, otpHash = '') {
    return new Promise(function (resolve, reject) {
        let options = {
            method: 'POST',
            url: 'http://sms.smscollection.com/sendsmsv2.asp',
            qs: {
                user: secrets.MOBILE_VERIFY_USERNAME,
                password: secrets.MOBILE_VERIFY_PASS,
                sender: 'CDGBLK',
                text: `${otp} is the OTP for ${otp_purpose} valid for 10 mins. Do not share it with anyone. ${otpHash}`,
                PhoneNumber: mobile_number.replace("+", "").replace("-", "")
            }
        };
        request(options, function (error, response, body) {
            if (error) {
                //throw new Error(error)
                reject(error);
            } else {
                resolve(body);
            }
        });

    });
};

module.exports = {
    createAndSendOTP
};
