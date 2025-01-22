import Web3 from "web3";

async function checkBalances() {
    const web3 = new Web3("http://127.0.0.1:8545"); // Connect to Ganache
    const accounts = await web3.eth.getAccounts(); // Get all accounts

    console.log("Checking balances...");

    // Role definitions (this is a placeholder, adjust based on your logic)
    const originator = accounts[0]; // Assume the first account is the originator
    const borrowerStartIndex = 1; // Start borrowers from index 1
    const investorStartIndex = Math.ceil(accounts.length / 2); // Assume investors start from the middle

    const borrowers = accounts.slice(borrowerStartIndex, investorStartIndex);
    const investors = accounts.slice(investorStartIndex);

    // Show originator balance
    const originatorBalance = await web3.eth.getBalance(originator);
    console.log(`Originator: ${originator} - Balance: ${web3.utils.fromWei(originatorBalance, "ether")} ETH`);

    // Show borrowers' balances
    console.log("\nBorrowers:");
    for (let i = 0; i < borrowers.length; i++) {
        const balance = await web3.eth.getBalance(borrowers[i]);
        console.log(`Borrower ${i + 1}: ${borrowers[i]} - Balance: ${web3.utils.fromWei(balance, "ether")} ETH`);
    }

    // Show investors' balances
    console.log("\nInvestors:");
    for (let i = 0; i < investors.length; i++) {
        const balance = await web3.eth.getBalance(investors[i]);
        console.log(`Investor ${i + 1}: ${investors[i]} - Balance: ${web3.utils.fromWei(balance, "ether")} ETH`);
    }
}

checkBalances().catch((err) => {
    console.error("Error checking balances:", err);
});
