
const {getValidatorArray} = require('./validators');
const { sendNoticeMail } = require('./email');

getValidatorArray()
  .then( validatorsArray => {
    console.log("Got the online status for validators: ");
    console.log(validatorsArray);
    // for (let i=0; i<validatorsArray.length; i++) {
    for (let i=0; i<1; i++) {
      sendNoticeMail(validatorsArray[i])
    }
  });
