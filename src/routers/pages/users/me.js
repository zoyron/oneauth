const Raven = require('raven')
const cel = require('connect-ensure-login')
const router = require('express').Router()

const models = require('../../../db/models').models
const {
  hasNull
} = require('../../../utils/nullCheck')
const passutils = require('../../../utils/password')
const {
  deleteMinio
} = require('../../../utils/multer')

const {
  findUserById,
} = require('../../../controllers/user');
const {
  findAllClientsByUserId
} = require('../../../controllers/clients');
const {
  findAllOrganisations
} = require('../../../controllers/organisation');
const {
  findAllBranches,
  findAllColleges,
  findAllCountries,
  upsertDemographic
} = require("../../../controllers/demographics");
const {
  parseNumberEntireString,
  validateNumber
} = require('../../../utils/mobile_validator')
const { eventUserUpdated } = require("../../../controllers/event/users")
const { 
  sessionsCount,
  authTokensCount
} = require('../../../controllers/session')


router.get('/',
  cel.ensureLoggedIn('/login'),
  async function (req, res, next) {
    try {
      const user = await findUserById(req.user.id, [
        models.UserGithub,
        models.UserGoogle,
        models.UserFacebook,
        models.UserLms,
        models.UserTwitter,
        models.UserLinkedin,
        models.UserDiscord,
        {
          model: models.Demographic,
          include: [
            models.College,
            models.Branch,
            models.Company,
          ]
        }
      ]);
      const sessionCount = await sessionsCount(req.user.id);
      const authTokenCount = await authTokensCount(req.user.id);
      const multipleSessions = (sessionCount+authTokenCount > 1) ? true : false
      if (!user) {
        res.redirect('/login')
      }

      if (req.session.isNewSignup) {
        res.render('user/me', {
          user: user,
          addSignupTrackerScript: true,
          sessionCount: sessionCount+authTokenCount-1,
          multipleSessions: multipleSessions
        })
        return delete req.session.isNewSignup
      }

      return res.render('user/me', {
        user: user,
        sessionCount: sessionCount+authTokenCount-1,
        multipleSessions: multipleSessions
      })
      
    } catch (error) {
      Raven.captureException(error)
      res.status(500).json({
        error: error
      })
    }
  })

router.get('/edit',
  cel.ensureLoggedIn('/login'),
  async function (req, res, next) {
    try {
      const [user, colleges, branches, countries] = await Promise.all([
        findUserById(req.user.id, [{
          model: models.Demographic,
          include: [
            models.College,
            models.Branch,
            models.Company,
          ]
        }]),
        findAllColleges(),
        findAllBranches(),
        findAllCountries()
      ])
      if (!user) {
        res.redirect('/login')
      }
      if (user.dataValues.mobile_number) {
        const mobNoSplit = user.dataValues.mobile_number.split('-')
        if (mobNoSplit.length > 1) {
          user.dial_code = mobNoSplit[0]
          user.mobile_number = mobNoSplit[1]
        } else {
          user.mobile_number = mobNoSplit[0]
        }
      }

      const gradYears = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014,
        2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004, 2003, 2002, 2001, 2000]

      return res.render('user/me/edit', {
        user,
        colleges,
        branches,
        countries,
        gradYears
      })

    } catch (error) {
      Raven.captureException(error)
      res.flash('error', 'Error Fetching College and Branches Data.')
      res.redirect('/users/me')
    }

  }
)

