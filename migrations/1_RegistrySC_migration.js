const RegistrySC = artifacts.require("RegistrySC");

module.exports = function (deployer, network, accounts) {
  const healthRegulators = [accounts[3], accounts[4] ,accounts[6]];
  deployer.deploy(RegistrySC, healthRegulators,2);
};
