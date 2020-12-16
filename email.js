/**
 * @module email
 */
require('dotenv').config();
const nodemailer = require('nodemailer');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const HTML_TEMPLATE = fs.readFileSync(path.resolve(__dirname, './email-template.html'), 'utf-8');
const logger = require('./logger');

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PASS,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * @function sendNoticeMails to send each received offline validator contact an email.
 * 
 * Takes an array of contacts and wraps each of them in a Promise that resolves into the response of @function transport.sendMail()
 * 
 * @param {Array<Object>} contactsArray from @module contacts.js @function getContactDetails
 * @returns {Promise} initially a single wrapped promise, returns an array of results. see Promise.all().
 */
exports.sendNoticeMails = (contactsArray) => {
  let promises = [];
  for (let i = 0; i < contactsArray.length; i++) {
    promises.push(setTimeout(() => sendNoticeMail(contactsArray[i]), 2500 * i)) // Avoid sending too much at once
  }
  return Promise.all(promises);
}

/**
 * @function to send a notice email to the validator input. 
 * 
 * @param {Object} validatorObj returned Object from module:validators.getValidatorArray.
 * Format as in @module contacts.js @function getContactDetails
 * 
 * @example 
* {
    haupt: 'N',
    institution: "ABC university"
    address: "0xadF2sA1b26Dcb1A723591c144deeb6633E5A79b",
    title: 'Mrs.',
    academicTitle: '',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice[at]abc.edu',
    comments: 'comments',
    lastOnline: 2020-11-04T11:06:50.000Z
  },
 * 
 */
function sendNoticeMail(validatorObj) {
  logger.log('Sending notice mail to: ', validatorObj)
  let { institution, address, title, academicTitle, firstName, lastName, email, lastOnline } = validatorObj;
  let lastOnlineDateString = moment(lastOnline).format('MMMM Do YYYY')
  let lastOnlineTimeString = moment(lastOnline).format('hh:mm a [Germany time]')
  const properties = {
    fullTitle: academicTitle ? ' ' + academicTitle : '',  // use academic title if exist
    firstName, lastName, institution, address,
    lastOnlineDateString, lastOnlineTimeString
  }
  const message = {
    from: `bloxberg Validator Monitoring <monitoring@bloxberg.org>`,
    to: email,
    subject: 'bloxberg Validator Offline',
    html: applyTemplate(HTML_TEMPLATE, properties)
  };

  // return setTimeout(() => Promise.resolve(`Email sent to ${institution}: ${email}`), Math.random() * 1000 * 2) // Debug with randomly resolved Promises.
  return transport.sendMail(message);

}

// Replaces properties in {{ double parantheses }} with values in the parameter object.
// from: https://stackoverflow.com/questions/29831810/how-to-fill-information-into-a-template-text-file
function applyTemplate(template, properties) {
  var returnValue = "";

  var templateFragments = template.split("{{");

  returnValue += templateFragments[0];

  for (var i = 1; i < templateFragments.length; i++) {
    var fragmentSections = templateFragments[i].split("}}", 2);
    returnValue += properties[fragmentSections[0]];
    returnValue += fragmentSections[1];
  }

  return returnValue;
}