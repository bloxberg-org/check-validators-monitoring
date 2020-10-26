const axios = require('axios');
const abi = require('./abis/RelaySet.abi.json');
const metaDataAbi = require('./abis/ValidatorMetadata.abi.json');
const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider('https://core.bloxberg.org');
const contractAddress = '0x9850711951A84Ef8a2A31a7868d0dCa34B0661cA';
const metaDataContractAddress = '0xF2Cde379d6818Db4a8992ed132345e18e99689e9';

const web3 = new Web3(provider);
const contract = new web3.eth.Contract(abi, contractAddress);
const metaDataContract = new web3.eth.Contract(metaDataAbi, metaDataContractAddress);

const DAYS_AGO = 1 // Number of days to check before.


getValidatorArray();



async function getValidatorArray() {

  const validators = await contract.methods.getValidators().call();

  console.log('    24h\t14d\tInstitute Name: Address');
  console.log('------------------------------------------');
  // Check and print each institute
  for (let i = 0; i < validators.length; i++) {
    try {
      validatorData = await getLastBlock(validators[i]);
      instituteName = await getInstituteName(validators[i]);
      let is24 = false;
      let is14d = false;
      if (validatorData.status == 1) {
        // Check if last block is within 24h.
        let date1 = new Date(validatorData.result[0].timeStamp)
        let timeStamp = Math.round(new Date().getTime() / 1000);
        let timeStampYesterday = timeStamp - (DAYS_AGO * 24 * 3600);
        let timeStamp14DaysAgo = timeStamp - (14 * 24 * 3600);
        is24 = date1 >= new Date(timeStampYesterday * 1000).getTime();
        is14d = date1 >= new Date(timeStamp14DaysAgo * 1000).getTime();
      }
      let num = i + 1 + '.'; // 2. 14. etc.
      num = num.padEnd(3, ' ');
      console.log(`${num} ${is24 ? '✅' : '❌'}\t${is14d ? '✅' : '❌'}\t${instituteName}`);
    } catch (error) {
      console.log(error)
    }
  }
}

function getLastBlock(address) {
  return axios.get('https://blockexplorer.bloxberg.org/api/api?module=account&action=getminedblocks&address=' + address + '&page=1&offset=1')
    .then(res => {
      return res.data
    })
}

function getInstituteName(address) {
  return metaDataContract.methods.validatorsMetadata(address).call()
    .then(result => {
      // Return name and address if exist
      if (result.researchInstitute) {
        return result.researchInstitute.slice(0, 31).padEnd(31, ' ') + ': ' + address
      }
      // Else just the address
      return address;
    })
}