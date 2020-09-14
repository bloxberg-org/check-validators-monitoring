const HDWalletProvider = require('@truffle/hdwallet-provider');
const { mnemonic } = require('config');

//Input mnemonic
var mnemonic = "";


// Provider engine instantiation can be included but is not necessary when account is unlocked

module.exports = {
  networks: {
    development: {
      provider: () =>
        new HDWalletProvider(mnemonic, 'https://core.bloxberg.org'),
      network_id: '8995',
      gas: 5000000,   // <--- Twice as much
      gasPrice: 4000000000000,
      from: '0xD748BF41264b906093460923169643f45BDbC32e'
    },
    bloxberg: {
      host: '127.0.0.1',
      port: 8547,
      network_id: '*'
    }
  },
  compilers: {
    solc: {
      version: '0.4.22' // RelaySet.sol pragma
    }
  }
}
