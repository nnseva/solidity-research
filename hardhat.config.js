/**
 * hardhat cofig
 */

require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("@atixlabs/hardhat-time-n-mine");

const ethers = require("ethers");

module.exports = {
    mocha: {
        timeout: 10000000
    },
    
    solidity: {
        version: process.env.SOLC_VERSION || "0.8.29",
        settings: {
            optimizer: {
            enabled: true,
            runs: 200,
            },
        },
    }
};