router.post('/edit',
  cel.ensureLoggedIn('/login'),
  async function (req, res, next) {
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


    //exit if password doesn't match
    if ((req.body.password) && (req.body.password !== req.body.repassword)) {
      req.flash('error', 'Passwords do not match')
      return res.redirect('edit')
    }

    // Check name isn't null
    if (hasNull(req.body, ['firstname', 'lastname'])) {
      req.flash('error', 'Null values for name not allowed')
      return res.redirect('/')
    }

    if (req.body.mobile_number.trim() === '') {
      req.flash('error', 'Contact number cannot be empty')
      return res.redirect('/users/me/edit')
    }

    if (!req.body.gradYear || (req.body.gradYear < 2000 || req.body.gradYear > 2025)) {
      req.flash('error', 'Invalid Graduation year')
      return res.redirect('/users/me/edit')
    }


    try {
      if (!(validateNumber(parseNumberEntireString(
          req.body.dial_code + '-' + req.body.mobile_number
      )))) {
        req.flash('error', 'Contact number is not a valid number')
        return res.redirect('/users/me/edit')
      }
    } catch (e) {
      req.flash('error', 'Contact number is not a valid number')
      return res.redirect('/users/me/edit')
    }
      if (req.body.whatsapp_number.trim() != '') {
          try {
              if (!(validateNumber(parseNumberEntireString(
                  req.body.dial_code_wa + '-' + req.body.whatsapp_number
              )))) {
                  req.flash('error', 'Whatsapp number is not a valid number')
                  return res.redirect('/users/me/edit')
              }
          } catch (e) {
              req.flash('error', 'Whatsapp number is not a valid number')
              return res.redirect('/users/me/edit')
          }
      }


    try {
      const user = await findUserById(req.user.id, [models.Demographic])
      // user might have demographic, if not make empty
      const demographic = user.demographic || {};

      user.firstname = req.body.firstname
      user.lastname = req.body.lastname
      if (req.body.gender) {
        user.gender = req.body.gender
      }

      if (req.body.gradYear) {
        user.graduationYear = req.body.gradYear
      }

        if (req.body.apparelGoodiesSize) {
            user.apparelGoodiesSize = req.body.apparelGoodiesSize
        }

      // If mobile is verified and there is a change on update, update mobile_number, set verifiedmobile = null
      if(user.verifiedmobile && user.verifiedmobile!==req.body.dial_code + '-' + req.body.mobile_number){
          user.mobile_number = req.body.dial_code + '-' + req.body.mobile_number
          user.verifiedmobile = null
          // If mobile is verified and there no change on update, just update mobile_number
      }else if(user.verifiedmobile && user.verifiedmobile ===req.body.dial_code + '-' + req.body.mobile_number){
            user.mobile_number = req.body.dial_code + '-' + req.body.mobile_number
        }
      else{
          //If mobile is not verified, update mobile_number and set verifiedmobile = null
          user.mobile_number = req.body.dial_code + '-' + req.body.mobile_number
          user.verifiedmobile = null
      }
        if (req.body.whatsapp_number) {
            user.whatsapp_number = req.body.dial_code_wa + '-' + req.body.whatsapp_number
        }

      if (!user.verifiedemail && req.body.email !== user.email) {
        user.email = req.body.email
      }

      let prevPhoto = ""
      if (user.photo) {
        prevPhoto = user.photo.split('/').pop()
      }
      if (req.file) {
        user.photo = req.file.location
      } else if (req.body.avatarselect) {
        user.photo = `https://minio.codingblocks.com/img/avatar-${req.body.avatarselect}.svg`
      }

      await user.save()

      if ((req.file || req.body.avatarselect) && prevPhoto) {
        deleteMinio(prevPhoto)
      }

      // If am empty demographic, then insert userid
      if (!demographic.userId) {
        demographic.userId = req.user.id
      }

      if (req.body.branchId) {
        demographic.branchId = +req.body.branchId
      }
      if (req.body.collegeId) {
        demographic.collegeId = +req.body.collegeId
      }

      await upsertDemographic(
        demographic.id,
        demographic.userId,
        demographic.collegeId,
        demographic.branchId
      )

      if (req.body.password) {
        const passHash = await passutils.pass2hash(req.body.password)
        /*
         * We are upserting because there are two cases -
         *  a. userlocal with this userId exists,
         *     if he created account with email + password
         *  b. user created account via oauth2 means, so it doesn't exist
         */
        await models.UserLocal.upsert({
          userId: req.user.id,
          password: passHash
        })
      }
      res.redirect(returnTo)
      // do in side effects
      try {
        await eventUserUpdated(req.user.id)
      } catch (hookErr) {
        Raven.captureException(hookErr)
      }
    } catch (err) {
      Raven.captureException(err)
      req.flash('error', 'Error in Server')
      return res.redirect('/')
    }

  })

router.get('/clients',
  cel.ensureLoggedIn('/login'),
  async function (req, res, next) {
    try {
      const clients = await findAllClientsByUserId(req.user.id);
      return res.render('client/all', {
        clients: clients
      })
    } catch (error) {
      Raven.captureException(error)
      req.flash('error', 'Could not find any clients')
      res.redirect('/users/me')
    }
  }
)

router.get('/organisations',
  cel.ensureLoggedIn('/login'),
  async function (req, res, next) {
    try {
      const organisations = await findAllOrganisations()
      return res.render('organisation/all', {
        organisations: organisations
      })
    } catch (error) {
        Raven.captureException(error)
        req.flash('error', 'Could not find any organisations')
        res.redirect('/users/me')
    }
  }
)

module.exports = router
