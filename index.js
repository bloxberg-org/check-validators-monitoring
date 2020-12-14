
const {getValidatorArray} = require('./validators');
const { sendNoticeMail } = require('./email');
const {getContactDetails} = require('./contacts');

// getContactDetails();

getValidatorArray()
  .then( validatorsArray => validatorsArray.filter(validator => !validator.isUp24h))
  .then(offlineValidatorsArray =>
    {
    console.log("Got the online status for validators: ");
    // console.log(offlineValidatorsArray);
    return getContactDetails(offlineValidatorsArray);
    })
  .then(offlineContacts => {
    console.log(offlineContacts);
    // for (let i=0; i<validatorsArray.length; i++) {
    for (let i=0; i<1; i++) { // Debug
      // sendNoticeMail(validatorsArray[i])
    }
  });
