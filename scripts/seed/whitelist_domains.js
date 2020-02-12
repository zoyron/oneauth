const { db } = require('../../src/db/models');

(async () => {
  db.query(`
    INSERT INTO whitelist_domains (domain, "createdAt", "updatedAt") (
      SELECT DISTINCT LOWER(SPLIT_PART(verifiedemail, '@', 2)), NOW(), NOW() FROM users WHERE verifiedemail IS NOT NULL
    )
  `)
})()
