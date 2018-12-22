const generator = require("../utils/generator")
const urlutils = require("../utils/urlutils");
const { Organisation, OrgAdmin, OrgMember, User } = require("../db/models").models
const { findUserById } = require('./user')

function findOrganisationById(id, includes) {
    return Organisation.findOne({
        where: { id },
        include: includes
    })
}

function findAllOrganisationsByUserId(userId) {
    return User.findById(userId, {
        include: [{model:Organisation}]
    }).then(user => {return user.organisations})
}

function findAllOrganisations() {
    return Organisation.findAll({})
}

async function createOrganisation(options, userId) {
    options.orgDomains.forEach(function(url, i, arr){
      arr[i] = urlutils.prefixHttp(url)
    })
    const organisation = await Organisation.create({
        id: generator.genNdigitNum(10),
        name: options.name,
        full_name: options.full_name,
        domain: options.orgDomains,
        website: options.website
    })
    await OrgAdmin.create({
        organisationId: organisation.id,
        userId: userId
    })
    return organisation
}

function updateOrganisation(options, orgId) {
    options.orgDomains.forEach(function(url, i, arr){
      arr[i] = urlutils.prefixHttp(url)
    })
    let update = {
        name: options.name,
        full_name: options.full_name,
        domain: options.orgDomains,
        website: options.website
    }
    return Organisation.update(update, {
        where: { id: orgId }
    })
}

function addOrgAdmin(orgId, userId) {
  return OrgAdmin.create({
      userId: userId,
      organisationId: orgId
  })
}

function addOrgMember(email, orgId, userId) {
  return OrgMember.create({
      userId: userId,
      orgId: orgId,
      email: email
  })
}

async function findAllAdmins(id) {
    const orgadmin = await OrgAdmin.findAll({
      where: {organisationId: id}
    })
    let admins = []

    for (let admin of orgadmin) {
        let user = await findUserById(admin.userId)
        let Admin = {
          name: user.firstname + ' ' + user.lastname,
          email: user.email
        }
        admins.push(Admin)
    }
    return admins
}

async function findAllMembers(id) {
    const orgmember = await OrgMember.findAll({
      where: {organisationId: id}
    })
    let members = []

    for (let member of orgmember) {
        let user = await findUserById(member.userId)
        let Member = {
          name: user.firstname + ' ' + user.lastname,
          email: user.email
        }
        members.push(Member)
    }
    return members
}

module.exports = {
  findOrganisationById,
  findAllOrganisationsByUserId,
  findAllOrganisations,
  createOrganisation,
  updateOrganisation,
  addOrgAdmin,
  addOrgMember,
  findAllAdmins,
  findAllMembers
}