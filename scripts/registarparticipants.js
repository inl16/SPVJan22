// scripts/registerParticipants.js
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
 * Shuffle an array in place using the Fisher-Yates algorithm.
 * @param {Array} array - The array to shuffle.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Registers borrowers and investors based on available accounts.
 * Splits the accounts randomly into borrowers and investors.
 * The script ensures that no duplicates are registered.
 */
async function registerParticipants() {
    try {
        const accounts = await web3.eth.getAccounts();
        if (accounts.length < 3) {
            console.warn("Not enough accounts to register participants. At least 3 accounts are required (1 owner + 2 participants).");
            return;
        }

        const owner = accounts[0];
        const participantAccounts = accounts.slice(1); // Exclude owner

        // Shuffle participant accounts for random assignment
        shuffleArray(participantAccounts);

        // Determine the number of borrowers and investors
        // For example, assign half as borrowers and half as investors
        const totalParticipants = participantAccounts.length;
        const numBorrowers = Math.floor(totalParticipants / 2);
        const numInvestors = totalParticipants - numBorrowers;

        const borrowers = participantAccounts.slice(0, numBorrowers);
        const investors = participantAccounts.slice(numBorrowers);

        console.log(`Total Available Participants (excluding owner): ${totalParticipants}`);
        console.log(`Assigning ${numBorrowers} as Borrowers and ${numInvestors} as Investors.\n`);

        // Register Borrowers
        for (let borrower of borrowers) {
            try {
                // Check if borrower is already registered
                const borrowerInfo = await loanContract.methods.borrowers(borrower).call();
                if (borrowerInfo.wallet.toLowerCase() !== '0x0000000000000000000000000000000000000000') {
                    console.log(`Borrower ${borrower} is already registered. Skipping...`);
                    continue;
                }

                // Register Borrower
                const receipt = await loanContract.methods.registerBorrower(borrower).send({
                    from: owner,
                    gas: 300000, // Adjust gas limit as needed
                });

                console.log(`Successfully registered borrower: ${borrower}`);
                console.log(`Transaction Hash: ${receipt.transactionHash}\n`);
            } catch (error) {
                console.error(`Error registering borrower ${borrower}:`, error.message);
            }
        }

        // Register Investors
        for (let investor of investors) {
            try {
                // Check if investor is already registered
                const investorInfo = await loanContract.methods.investors(investor).call();
                if (investorInfo.wallet.toLowerCase() !== '0x0000000000000000000000000000000000000000') {
                    console.log(`Investor ${investor} is already registered. Skipping...`);
                    continue;
                }

                // Register Investor
                const receipt = await loanContract.methods.registerInvestor(investor).send({
                    from: owner,
                    gas: 300000, // Adjust gas limit as needed
                });

                console.log(`Successfully registered investor: ${investor}`);
                console.log(`Transaction Hash: ${receipt.transactionHash}\n`);
            } catch (error) {
                console.error(`Error registering investor ${investor}:`, error.message);
            }
        }

        console.log("Participant Registration Process Completed.");
    } catch (error) {
        console.error("Error in participant registration process:", error.message);
    }
}

// Execute the Registration
registerParticipants();
