const { models } = require('../db/models')

module.exports = {
  getAllColleges(req, res) {
    return models.College.findAll()
  }
}