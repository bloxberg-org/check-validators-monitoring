const csv = require('csv-parser')
const fs = require('fs')
const stripBom = require('strip-bom-stream'); // See https://github.com/mafintosh/csv-parser#byte-order-marks
const ethereumRegex = require('ethereum-regex')

const TECHIE_FILE = 'bloxberg_techies.csv';
const CONSORTIUM_FILE = 'bloxberg_consortium.csv';
const logger = require('./logger');

/**
 * @function getContactDetails to get the contact details for each input validator in the array.
 * 
 * Finds the corresponding Institution using the address in the input. Assumes each Institution 
 * has their validator address in the Bemerkung of their Haupt address. Using that address in the
 * Bemerkung, gets the institution name and looks for contacts with same insitution name.
 * 
 * If there are techies for the insitution, returns them as a contact. If there are no techies,
 * adds all contacts as a contact.
 * 
 * There is a confusion between institute-institut. The contacts from Cobra contains both fields. Looks for the Institution field first, if empty, uses Institut. See the function formatCobraCsvLine
 * 
 * @param {Array} offlineValidatorsArray - Array of objects representing validators in below format. Typically only offline validators are input. 
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
 * @returns {Promise<Array>} that resolves to an array of an array of contact objects including the address fields. Each element of the first array is an institution and each object in the second array contains the contacts for that institution.
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
  let addressInstitutionMap = mapEthAddressesToInsitutions(consortium);
  let groupedTechies = groupContactsByInstitution(techies);
  let groupedConsortium = groupContactsByInstitution(consortium);

  let notFoundContacts = []

  // Iterate offline validators
  for (validator of offlineValidatorsArray) {
    let address = validator.address;
    let institution = addressInstitutionMap[address];
    logger.info('Processing contacts for institution with address ' + validator.address + ' and name ' + institution)
    let contacts; // of this validator

    // If there's a techie for the institution add them as contact
   // if (groupedTechies[institution]) {
   //   contacts = groupedTechies[institution];
   // } else 
    if (groupedConsortium[institution]) { // all other contacts we have
      contacts = groupedConsortium[institution];
    } else {  // no contacts
      notFoundContacts.push({ institution, address });
    }

    // Add the missing address and lastOnline fields to contact object before returning.
    if (contacts) { // check if notFoundContact
      let contactsWithAddress = contacts.map(contact => {
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
 * @function readCSVtoJson to convert a Cobra .csv file into json format.
 * 
 * @param {String} fileName - name of the .csv file to be read
 * @returns {Promise<Array>} that resolves to an array with each csv line as a JSON object. For the format of the objects see the function formatCobraCsvLine
 */
function readCSVtoJson(fileName) {
  let resultsArr = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(fileName)
      .pipe(stripBom()) // Need to remove BOM in .csv see https://csv.thephpleague.com/8.0/bom/
      .pipe(csv())
      .on('data', (data) => resultsArr.push(formatCobraCsvLine(data)))
      .on('end', () => {
        resolve(resultsArr)
      })
      .on('error', (err) => reject(err));
  })
}

/**
 * @function formatCobraCsvLine to format csv entries that are read into a raw object into a useful JSON format to be processed. 
 * 
 * @example e.g. csv-parse add the fields Haupt and E-Mail1 as JSON keys with quotes 'Haupt' and 'E-Mail1'. Change does into a better format.
 * 
 * @returns {Object} Object of format
 * @param {Object} obj csv line read by the csv-parse
 */
function formatCobraCsvLine(obj) {
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
 * @function mapEthAddressesToInsitutions to map ethereum addresses to institution names.
 * 
 * Iterates over an array of main contacts. Checks their comments field. If finds a String matching
 * to an ethereum address, maps this to the institution name.
 * 
 * @param {Array} contactsArray array of contacts of format from formatCobraCsvLine
 * @returns {Object} a mapping from addresses to institution names.
 * @example 
 * {
 *  "0xEafe556569895f555755815131D21D49AFdb2Efe": "Universität Zürich",
 *  "0x738e6E88d4415E2e5075e15CC24FD9416F1c89C3": "Hochschule Furtwangen (HFU)"
 * ...
 * }
 */
function mapEthAddressesToInsitutions(contactsArray) {
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
 * @param {Array<Object>} contactsArray of contact objects formatted as in formatCobraCsvLine
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
    if (contact.haupt === 'H') { // Ignore Haupt address contacts are Neben adresses.
      continue
    }

    let inst = contact.institution;
    if (!result[inst]) { // Init array under the object key "inst"
      result[inst] = [];
    }

    result[inst].push(contact);
  }
  return result;
}
