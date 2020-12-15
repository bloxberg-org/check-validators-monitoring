
const {getValidatorArray} = require('./validators');
const { sendNoticeMails } = require('./email');
const {getContactDetails} = require('./contacts');
const schedule = require('node-schedule');
const logger = require('./logger');

// let i = 0;
// schedule.scheduleJob('*/3 * * * * *', function(fireDate){
//   i += 3;
//   logger.log(i + ' seconds passed');
//   logger.log(fireDate);
//   logger.log(new Date())
//   logger.log()
// });

checkValidatorsAndSendEmails();

function checkValidatorsAndSendEmails() {
  getValidatorArray()
    .then( validatorsArray => validatorsArray.filter(validator => !validator.isUp24h))
    .then(offlineValidatorsArray =>
      {
      logger.log("Got the online status for validators: ");
      return getContactDetails(offlineValidatorsArray);
      })
    .then(offlineContacts => {
      return sendNoticeMails(offlineContacts);
    })
    .catch( err => {
      logger.error("SOMETHING WENT WRONG")
      logger.error(err)
    })
}
