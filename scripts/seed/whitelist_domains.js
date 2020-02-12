const { db } = require('../../src/db/models');

(async () => {
  db.query(`
    INSERT INTO whitelist_domains (
      SELECT DISTINCT LOWER(SPLIT_PART(verifiedemail, '@', 2)) FROM users WHERE verifiedemail IS NOT NULL
    )
  `)
})()
