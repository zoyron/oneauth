const sgMail = require('@sendgrid/mail')
const config = require('../../config')
const Raven = require('raven')
sgMail.setApiKey(config.SECRETS.SENDGRID_API_KEY)
sgMail.setSubstitutionWrappers('{{', '}}')

const senderEmail = config.EMAIL_SENDER_ADDR


const welcomeEmail = function (user) {

    let msgTemplate = {}
    msgTemplate.template_id = config.WELCOME_EMAIL
    msgTemplate.from = senderEmail

    msgTemplate.to = {
        name: user.firstname,
        email: user.email,
    }

    msgTemplate.substitutions = {
        "subject": "Welcome to Codingblocks",
        "username": user.username,
    }

    return sgMail.send(msgTemplate)
        .then(() => {
            //  console.log('mail sent');
        })
        .catch(error => {
             Raven.captureException(error);
            console.error(error.toString())

        })


}

//Send a Single Email to Single Recipient to verify

const verifyEmail = function (user, key) {

    let msgTemplate = {}
    msgTemplate.template_id = config.VERIFY_EMAIL
    msgTemplate.from = senderEmail

    msgTemplate.to = user.email
    let link = "https://account.codingblocks.com/verifyemail/key/" + key

    msgTemplate.substitutions = {
        "subject": "Verify Email for Codingblocks Account",
        "username": user.username,
        "link": link
    }

    return sgMail.send(msgTemplate)

}


const forgotPassEmail = function (user, key) {

    let msgTemplate = {}
    msgTemplate.template_id = config.FORGOT_PASS_EMAIL
    msgTemplate.from = senderEmail

    msgTemplate.to = user.email

    let link = "https://account.codingblocks.com/forgot/password/new/" + key
    msgTemplate.substitutions = {
        "subject": "Forgot password Codingblocks",
        "username": user.username,
        "link": link
    }
    return sgMail.send(msgTemplate)

}


const setANewPassword = function (user, key) {

    let msgTemplate = {}
    msgTemplate.template_id = config.FORGOT_PASS_EMAIL
    msgTemplate.from = senderEmail

    msgTemplate.to = user.email

    let link = "https://account.codingblocks.com/forgot/password/new/" + key
    msgTemplate.substitutions = {
        "subject": 'Coding Blocks : Set a password for your account',
        "username": user.username,
        "link": link
    }
    return sgMail.send(msgTemplate)

}

//Send a Single Email to Single or Multiple Recipients where they don't see each others email addresses

const verifyMultipleEmails = function (userEmails) {

    let msgTemplate = {}
    msgTemplate.template_id = config.VERIFY_EMAIL
    msgTemplate.from = senderEmail

    msgTemplate.to = userEmails

    sgMail.sendMultiple(msgTemplate)
        .then(() => {
            //  console.log('mail sent');
        })
        .catch(error => {

            Raven.captureException(error)
            console.error(error.toString())

        })


}

const forgotUsernameEmail = function (user) {
    let msgTemplate = {}
    msgTemplate.template_id = config.FORGOT_USER_EMAIL
    msgTemplate.from = senderEmail

    msgTemplate.to = user.email

    msgTemplate.substitutions = {
        "subject": "Forgot username Codingblocks",
        "username": user.username,
        "firstname": user.firstname
    }
    return sgMail.send(msgTemplate)

}

const profileCompletionCredits = user => {
    let msgTemplate = {}
    msgTemplate.template_id = config.PROFILE_COMPLETION_CREDITS
    msgTemplate.from = senderEmail

    msgTemplate.to = user.email

    msgTemplate.substitutions = {
        "subject": "Credits added for successfully completing profile",
        "user": user.firstname,
        "credits": 1000
    }
    return sgMail.send(msgTemplate)
}


module.exports = {
    welcomeEmail,
    verifyEmail,
    forgotPassEmail,
    forgotUsernameEmail,
    verifyMultipleEmails,
    setANewPassword,
    profileCompletionCredits
}
