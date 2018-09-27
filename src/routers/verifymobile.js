/**
 * Created by dhroovgupta7 on 27/09/18
 */


const route = require('express').Router()
const models = require('../db/models').models
const cel = require('connect-ensure-login')

route.get('/', cel.ensureLoggedIn('/login'), (req, res) => {

    const user = models.findOne({
        where: {
            id: req.user.id
        }
    })

    if (!user) {
        req.flash('Invalid user, Please login.')
        res.redirect('/login')
    }

    res.render('verifymobile', {user: user.dataValues})
})

module.exports = route