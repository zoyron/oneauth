const router = require('express').Router()
const controller = require('../../controllers/branches')

router.get('/', async (req, res) => {
  const result = await controller.getAllBranches(req, res)
  res.json(result)
})

module.exports = router