const config = require('../../config');
const secret = config.SECRETS;
const debug = require('debug')('oauth:states.js')
const {db, models: {
        Country,
        State
    }} = require('../../src/db/models');

async function runSeed() {
    try {
        // await db.sync()
        const country = await Country.findOne({where: {id: 'IN'}})
        if (!country) { throw new Error("Country India is not yet added, so cannot add states")}


        await State.bulkCreate([
            { countryId: 'IN', name: 'Andhra Pradesh', id: 'INAP' },
            { countryId: 'IN', name: 'Arunachal Pradesh', id: 'INAR' },
            { countryId: 'IN', name: 'Assam', id: 'INAS' },
            { countryId: 'IN', name: 'Bihar', id: 'INBR' },
            { countryId: 'IN', name: 'Chhattisgarh', id: 'INCG' },
            { countryId: 'IN', name: 'Chandigarh', id: 'INCH' },
            { countryId: 'IN', name: 'Dadra and Nagar Haveli', id: 'INDN' },
            { countryId: 'IN', name: 'Daman and Diu', id: 'INDD' },
            { countryId: 'IN', name: 'Delhi', id: 'INDL' },
            { countryId: 'IN', name: 'Goa', id: 'INGA' },
            { countryId: 'IN', name: 'Gujarat', id: 'INGJ' },
            { countryId: 'IN', name: 'Haryana', id: 'INHR' },
            { countryId: 'IN', name: 'Himachal Pradesh', id: 'INHP' },
            { countryId: 'IN', name: 'Jammu and Kashmir', id: 'INJK' },
            { countryId: 'IN', name: 'Jharkhand', id: 'INJH' },
            { countryId: 'IN', name: 'Karnataka', id: 'INKA' },
            { countryId: 'IN', name: 'Kerala', id: 'INKL' },
            { countryId: 'IN', name: 'Madhya Pradesh', id: 'INMP' },
            { countryId: 'IN', name: 'Maharashtra', id: 'INMH' },
            { countryId: 'IN', name: 'Manipur', id: 'INMN' },
            { countryId: 'IN', name: 'Meghalaya', id: 'INML' },
            { countryId: 'IN', name: 'Mizoram', id: 'INMZ' },
            { countryId: 'IN', name: 'Nagaland', id: 'INNL' },
            { countryId: 'IN', name: 'Orissa', id: 'INOR' },
            { countryId: 'IN', name: 'Punjab', id: 'INPB' },
            { countryId: 'IN', name: 'Pondicherry', id: 'INPY' },
            { countryId: 'IN', name: 'Rajasthan', id: 'INRJ' },
            { countryId: 'IN', name: 'Sikkim', id: 'INSK' },
            { countryId: 'IN', name: 'Tamil Nadu', id: 'INTN' },
            { countryId: 'IN', name: 'Tripura', id: 'INTR' },
            { countryId: 'IN', name: 'Uttar Pradesh', id: 'INUP' },
            { countryId: 'IN', name: 'Uttarakhand', id: 'INUK' },
            { countryId: 'IN', name: 'West Bengal', id: 'INWB' }
        ])
        debug("Seed ran")

    } catch (err) {
        debug(err)
    } finally {
        process.exit()
    }
}

runSeed()