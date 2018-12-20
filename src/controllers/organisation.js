const generator = require("../utils/generator")
const urlutils = require("../utils/urlutils");
const { Organisation, OrgAdmin, OrgMember, User } = require("../db/models").models
const { findUserById } = require('./user')

function findOrganisationById(id) {
    return Organisation.findOne({
        where: { id }
    })
}

function findAllOrganisationsByUserId(userId) {
    return User.findById(userId, {
        include: [{model:Organisation}]
    }).then(user => user.organisations)
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
      orgId: orgId
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
  let orgadmins = orgadmin.reduce(async (admins, admin) => {
    let user = await findUserById(admin.userId)
    let Admin = {
      name: user.firstname + ' ' + user.lastname,
      email: user.email,
      contact: user.mobile_number
    }
    admins.push(Admin)
    return admins
  }, [])
  return orgadmins
}

async function findAllMembers(orgId) {
  const orgmem = await OrgMember.findAll({
    where: { orgId }
  })
  let orgmems = orgmem.reduce(async (members, member) => {
    let user = await findUserById(member.userId)
    let Member = {
      name: user.firstname + ' ' + user.lastname,
      email: user.email
    }
    members.push(Member)
    return members
  }, [])
  return orgmems
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