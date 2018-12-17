const Raven = require('raven')
const router = require('express').Router()
const cel = require('connect-ensure-login')
const { isURL } = require('../../utils/urlutils')

const {
    createOrganisation,
    updateOrganisation,
    addOrgAdmin,
    addOrgMember
} = require('../../controllers/organisation')


router.post('/add', cel.ensureLoggedIn('/login'),
    async function(req, res) {
      let options = {
          name: req.body.name,
          full_name: req.body.full_name,
          domain: req.body.domain,
          website: req.body.website
      }

      try {
          const org = await createOrganisation(options, req.user.id)
          res.redirect('/organisations/' + org.id)
      } catch (error) {
          Raven.captureException(error)
          req.flash('error', 'Could not create organisation')
          res.redirect('/users/me')
      }
})

router.post('/edit/:id', cel.ensureLoggedIn('/login'),
    async function(req, res) {
        try {
            let orgId = parseInt(req.params.id)
            let options = {
                name: req.body.name,
                full_name: req.body.full_name,
                domain: req.body.domain,
                website: req.body.website
            }
            await updateOrganisation(options, orgId)

            res.redirect('/organisations/' + orgId)
        } catch (error) {
            Raven.captureException(error)
            req.flash('error', 'Could not update organisation')
            res.redirect('/organisations/' + orgId)
        }
})

router.post('/:orgId/add_admin/:userId', cel.ensureLoggedIn('/login'),
    async function() {
        try {
            let orgId = parseInt(req.params.orgId)
            let userId = parseInt(req.params.userId)

            await addOrgAdmin(orgId, userId)
            res.redirect('/organisations/' + orgId)
        } catch (error) {
            Raven.captureException(error)
            req.flash('error', 'Could not add admin')
            res.redirect('/organisations/' + orgId)
        }
})

router.post('/:orgId/add_member/:userId', cel.ensureLoggedIn('/login'),
    async function() {
        try {
            let orgId = parseInt(req.params.orgId)
            let userId = parseInt(req.params.userId)

            await addOrgMember(orgId, userId)
            res.redirect('/organisations/' + orgId)
        } catch (error) {
            Raven.captureException(error)
            req.flash('error', 'Could not add member')
            res.redirect('/organisations/' + orgId)
        }
})
