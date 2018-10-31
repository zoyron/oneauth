function redirectToEditProfile(req, res, next) {
    let returnTo = '/users/me'

    if (req.query && req.query.returnTo) {
        returnTo = req.query.returnTo
    }
    if (req.body && req.body.returnTo) {
        returnTo = req.query.returnTo
    }
    if (req.session && req.session.returnTo) {
        returnTo = req.query.returnTo
    }

    if (req.originalUrl.startsWith("/users/me/edit")) {
        // If going to edit page, do not stop
        return next()
    }
    if (req.user && (!req.user.email || !req.user.mobile_number)) {
        req.flash('error', 'You need to provide an email id and a mobile number to proceed')
        return res.redirect(`/users/me/edit/?returnTo=${returnTo}`)
    }
    return next()
}

module.exports = {
    redirectToEditProfile
}
