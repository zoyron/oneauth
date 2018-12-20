const Raven = require('raven')
const router = require('express').Router()
const cel = require('connect-ensure-login')
const acl = require('../../middlewares/acl')

const {
  findAllOrganisations,
  findAllOrganisationsByUserId,
  findOrganisationById,
  updateOrganisation,
  findAllAdmins,
  findAllMembers,
} = require('../../controllers/organisation')

const {
  findAllUsers
} = require('../../controllers/user')

router.get('/', cel.ensureLoggedIn('/login'), async function(req, res, next) {
    try {
      if (req.user.role == 'admin') {
        const organisations = await findAllOrganisations()
      } else {
          const organisations = await findAllOrganisationsByUserId(req.user.id)
      }
      return res.render('/organisation/all', {organisations: organisations})
    } catch (error) {
        Raven.captureException(error)
        req.flash('error','No organisations registered')
        res.redirect('user/me')
    }
})

router.get('/add',
    cel.ensureLoggedIn('/login'),
    function(req, res, next) {
        return res.render('organisation/add')
})

router.get('/:id',
    cel.ensureLoggedIn('/login'),
    async function(req, res, next) {
        try {
            const organisation = await findOrganisationById(req.params.id)
            if (!organisation) {
              return res.send("Invalid Organisation Id")
            }
            return res.render('organisation/id', {organisation: organisation})
        } catch (error) {
            Raven.captureException(error)
            req.flash('error', 'Error Getting Organisation')
            res.redirect('/users/me/organisations')
        }
})

router.get('/:id/edit',
    cel.ensureLoggedIn('/login'),
    async function(req, res, next) {
        try {
            const organisation = await findOrganisationById(req.params.id)
            if (!organisation) {
              return res.send("Invalid organisation Id")
            }
            return res.render('organisation/edit', {organisation: organisation})
        } catch (error) {
            Raven.captureException(error)
            req.flash('error', 'Error Getting Organisation')
            res.redirect('/users/me/organisations')
        }
})

router.get('/:id/admin',
    cel.ensureLoggedIn('/login'),
    async function(req, res, next) {
        try {
            const [organisation, admins] = await Promise.all([
                  findOrganisationById(req.params.id),
                  findAllAdmins(req.params.id)
            ])
            return res.render('organisation/admin/all', {organisation, admins})
        } catch (error) {
            Raven.captureException(error)
            req.flash('error', 'Error fetching Organisation details')
            res.redirect('/organisations/' + organisation.id)
        }
})

router.get('/:id/member',
    cel.ensureLoggedIn('/login'),
    async function(req, res, next) {
        try {
            const [organisation, members] = await Promise.all([
                  findOrganisationById(req.params.id),
                  findAllMembers(req.params.id)
            ])
            return res.render('organisation/member/all', {organisation, members})
        } catch (error) {
            Raven.captureException(error)
            req.flash('error', 'Error fetching Organisation details')
            res.redirect('/organisations/' + organisation.id)
        }
})

router.get('/:id/admin/add',
    cel.ensureLoggedIn('/login'),
    async function(req, res, next) {
        try {
            const [organisation, users] = await Promise.all([
                  findOrganisationById(req.params.id),
                  findAllUsers()
            ])
            return res.render('organisation/admin/add', {organisation, users})
        } catch (error) {
            Raven.captureException(error)
            req.flash('error', 'Error adding Admin')
            res.redirect('/organisations/' + organisation.id)
        }
})

router.get('/:id/member/add',
    cel.ensureLoggedIn('/login'),
    async function(req, res, next) {
        try {
            const [organisation, users] = await Promise.all([
                  findOrganisationById(req.params.id),
                  findAllUsers()
            ])
            return res.render('organisation/member/add', {organisation, users})
        } catch (error) {
            Raven.captureException(error)
            req.flash('error', 'Error adding Member')
            res.redirect('/organisations/' + organisation.id)
        }
})

module.exports = router