
const { getValidatorArray } = require('./validators');
const { sendNoticeMails, sendErrorEmails, sendNotFoundEmails } = require('./email');
const { getContactDetails } = require('./contacts');
const schedule = require('node-schedule');
const logger = require('./logger');

const ERROR_CONTACTS = ['lawton@mpdl.mpg.de', 'uzdogan@mpdl.mpg.de']
// Set the schedule to run in cron format see helper https://crontab.guru/
// Format:
// minute hour day month day-of-week
//   *     13   *    *        1    
// 
// 0 13 * * 1 ==>  every Monday at 13:00
// 0 13 */5 * * ==> every fifth day of the month at 13:00 5th, 10th, 15th...
//
if (process.env.NODE_ENV === 'development') {
  // schedule.scheduleJob('*/5 * * * * *', () => logger.log('Hi'));
  checkValidatorsAndSendEmails()
} else {
  schedule.scheduleJob('0 13 * * 1', checkValidatorsAndSendEmails);
}

function checkValidatorsAndSendEmails() {
  getValidatorArray()
    .then(validatorsArray => validatorsArray.filter(validator => !validator.isUp3d))
    .then(offlineValidatorsArray => {
      logger.log("Got the online status for validators: ");
      return getContactDetails(offlineValidatorsArray);
    })
    .then(({ offlineContacts, notFoundContacts }) => {
      return Promise.all([
        sendNoticeMails(offlineContacts),
        sendNotFoundEmails(ERROR_CONTACTS, notFoundContacts)
      ]);
    })
    .catch(err => {
      logger.error("SOMETHING WENT WRONG")
      logger.error(err.stack)
      sendErrorEmails(ERROR_CONTACTS, err);
    })
}
