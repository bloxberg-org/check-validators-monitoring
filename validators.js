const axios = require('axios')
/**
 * @module validators
 */
const abi = require('./abis/RelaySet.abi.json')
const metaDataAbi = require('./abis/ValidatorMetadata.abi.json')
const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://core.bloxberg.org')
const contractAddress = '0x9850711951A84Ef8a2A31a7868d0dCa34B0661cA'
const metaDataContractAddress = '0xF2Cde379d6818Db4a8992ed132345e18e99689e9'
const web3 = new Web3(provider)
const contract = new web3.eth.Contract(abi, contractAddress)

// for single connection in axio request //

var http = require('http')
var https = require('https')

const httpAgent = new http.Agent({ keepAlive: true })
const httpsAgent = new https.Agent({ keepAlive: true })

const axioInstance = axios.create({
  httpAgent,
  httpsAgent,
})

// END //

const metaDataContract = new web3.eth.Contract(
  metaDataAbi,
  metaDataContractAddress,
)
const logger = require('./logger')

function Sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

/**
 * @function to check when validators were online.
 *
 * Gets the list of validator addresses from the contract. Then asks the blockexplorer.bloxberg.org when their last validator block was. Check if the last block is within 24h and 3d.
 *
 * @returns {Object[]} Array of objects for each validator in format:
 * @example
 * [{
 *  instituteName: String
 *  address: String,
 *  lastOnline: Date,
 *  isUp24h: Boolean,
 *  isUp3d: Boolean
 * }, ...]
 */
exports.getValidatorArray = async () => {
  const validators = await contract.methods.getValidators().call()
  let resultArray = []
  for (let i = 0; i < validators.length; i++) {
    let address = validators[i]
    validatorData = await getLastBlock(address)
    validatorMetadata = await getMetadata(address)
    instituteName = validatorMetadata.researchInstitute
    contactEmail = validatorMetadata.contactEmail
    firstName = validatorMetadata.firstName
    lastName = validatorMetadata.lastName
    let isUp24h = false
    let isUp3d = false
    let isUp3m = false
    let lastOnline
    if (validatorData.status == 1) {
      lastOnline = new Date(validatorData.result[0].timeStamp)
      isUp24h = isDateWithin24h(lastOnline)
      isUp3d = isDateWithin3d(lastOnline)
      isUp3m = isDateWithin3m(lastOnline)
    }
    let num = i + 1 + '.' // 2. 14. etc.
    num = num.padEnd(3, ' ') // Add padding for printing.
    let displayNameAndAddress =
      instituteName.slice(0, 31).padEnd(31, ' ') + ': ' + address
    logger.log(
      `${num} ${isUp24h ? '✅' : '❌'}\t${
        isUp3d ? '✅' : '❌'
      }\t${displayNameAndAddress}`,
    )
    resultArray[i] = {
      instituteName,
      address,
      lastOnline,
      isUp24h,
      isUp3d,
      isUp3m,
      firstName,
      lastName,
      contactEmail,
    }
    await Sleep(500)
  }
  return resultArray
}

getLastBlock = (address) => {
  return axios
    .get(
      'https://blockexplorer.bloxberg.org/api?module=account&action=getminedblocks&address=' +
        address +
        '&page=1&offset=1',
      { httpsAgent },
    )
    .then((res) => {
      return res.data
    })
}

getInstituteName = (address) => {
  return metaDataContract.methods
    .validatorsMetadata(address)
    .call()
    .then((result) => {
      // Return name
      return result.researchInstitute
    })
}

getMetadata = (address) => {
  return metaDataContract.methods
    .validatorsMetadata(address)
    .call()
    .then((result) => {
      // Return name
      return result
    })
}

isDateWithin24h = (date) => {
  let timeStamp = Math.round(new Date().getTime() / 1000)
  let timeStampYesterday = timeStamp - 1 * 24 * 3600
  return date >= new Date(timeStampYesterday * 1000).getTime()
}

isDateWithin3d = (date) => {
  let timeStamp = Math.round(new Date().getTime() / 1000)
  let timeStamp3DaysAgo = timeStamp - 3 * 24 * 3600
  return date >= new Date(timeStamp3DaysAgo * 1000).getTime()
}

isDateWithin3m = (date) => {
  let timeStamp = Math.round(new Date().getTime() / 1000)
  let timeStamp3DaysAgo = timeStamp - 3 * 28 * 24 * 60 * 60
  return date >= new Date(timeStamp3DaysAgo * 1000).getTime()
}

exports.getBalanceOfFaucet = async () => {
  let balanceInWei = await web3.eth.getBalance(
    '0x5a75804Cd3ea52E006e00C7381443924c126780a',
  )
  let balanceInEth = await web3.utils.fromWei(balanceInWei, 'ether')
  return (balanceInEth = Math.round(balanceInEth))
}
