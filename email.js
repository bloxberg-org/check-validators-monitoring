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
 * @function sendNoticeEmails to send each received offline validator contact an email.
 * 
 * Takes an array of contacts and wraps each of them in a Promise that resolves into the response of the function transport.sendMail()
 * 
 * @param {Array<Object>} contactsArray from module contacts.js function getContactDetails
 * @returns {Promise} initially a single wrapped promise, returns an array of results. see Promise.all().
 */
exports.sendNoticeEmails = (contactsArray) => {
  let promises = [];
  for (let i = 0; i < contactsArray.length; i++) {
    promises.push(setTimeout(() => sendNoticeEmail(contactsArray[i]), 3000 * i)) // Avoid sending too much at once
  }
  return Promise.all(promises);
}

/**
 * Function to send error emails to admins when the script fails.
 * 
 * @param {Array} emails - array of email strings as receivers
 * @param {Error} error - the thrown Error object
 */
exports.sendErrorEmails = (emails, error) => {
  logger.log('Sending error emails to ' + emails.join() + 'about: ' + error)
  const message = {
    from: `bloxberg Validator Monitoring <monitoring@bloxberg.org>`,
    to: emails,
    subject: '❗ ERROR: bloxberg Validator Offline',
    text: `When running the script the following error is encountered\n\n
          ${error.message}\n\n
          ${error.stack}`
  };

  // return setTimeout(() => Promise.resolve(`Email sent to ${institution}: ${email}`), Math.random() * 1000 * 2) // Debug with randomly resolved Promises.
  return transport.sendMail(message);
}

/**
 * Function to send error emails to bloxberg admins when the script fails.
 * 
 * @param {Array} emails - array of email strings as receivers
 * @param {Array} notFoundContacts - array of validator objects without a found contact.
 * @example
 * [
 *  {address: 0x1fd210....321, institution: undefined},
 *  {address: 0x2fe3ad....da2, institution: Some University},
 * ]
 */
exports.sendNotFoundEmails = (emails, notFoundContacts) => {
  if (notFoundContacts.length < 1)
    return Promise.resolve();
  logger.log('Sending not found emails to ' + emails.join() + ' for the addresses: ' + notFoundContacts.map(contact => contact.address).join())
  const message = {
    from: `bloxberg Validator Monitoring <monitoring@bloxberg.org>`,
    to: emails,
    subject: '❗ Contact Not Found: bloxberg Validator Offline',
    text: `The following validators do not have an assigned contact and 
          hence were not able to be contacted. If the institution name is undefined, 
          it means an associated institution for the address couldn't be found in Cobra input.
          Otherwise the institution has an associated address but is missing any contacts. \n\n` +
      notFoundContacts.map(contact => {
        return `Institution: ${contact.institution} \n\n
              Address: ${contact.address}\n\n`
      }).join()

  };

  // return setTimeout(() => Promise.resolve(`Email sent to ${institution}: ${email}`), Math.random() * 1000 * 2) // Debug with randomly resolved Promises.
  return transport.sendMail(message);
}

/**
 * @function to send a notice email to each of the contacts of an offline validator. 
 * If there are multiple contacts, sends to all of them at once
 * 
 * @param {Object} contactArray array of contacts of an institution. 
 * 
 * @example 
* [{
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
  {
    haupt: 'N',
    institution: "ABC university"
    address: "0xadF2sA1b26Dcb1A723591c144deeb6633E5A79b",
    title: 'Mr.',
    academicTitle: '',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john[at]abc.edu',
    comments: 'comments',
    lastOnline: 2020-11-04T11:06:50.000Z
  },
]
 * 
 */
function sendNoticeEmail(contactArray) {
  logger.log('Sending notice email to: ', contactArray)
  let { institution, address, lastOnline } = contactArray[0]; // Same for all contacts
  let fullNames = '', emails = [] // Different if multiple contacts
  for (contact of contactArray) {
    let { academicTitle, firstName, lastName, email } = contact;
    fullNames += (academicTitle ? ' ' + academicTitle : '') + ` ${firstName} ${lastName}, `;  // use academic title if exist
    emails.push(email);
  }
  let lastOnlineDateString = moment(lastOnline).format('MMMM Do YYYY')
  let lastOnlineTimeString = moment(lastOnline).format('hh:mm a [Germany time]') // moment uses server's local time. Our servers are in Germany.
  const properties = {
    fullNames, institution, address,
    lastOnlineDateString, lastOnlineTimeString
  }
  const message = {
    from: `bloxberg Validator Monitoring <monitoring@bloxberg.org>`,
    to: emails,
    subject: 'bloxberg Validator Offline',
    html: applyTemplate(HTML_TEMPLATE, properties)
  };

  // return setTimeout(() => Promise.resolve(`Email sent to ${institution}: ${email}`), Math.random() * 1000 * 2) // Debug with randomly resolved Promises.
  return transport.sendMail(message);

}

// Replaces properties in the template with {{ double parantheses }} with values in the parameter object.
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
