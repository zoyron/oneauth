const router = require('express').Router()
const controller = require('../../controllers/branches')

router.get('/', (req, res) => {
  controller.getAllBranches(req).then(result => {
    return res.json(result)
  })
})

module.exports = router