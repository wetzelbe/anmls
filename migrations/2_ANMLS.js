const ANMLS = artifacts.require("ANMLS");

module.exports = function (deployer) {
  deployer.deploy(ANMLS, BigInt("0x0"), 
                        BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"), 
                        "https://anmls-test.technology/api/v1/metadata/");
};
