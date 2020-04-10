const { addCreditsToWallet } = require('../src/services/dukaan');

(async () => {
  const response = await addCreditsToWallet({ oneauthId: 6613, amount: 50 })
  console.log(response)
})()
  .then(() => process.exit(0))
  .catch(err => console.error(err.response.data.data[0].details))
