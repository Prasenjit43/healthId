const HealthCareIDM = artifacts.require("HealthCareIDM");

module.exports = async function (deployer) {
  deployer.deploy(HealthCareIDM);
};
