const { models } = require('../db/models')

module.exports = {
  getAllBranches(req, res) {
    return models.Branch.findAll()
  }
}