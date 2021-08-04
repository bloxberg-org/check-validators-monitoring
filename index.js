const { getValidatorArray } = require('./validators')
const {
  sendNoticeEmails,
  sendErrorEmails,
  sendNotFoundEmails,
} = require('./email')
const { getContactDetails } = require('./contacts')
const schedule = require('node-schedule')
const logger = require('./logger')
const cronstrue = require('cronstrue')

const ERROR_CONTACTS = ['lawton@mpdl.mpg.de', 'ghag@mpdl.mpg.de']
const CC_CONTACTS = ['lawton@mpdl.mpg.de', 'ghag@mpdl.mpg.de']
// const cronSchedule = '0 13 * * 1';
const cronSchedule = '*/5 * * * *'
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
  schedule.scheduleJob(cronSchedule, checkValidatorsAndSendEmails)
  logger.log(
    'The script is scheduled to run ' +
      cronstrue.toString(cronSchedule, {
        use24HourTimeFormat: true,
        verbose: true,
      }),
  )
}

function checkValidatorsAndSendEmails() {
  console.log('Test For docker')
  getValidatorArray()
    .then((validatorsArray) =>
      validatorsArray.filter((validator) => !validator.isUp3d),
    ) // filter validators offline for 3 days.
    .then((offlineValidatorsArray) => {
      logger.log('Got the online status for validators: ')
      return getContactDetails(offlineValidatorsArray)
    })
    .then(({ offlineContacts, notFoundContacts }) => {
      console.log('Inside offlineContacts', offlineContacts)
      // return Promise.all([
      //   sendNoticeEmails(offlineContacts, CC_CONTACTS),
      //   sendNotFoundEmails(notFoundContacts, ERROR_CONTACTS),
      // ])
    })
    .then((promises) => {
      // Debug SMTP responses.
      // logger.log('Notice Email Responses:');
      // logger.log(JSON.stringify(promises[0], 2));
      // logger.log('Error Email Responses:');
      // logger.log(JSON.stringify(promises[1], 2));
      logger.log('✅ ✅ ✅ Run was successful ✅ ✅ ✅')
    })
    .catch((err) => {
      logger.error('SOMETHING WENT WRONG', err)
      logger.error(err.stack)
      // sendErrorEmails(ERROR_CONTACTS, err)
    })
}
