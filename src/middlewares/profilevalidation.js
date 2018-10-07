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

    if (req.path === "/users/me/edit") {
        return next()
    }
    if (req.user && (!req.user.email || !req.user.mobile_number)) {
        return res.redirect(`/users/me/edit/?returnTo=${returnTo}`)
    }
    return next()
}

module.exports = {
    redirectToEditProfile
}
