
const {getValidatorArray} = require('./validators');
const { sendNoticeMails } = require('./email');
const {getContactDetails} = require('./contacts');

// getContactDetails();

getValidatorArray()
  .then( validatorsArray => validatorsArray.filter(validator => !validator.isUp24h))
  .then(offlineValidatorsArray =>
    {
    console.log("Got the online status for validators: ");
    return getContactDetails(offlineValidatorsArray);
    })
  .then(offlineContacts => {
    return sendNoticeMails(offlineContacts);
  });
