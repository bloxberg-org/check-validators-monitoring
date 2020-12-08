/**
 * @module email
 */
const nodemailer = require('nodemailer');
const moment = require('moment');

require('dotenv').config();

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PASS,
  auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
  }
});

/**
 * @function to send a notice email to the validator input. 
 * 
 * @param {Object} validatorObj returned Object from module:validators.getValidatorArray
 * 
 */
function sendNoticeMail(validatorObj) {
  let { instituteName, address, lastOnline } = validatorObj; // TODO: Get the institute name from Cobra, not the validators contract.
  let { title, name, surname, email } = getContactInfo(address);
  let lastOfflineDateString = moment(lastOnline).format('MMMM Do YYYY, hh:mm a [Germany time]')
  console.log('Sending email to: ' + email)
  const message = {
    from: `bloxberg <monitoring@bloxberg.org>`,
    to: `${email}`,
    subject: 'bloxberg Validator Inactive',
    text: `Dear ${title} ${name} ${surname},\n\n

    It seems your bloxberg validator node at ${instituteName} has been offline since ${lastOfflineDateString}.\n\n
    
    Could you please check if there is a problem with the validator? Also, please make sure the bootnodes.txt of your validator is up to date with the most recent one here. If you need technical assistance contact us at info@bloxberg.org.\n\n

    You can check the last time your node validated blocks from here: https://blockexplorer.bloxberg.org/address/${address}/validations\n\n

    Best\n
    bloxberg\n
    `
  };

  return transport.sendMail(message);

}

/**
 * @function to get the contact information of the validators from the validator address. 
 * 
 * Takes the validator address. Checks if there is a techie contact. If yes returns it, otherwise returns the main contact.
 * 
 * @param {String} address - validator address
 */
function getContactInfo(address) {
  return {
    title: 'Mr.',
    name: 'Max',
    surname: 'Mustermann',
    email: 'uzdogan@mpdl.mpg.de'
  }
}

module.exports = {
  sendNoticeMail
}