
const { getValidatorArray } = require('./validators');
const { sendNoticeMails } = require('./email');
const { getContactDetails } = require('./contacts');
const schedule = require('node-schedule');
const logger = require('./logger');

// Set the schedule to run in cron format see helper https://crontab.guru/
// Format:
// minute hour day month day-of-week
//   *     13   *    *        1    
// 
// * 13 * * 1 ==>  every Monday at 13:00
// * 13 */5 * * ==> every fifth day of the month at 13:00 5th, 10th, 15th...
//

// schedule.scheduleJob('* 13 * * * 1', checkValidatorsAndSendEmails);

function checkValidatorsAndSendEmails() {
  getValidatorArray()
    .then(validatorsArray => validatorsArray.filter(validator => !validator.isUp3d))
    .then(offlineValidatorsArray => {
      logger.log("Got the online status for validators: ");
      return getContactDetails(offlineValidatorsArray);
    })
    .then(offlineContacts => {
      return sendNoticeMails(offlineContacts);
    })
    .catch(err => {
      logger.error("SOMETHING WENT WRONG")
      logger.error(err)
    })
}
