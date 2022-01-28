const Base = artifacts.require("Base");

module.exports = function (deployer) {
  //deployer.deploy(Migrations);
  deployer.deploy(Base, BigInt("0x0"), 
                        BigInt("0xffffffffffffffffffffffffffffffffff"));
};
