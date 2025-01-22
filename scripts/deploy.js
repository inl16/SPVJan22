import Web3 from "web3";
import * as fs from "fs";

const deployContract = async () => {
    const web3 = new Web3("http://127.0.0.1:8545"); // Ensure Ganache or Hardhat node is running
    const accounts = await web3.eth.getAccounts(); // Get accounts from local node

    console.log("Deploying contract with the first account:", accounts[0]);

    // Read the compiled contract's ABI and Bytecode
    const abi = JSON.parse(fs.readFileSync("./artifacts/contracts/LoanContract.sol/LoanContract.json")).abi;
    const bytecode = JSON.parse(fs.readFileSync("./artifacts/contracts/LoanContract.sol/LoanContract.json")).bytecode;

    const LoanContract = new web3.eth.Contract(abi);

    // Deploy the contract
    const deployedContract = await LoanContract.deploy({
        data: bytecode,
    })
        .send({
            from: accounts[0],
            gas: 3000000, // Adjust gas limit if needed
        });

    console.log("Contract deployed at address:", deployedContract.options.address);
};

deployContract().catch((error) => {
    console.error("Error deploying contract:", error);
    process.exit(1);
});
