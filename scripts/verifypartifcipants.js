// scripts/verifyRegistration.js
import Web3 from "web3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import dotenv from "dotenv";

// Initialize dotenv to use environment variables from a .env file (optional)
dotenv.config();

// Define __dirname for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Constants
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545"; // Default Ganache URL
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x2155A7fabA286748A74E4E2464ba7538Be1459F8"; // Update with your deployed contract address

// Initialize Web3
const web3 = new Web3(RPC_URL);

// Read Contract ABI
const contractPath = path.resolve(__dirname, "../artifacts/contracts/LoanContract.sol/LoanContract.json");
if (!fs.existsSync(contractPath)) {
    console.error(`ABI file not found at path: ${contractPath}`);
    process.exit(1);
}
const contractJSON = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const contractABI = contractJSON.abi;

// Initialize Contract Instance
const loanContract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

/**
 * Fetch and display the list of registered borrowers and investors.
 */
async function verifyRegistration() {
    try {
        // Fetch Borrower List
        const borrowerList = await loanContract.methods.borrowerList().call();
        console.log(`\nNumber of Registered Borrowers: ${borrowerList.length}`);
        borrowerList.forEach((borrower, index) => {
            console.log(`Borrower ${index + 1}: ${borrower}`);
        });

        // Fetch Investor List
        const investorList = await loanContract.methods.investorList().call();
        console.log(`\nNumber of Registered Investors: ${investorList.length}`);
        investorList.forEach((investor, index) => {
            console.log(`Investor ${index + 1}: ${investor}`);
        });

        console.log("\nVerification Completed.\n");
    } catch (error) {
        console.error("Error verifying registration:", error.message);
    }
}

// Execute the Verification
verifyRegistration();
