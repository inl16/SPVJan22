// scripts/Simulation.js
import Web3 from "web3";
import BN from "bn.js"; // Install with `npm install bn.js`

import contractABI from "../artifacts/contracts/LoanContract.sol/LoanContract.json" assert { type: "json" };

const RPC_URL = "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = "0x3C793d43FE761EF1661994Aa34E79aF37FC8cb04";

const web3 = new Web3(RPC_URL);
const loanContract = new web3.eth.Contract(contractABI.abi, CONTRACT_ADDRESS);

// Off-chain aggregator
let offChainCumulativeDisbursed = new BN("0");
// If using the difference approach
let lastOnChainDisbursed = new BN("0");

async function registerParticipants() {
  const accounts = await web3.eth.getAccounts();
  const originator = accounts[0]; // Use the first account as the originator

  console.log("Registering participants...");

  // Register borrowers (accounts[1..10])
  for (let i = 1; i <= 10; i++) {
    try {
      await loanContract.methods.registerBorrower(accounts[i]).send({
        from: originator,
        gas: 2_000_000,
      });
      console.log(`Registered Borrower: ${accounts[i]}`);
    } catch (err) {
      console.error(`Failed to register Borrower ${accounts[i]}: ${err.message}`);
    }
  }

  // Register investors (accounts[11..15])
  for (let j = 11; j <= 15; j++) {
    try {
      await loanContract.methods.registerInvestor(accounts[j]).send({
        from: originator,
        gas: 2_000_000,
      });
      console.log(`Registered Investor: ${accounts[j]}`);
    } catch (err) {
      console.error(`Failed to register Investor ${accounts[j]}: ${err.message}`);
    }
  }

  console.log("Done registering borrowers & investors.");
}

async function runSingleSimulation() {
  try {
    const accounts = await web3.eth.getAccounts();
    const originator = accounts[0];

    // Call the runSimulation function on the contract
    const receipt = await loanContract.methods.runSimulation().send({
      from: originator,
      gas: 5_000_000,
    });
    console.log("runSimulation TX:", receipt.transactionHash);

    // Fetch SPV metrics
    const metrics = await loanContract.methods.getSPVMetrics().call();
    console.log("\nSPV Metrics:");
    console.log(" - Total Loans Disbursed (current cycle):", metrics["0"]);
    console.log(" - Total Invested:", metrics["1"]);
    console.log(" - Total Interest Collected:", metrics["2"]);
    console.log(" - Total Principal Repaid:", metrics["3"]);
    console.log(" - Current Circulation:", metrics["4"]);
    console.log("---------------");

    // Convert on-chain Total Loans Disbursed to BN
    const currentOnChainDisbursed = new BN(metrics["0"]);

    // Approach A: Add full value to the cumulative total each time
    offChainCumulativeDisbursed = offChainCumulativeDisbursed.add(currentOnChainDisbursed);

    console.log("Off-Chain Cumulative Loans Disbursed (wei):", offChainCumulativeDisbursed.toString());
    console.log("Off-Chain Cumulative Loans Disbursed (ETH):", web3.utils.fromWei(offChainCumulativeDisbursed.toString(), "ether"));

    // Approach B (if your contract increments `totalLoansDisbursed`):
    // const diff = currentOnChainDisbursed.sub(lastOnChainDisbursed);
    // offChainCumulativeDisbursed = offChainCumulativeDisbursed.add(diff);
    // lastOnChainDisbursed = currentOnChainDisbursed;

  } catch (err) {
    console.error("Error in runSimulation:", err.message);
  }
}

async function continuousLoop() {
  while (true) {
    await runSingleSimulation();
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds between runs
  }
}

async function main() {
  // Register participants once (only needed if not already done)
  await registerParticipants();

  // Start the continuous simulation loop
  await continuousLoop();
}

main().catch(console.error);
