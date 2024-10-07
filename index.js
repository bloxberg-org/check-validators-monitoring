const { getValidatorArray, getBalanceOfFaucet } = require("./validators");
const {
  sendNoticeEmails,
  sendErrorEmails,
  sendNotFoundEmails,
  sendFaucetBalanceEmail,
} = require("./email");
const { getContactDetails } = require("./contacts");
const schedule = require("node-schedule");
const logger = require("./logger");
const cronstrue = require("cronstrue");

const ERROR_CONTACTS = ["ghag@mpdl.mpg.de"];
const CC_CONTACTS = ["ghag@mpdl.mpg.de", "tariq@mpdl.mpg.de"];

const contactEmailForFaucet = ["ghag@mpdl.mpg.de", "ranger@mpdl.mpg.de"];
const ccContactsForFaucet = ["tariq@mpdl.mpg.de"];

// const cronScheduleFor3D = '0 9 6,15,28 * *'
const cronScheduleFor3D = "0 9 * * 1";

const cronScheduleForFaucetBalance = "5 8 * * MON";

// Set the schedule to run in cron format see helper https://crontab.guru/
// Format:
// minute hour day month day-of-week
//   *     13   *    *        1
//
// 0 13 * * 1 ==>  every Monday at 13:00
// 0 13 */5 * * ==> every fifth day of the month at 13:00 5th, 10th, 15th...
//
if (process.env.NODE_ENV === "development") {
  // logger.log("The script is running in dev");
  // logger.log(
  //   "The cronScheduleForQa3D is scheduled to run " +
  //     cronstrue.toString(cronScheduleFor3D, {
  //       use24HourTimeFormat: true,
  //       verbose: true,
  //     })
  // );
  // schedule.scheduleJob(
  //   cronScheduleForFaucetBalance,
  //   checkValidatorsForMetadataUpdate
  // );
} else {
  logger.log("The script is running in production");
  logger.log(
    "The cron is scheduled to run " +
      cronstrue.toString(cronScheduleFor3D, {
        use24HourTimeFormat: true,
        verbose: true,
      })
  );
  logger.log(
    "The cron is scheduled to run for Faucet Balance " +
      cronstrue.toString(cronScheduleForFaucetBalance, {
        use24HourTimeFormat: true,
        verbose: true,
      })
  );
  schedule.scheduleJob(
    cronScheduleForFaucetBalance,
    checkValidatorsForFaucetBalance
  );
  schedule.scheduleJob(cronScheduleFor3D, runCronOn2ndAnd4thMonday);
}

function checkValidatorsAndSendEmails() {
  getValidatorArray()
    .then((validatorsArray) => {
      const result = validatorsArray.filter(
        (validator) =>
          !validator.isUp3d &&
          validator.contactEmail.length !== 0 &&
          validator.lastOnline
      );
      return result;
    })
    .then((offlineValidatorsArray) => {
      logger.log(
        "Got the offline status for validators for 3D- ",
        offlineValidatorsArray
      );
      return sendNoticeEmails(offlineValidatorsArray, CC_CONTACTS);
    })
    .then((promises) => {
      logger.log("✅ ✅ ✅ Run was successful ✅ ✅ ✅");
    })
    .catch((err) => {
      logger.error("SOMETHING WENT WRONG");
      logger.error(err.response);
    });
}

function checkValidatorsForFaucetBalance() {
  getBalanceOfFaucet()
    .then((value) => {
      if (value < 20) {
        console.log("Faucet Balance:", value);
        return sendFaucetBalanceEmail(
          contactEmailForFaucet,
          ccContactsForFaucet,
          value
        );
      }
    })
    .then((promises) => {
      logger.log("✅ ✅ ✅ Run was successful ✅ ✅ ✅");
    })
    .catch((err) => {
      logger.error("SOMETHING WENT WRONG");
      logger.error(err.stack);
    });
}

function runCronOn2ndAnd4thMonday() {
  let date = new Date();
  let weekNumber = Math.floor(date.getDate() / 7);
  if (weekNumber === 1 || weekNumber === 3) {
    checkValidatorsAndSendEmails();
  }
}
