const Base = artifacts.require("Base");

module.exports = function (deployer) {
  deployer.deploy(Base, BigInt("0x0"), 
                        BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"), 
                        "https://anmls-test.technology/api/v1/metadata/");
};
