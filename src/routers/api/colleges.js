const router = require('express').Router()
const controller = require('../../controllers/colleges')

router.get('/', async (req, res) => {
  const result = await controller.getAllColleges(req, res)
  res.json(result)
})

module.exports = router