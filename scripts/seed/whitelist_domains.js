const { db } = require('../../src/db/models');

(async () => {
  await db.query(`
    INSERT INTO whitelist_domains (domain, "createdAt", "updatedAt") (
      SELECT DISTINCT LOWER(SPLIT_PART(verifiedemail, '@', 2)), NOW(), NOW() FROM users WHERE verifiedemail IS NOT NULL
    )
  `)
  return db.query(`
    DELETE FROM whitelist_domains WHERE domain IN
      ( 'guerrillamail.com',
        'mailinator.com',
        'qq.com',
        'trash-mail.com',
        'yopmail.com'
      )  
  `)
})()
