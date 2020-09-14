const axios = require('axios');
const { abi } = require('./build/contracts/RelaySet.json');
const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider('https://core.bloxberg.org');

const contractAddress = '0x9850711951A84Ef8a2A31a7868d0dCa34B0661cA';

getValidatorArray();

async function getValidatorArray() {
  const web3 = new Web3(provider);
  const contract = new web3.eth.Contract(abi, contractAddress);

  const validators = await contract.methods.getValidators().call();
  // Check each validator.
  for (i = 0; i < validators.length; i++) {
    try {
      // Get latest block mined.
      let response = await axios.get('https://blockexplorer.bloxberg.org/api/api?module=account&action=getminedblocks&address=' + validators[i] + '&page=1&offset=1')
      let validatorData = response.data;
      if (validatorData.status == 1) {
        // Check if last block is within 24h.
        let date1 = new Date(validatorData.result[0].timeStamp)
        let timeStamp = Math.round(new Date().getTime() / 1000);
        let timeStampYesterday = timeStamp - (24 * 3600);
        let is24 = date1 >= new Date(timeStampYesterday * 1000).getTime();
        console.log(is24, validators[i], i);
      } else {
        console.log("No blocks validated", validators[i], i)
      }
    } catch (error) {
      console.log(error)
    }
  }
  //Unused function below
  function checkValidatorTime(validatorAddress, counter) {
    console.log(validatorAddress)
    // Make a request for a user with a given ID
    axios.get('https://blockexplorer.bloxberg.org/api/api?module=account&action=getminedblocks&address=' + validatorAddress + '&page=1&offset=1', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (response.data.status === 1) {
          var date1 = new Date(response.data.result[0].timeStamp)
          var timeStamp = Math.round(new Date().getTime() / 1000);
          var timeStampYesterday = timeStamp - (24 * 3600);
          var is24 = date1 >= new Date(timeStampYesterday * 1000).getTime();
          console.log(is24, validatorAddress, counter);
          return;
        }
        else {
          return;
        }
      })
      .catch(function (error) {
        // handle error
        console.log(error);

      })
      .then(function () {
        return;
      });

  }

  getValidatorArray();
}
