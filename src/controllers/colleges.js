const { models } = require('../db/models')

module.exports = {
  getAllColleges() {
    return models.College.findAll()
  }
}