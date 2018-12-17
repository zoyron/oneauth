const generator = require("../utils/generator")
const urlutils = require("../utils/urlutils");
const { Organisation, OrgAdmin } = require("../db/models").models

function findOrganisationById(id) {
    return Organisation.findOne({
        where: { id }
    })
}

function findAllOrganisationsByUserId(userId) {
    return User.findAll(userId, {
        include: Organisation
    }).then(user => user.organisations)
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
        orgId: organisation.id,
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
        website: org.website
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