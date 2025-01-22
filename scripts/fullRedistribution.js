import Web3 from "web3";

const proportionalRedistribution = async () => {
    const web3 = new Web3("http://127.0.0.1:8545");
    const accounts = await web3.eth.getAccounts();

    const gasLimit = 300000; // Set an appropriate gas limit
    console.log("Starting Proportional Redistribution Process...");

    const totalAccounts = accounts.length;
    const borrowersRatio = 0.6; // 60% of total transferable amount
    const investorsRatio = 0.4; // 40% of total transferable amount

    // Define percentages for redistribution to borrowers and investors
    const maxTransferablePercentage = BigInt(75); // Redistribute up to 75% of account balance (scaled to integer)
    console.log(`Redistributing up to ${maxTransferablePercentage}% of balances.`);

    const collectorAccount = accounts[0];
    console.log(`Collector Account: ${collectorAccount}`);

    // Step 1: Accumulate funds into the collector account
    for (let i = 1; i < totalAccounts; i++) {
        try {
            const donor = accounts[i];
            const donorBalance = BigInt(await web3.eth.getBalance(donor));
            const gasPrice = BigInt(await web3.eth.getGasPrice());
            const estimatedGasCost = BigInt(gasLimit) * gasPrice;

            if (donorBalance > estimatedGasCost) {
                const transferableBalance = (donorBalance - estimatedGasCost) * maxTransferablePercentage / BigInt(100);

                if (transferableBalance > BigInt(0)) {
                    await web3.eth.sendTransaction({
                        from: donor,
                        to: collectorAccount,
                        value: transferableBalance.toString(),
                        gas: gasLimit,
                    });

                    console.log(
                        `Transferred ${web3.utils.fromWei(
                            transferableBalance.toString(),
                            "ether"
                        )} ETH from ${donor} to Collector.`
                    );
                }
            } else {
                console.log(`Skipping ${donor}: Insufficient balance after accounting for gas.`);
            }
        } catch (err) {
            console.error(`Error transferring from ${accounts[i]}: ${err.message}`);
        }
    }

    // Log collector balance
    const collectorBalance = BigInt(await web3.eth.getBalance(collectorAccount));
    console.log(`Collector Total Balance: ${web3.utils.fromWei(collectorBalance.toString(), "ether")} ETH`);

    // Calculate redistribution amounts
    const borrowersTotal = collectorBalance * BigInt(borrowersRatio * 100) / BigInt(100);
    const investorsTotal = collectorBalance * BigInt(investorsRatio * 100) / BigInt(100);
    const totalBorrowers = Math.floor(totalAccounts * borrowersRatio);
    const totalInvestors = totalAccounts - totalBorrowers - 1; // Exclude collector account

    const borrowerAmount = borrowersTotal / BigInt(totalBorrowers);
    const investorAmount = investorsTotal / BigInt(totalInvestors);

    console.log(
        `Each Borrower: ${web3.utils.fromWei(borrowerAmount.toString(), "ether")} ETH`
    );
    console.log(
        `Each Investor: ${web3.utils.fromWei(investorAmount.toString(), "ether")} ETH`
    );

    // Step 2: Distribute to Borrowers
    for (let i = 1; i <= totalBorrowers; i++) {
        try {
            const borrower = accounts[i];
            await web3.eth.sendTransaction({
                from: collectorAccount,
                to: borrower,
                value: borrowerAmount.toString(),
                gas: gasLimit,
            });
            console.log(`Transferred ${web3.utils.fromWei(borrowerAmount.toString(), "ether")} ETH to Borrower: ${borrower}`);
        } catch (err) {
            console.error(`Error transferring to Borrower ${accounts[i]}: ${err.message}`);
        }
    }

    // Step 3: Distribute to Investors
    for (let i = totalBorrowers + 1; i < totalAccounts; i++) {
        try {
            const investor = accounts[i];
            await web3.eth.sendTransaction({
                from: collectorAccount,
                to: investor,
                value: investorAmount.toString(),
                gas: gasLimit,
            });
            console.log(`Transferred ${web3.utils.fromWei(investorAmount.toString(), "ether")} ETH to Investor: ${investor}`);
        } catch (err) {
            console.error(`Error transferring to Investor ${accounts[i]}: ${err.message}`);
        }
    }

    console.log("Proportional Redistribution Process Completed!");
};

proportionalRedistribution().catch((err) => {
    console.error("Error during redistribution:", err);
});
