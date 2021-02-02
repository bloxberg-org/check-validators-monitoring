
const { getValidatorArray } = require('./validators');
const { sendNoticeEmails, sendErrorEmails, sendNotFoundEmails } = require('./email');
const { getContactDetails } = require('./contacts');
const schedule = require('node-schedule');
const logger = require('./logger');
const cronstrue = require('cronstrue');


const ERROR_CONTACTS = ['lawton@mpdl.mpg.de', 'uzdogan@mpdl.mpg.de']
const cronSchedule = '0 13 * * 1';
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
  schedule.scheduleJob(cronSchedule, checkValidatorsAndSendEmails);
  logger.log('The script is scheduled to run ' + cronstrue.toString(cronSchedule, { use24HourTimeFormat: true, verbose: true }));
}

function checkValidatorsAndSendEmails() {
  getValidatorArray()
    .then(validatorsArray => validatorsArray.filter(validator => !validator.isUp3d)) // filter validators offline for 3 days.
    .then(offlineValidatorsArray => {
      logger.log("Got the online status for validators: ");
      return getContactDetails(offlineValidatorsArray);
    })
    .then(({ offlineContacts, notFoundContacts }) => {
      return Promise.all([
        sendNoticeEmails(offlineContacts),
        sendNotFoundEmails(ERROR_CONTACTS, notFoundContacts)
      ]);
    })
    .catch(err => {
      logger.error("SOMETHING WENT WRONG")
      logger.error(err.stack)
      sendErrorEmails(ERROR_CONTACTS, err);
    })
}
