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
console.log('contract--------', contract)
const metaDataContract = new web3.eth.Contract(
  metaDataAbi,
  metaDataContractAddress,
)
const logger = require('./logger')

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
  console.log('Inside getValidatorArray')
  const validators = await contract.methods.getValidators().call()
  console.log('validators', validators)
  logger.log('    24h 3d\tInstitute Name: Address')
  logger.log('------------------------------------------')
  // Check and print each institute
  let resultArray = []
  // for (let i = 0; i < 5; i++) { // Debug
  for (let i = 0; i < validators.length; i++) {
    let address = validators[i]
    validatorData = await getLastBlock(address)
    instituteName = await getInstituteName(address)
    let isUp24h = false
    let isUp3d = false
    let lastOnline
    if (validatorData.status == 1) {
      lastOnline = new Date(validatorData.result[0].timeStamp)
      isUp24h = isDateWithin24h(lastOnline)
      isUp3d = isDateWithin3d(lastOnline)
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
    }
  }
  return resultArray
}

getLastBlock = (address) => {
  return axios
    .get(
      'https://blockexplorer.bloxberg.org/api/api?module=account&action=getminedblocks&address=' +
        address +
        '&page=1&offset=1',
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
