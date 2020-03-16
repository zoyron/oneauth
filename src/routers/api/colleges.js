const router = require('express').Router()
const controller = require('../../controllers/colleges')

router.get('/', (req, res) => {
  controller.getAllColleges(req, res).then(result => {
    return res.json(result)
  })
})

module.exports = router