const csv = require('csv-parser')
const fs = require('fs')
const stripBom = require('strip-bom-stream'); // See https://github.com/mafintosh/csv-parser#byte-order-marks
const ethereumRegex = require('ethereum-regex')

const TECHIE_FILE = 'bloxberg_techies.csv';
const CONSORTIUM_FILE = 'bloxberg_consortium.csv';
const logger = require('./logger');

/**
 * @function getContactDetails to get the contact details for each input validator.
 * 
 * Finds the corresponding Institution using the address in the input. Assumes each Institution has their validator address in the Bemerkung of their Haupt address. 
 * If there are techies for the insitution, returns them as a contact. If there are no techies, adds all contacts as a contact.
 * 
 * There is a confusion around institute-institut. The key intitution is used as a mapping between main contacts and techies, i.e. they share this field. Looks for the Institution field first, if empty, uses Institut. See @function formatCobraObject
 * 
 * @param {Array} offlineValidatorsArray - Array of objects representing validators below format. Typically only offline validators are input. 
 * 
 * @example
 *
 * {
    instituteName: 'Faculty of Organizational Sciences',
    address: '0x841C25A1b2bA723591c14636Dc13E4deeb65A79b',
    lastOnline: 2020-11-04T11:06:50.000Z,
    isUp24h: false,
    isUp3d: false
  }
 * @returns {Promise<Array>} that resolves to an array of an array of contact objects including the address fields. Each element of first array is an institution and each object in second array is the contacts for that institution.
 * @example
 *  [
*     [{
        haupt: 'N',
        institution: "Doe university",
        address: "0x841C25A1b2bA723591c14636Dc13E4deeb65A79b",
        title: 'Mr',
        academicTitle: 'Prof.',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john[at]doe.edu',
        comments: 'comments',
        lastOnline: 2020-12-03T13:01:52.000Z
      }],
      [
        {
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
          firstName: 'Micheal',
          lastName: 'Jordan',
          email: 'mike[at]abc.edu',
          comments: 'other comments',
          lastOnline: 2020-11-04T11:06:50.000Z
        }
      ],
      ....
 * ]
 * 
 */
exports.getContactDetails = async (offlineValidatorsArray) => {
  logger.log('Offline validators are: ', offlineValidatorsArray);
  let offlineContacts = [];

  // Prepare data
  let techies = await readCSVtoJson(TECHIE_FILE);
  let consortium = await readCSVtoJson(CONSORTIUM_FILE);
  let addressInstitutionMap = mapAddressToInsitutions(consortium);
  let groupedTechies = groupContactsByInstitution(techies);
  let groupedConsortium = groupContactsByInstitution(consortium);

  console.log(groupedTechies)
  let notFoundContacts = []
  for (validator of offlineValidatorsArray) {
    let address = validator.address;
    let institution = addressInstitutionMap[address];
    logger.info('Processing contacts for institution with address ' + validator.address + ' and name ' + institution)
    let contacts; // of this validator

    // If there's a techie for the institution add them as contact
    if (groupedTechies[institution]) {
      contacts = groupedTechies[institution];
    } else if (groupedConsortium[institution]) { // all other contacts we have
      contacts = groupedConsortium[institution];
    } else {  // no contacts
      notFoundContacts.push({ institution, address });
    }

    // Add address field to contact object
    if (contacts) {
      let contactsWithAddress = contacts.map(contact => { // if contacts undefined, throw below.
        return {
          address: address,
          lastOnline: validator.lastOnline,
          ...contact
        }
      })
      offlineContacts.push(contactsWithAddress);
    }
  }
  return { offlineContacts, notFoundContacts };
}

/**
 * @function readCSVtoJson to read a Cobra .csv file (converted from .xlsx) and 
 * 
 * @returns {Promise<Array>} that resolves to an array with each csv line as an object
 * @param {String} fileName - name of the .csv file to be read
 */
function readCSVtoJson(fileName) {
  let resultsArr = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(fileName)
      .pipe(stripBom())
      .pipe(csv())
      .on('data', (data) => resultsArr.push(formatCobraObject(data)))
      .on('end', () => {
        resolve(resultsArr)
      })
      .on('error', (err) => reject(err));
  })
}

/**
 * @function formatCobraObject to format csv entries that are read into a raw object into a useful format to be processed. 
 * 
 * @example e.g. csv-parse add the fields Haupt and E-Mail1 as keys with quotes 'Haupt' and 'E-Mail1'. Change does into a better format.
 * 
 * @returns {Object} Object of format
 * @param {Object} obj csv line read by the csv-parse
 */
function formatCobraObject(obj) {
  return {
    haupt: obj.Haupt,
    institution: decideInstitutionName(obj),
    title: obj.Anrede,
    academicTitle: obj.Titel,
    firstName: obj.Vorname1,
    lastName: obj.Nachname1,
    email: obj["E-Mail1"],
    comments: obj.Bemerkung
  }
}

function decideInstitutionName(obj) {
  return obj.Institution.length > 0 ? obj.Institution : obj.Institut
}

/**
 * @function mapAddressToInsitutions to map ethereum addresses to institution names.
 * 
 * Iterates over an array of main contacts. Checks their comments field. If finds a String match for an ethereum address, maps this to the institution name.
 * 
 * @param {Array} contactsArray array of contacts of format from readCSVtoJson->formatCobraObject
 * @returns {Object} a mapping from addresses to institution names.
 * @example 
 * {
 *  "0xEafe556569895f555755815131D21D49AFdb2Efe": "Universität Zürich",
 *  "0x738e6E88d4415E2e5075e15CC24FD9416F1c89C3": "Hochschule Furtwangen (HFU)"
 * ...
 * }
 */
function mapAddressToInsitutions(contactsArray) {
  let result = {}
  for (contact of contactsArray) {
    if (contact.haupt === 'H' && ethereumRegex().test(contact.comments)) {
      let addr = contact.comments.match(ethereumRegex());
      result[addr] = contact.institution; // 0xEafe556569895f555755815131D21D49AFdb2Efe": "Universität Zürich"
    }
  }
  return result;
}

/**
 * Function to group an array of contacts by their institution name.
 * 
 * @param {Array<Object>} contactsArray formatted as in readCSVtoJson->formatCobraObject
 * @returns {Object} with institution name as keys and an array of contacts as values.
 * @example
 * {
 *  "RWTH Aachen University": [
  *   {
        haupt: 'N',
        institution: "Doe university"
        title: 'Mr',
        academicTitle: 'Prof.',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john[at]doe.edu',
        comments: 'comments'
      },
      {
        haupt: 'N',
        institution: "Doe university"
        title: 'Mrs.',
        academicTitle: '',
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice[at]uni.edu',
        comments: 'comments'
      }
    ],
    "TH Köln": [...],
    ...
 * }
 */
function groupContactsByInstitution(contactsArray) {
  let result = {}
  for (contact of contactsArray) {
    if (contact.haupt === 'H') { // Ignore Haupt address
      continue
    }

    let inst = contact.institution;
    if (!result[inst]) { // Init array
      result[inst] = [];
    }

    result[inst].push(contact);
  }
  return result;
}