const { models } = require('../db/models')

module.exports = {
  getAllBranches() {
    return models.Branch.findAll()
  }
}