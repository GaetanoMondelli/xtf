const fs = require('fs');
const path = require('path');

const CONTRACT_ARTIFACT_PATH = './artifacts/contracts/ETFContractv2.sol/ETFv2.json';

function getContractSize(contractPath: string) {
  const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const bytecodeSize = contractArtifact.bytecode.length / 2 - 1; // Divide by 2 for hex string, subtract 1 for the '0x' prefix
  const deployedBytecodeSize = contractArtifact.deployedBytecode.length / 2 - 1;
  return {
    bytecodeSize,
    deployedBytecodeSize
  };
}

function main() {
  const size = getContractSize(CONTRACT_ARTIFACT_PATH);
  console.log(`Bytecode size of contract: ${size.bytecodeSize} bytes`);
  console.log(`Deployed bytecode size of contract: ${size.deployedBytecodeSize} bytes`);
}

main();