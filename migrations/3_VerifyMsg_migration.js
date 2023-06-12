const VerifyMsg = artifacts.require("VerifyMsg");

module.exports = async function (deployer) {
 deployer.deploy(VerifyMsg);
};
