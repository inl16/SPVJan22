// App.jsx
"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import Web3 from "web3";
import BN from "bn.js";

const RPC_URL = "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = "0x3C793d43FE761EF1661994Aa34E79aF37FC8cb04";
import contractABI from "../../artifacts/contracts/LoanContract.sol/LoanContract.json";

export default function App() {
    const [metrics, setMetrics] = useState({
        totalLoansDisbursed: 0,
        totalLoansCount: 0,
        totalInvested: 0,
        totalInterest: 0,
        totalPrincipal: 0,
        currentCirculation: 0,
        averageLoanSize: 0,
    });

    const [cumulativeLoans, setCumulativeLoans] = useState("0");

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const web3 = new Web3(RPC_URL);
                const loanContract = new web3.eth.Contract(
                    contractABI.abi,
                    CONTRACT_ADDRESS
                );

                console.log("loan contract: ", loanContract);

                const spvMetrics = await loanContract.methods
                    .getSPVMetrics()
                    .call();

                const totalLoansDisbursed = new BN(spvMetrics["0"]);
                const totalInvested = new BN(spvMetrics["1"]);
                const totalInterest = new BN(spvMetrics["2"]);
                const totalPrincipal = new BN(spvMetrics["3"]);
                const currentCirculation = new BN(spvMetrics["4"]);

                const offChainCumulative = new BN(cumulativeLoans)
                    .add(totalLoansDisbursed)
                    .toString();

                setCumulativeLoans(offChainCumulative);

                setMetrics({
                    totalLoansDisbursed: parseFloat(
                        web3.utils.fromWei(
                            totalLoansDisbursed.toString(),
                            "ether"
                        )
                    ),
                    totalLoansCount: metrics.totalLoansCount + 20,
                    totalInvested: parseFloat(
                        web3.utils.fromWei(totalInvested.toString(), "ether")
                    ),
                    totalInterest: parseFloat(
                        web3.utils.fromWei(totalInterest.toString(), "ether")
                    ),
                    totalPrincipal: parseFloat(
                        web3.utils.fromWei(totalPrincipal.toString(), "ether")
                    ),
                    currentCirculation: parseFloat(
                        web3.utils.fromWei(
                            currentCirculation.toString(),
                            "ether"
                        )
                    ),
                    averageLoanSize:
                        parseFloat(
                            web3.utils.fromWei(
                                totalPrincipal.toString(),
                                "ether"
                            )
                        ) /
                        (metrics.totalLoansCount + 20),
                });
            } catch (err) {
                console.error("Error fetching metrics:", err);
            }
        };

        const interval = setInterval(fetchMetrics, 5000);

        return () => clearInterval(interval);
    }, [metrics.totalLoansCount, cumulativeLoans]);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl p-8">
                <h1 className="mb-8 text-center text-2xl font-semibold text-slate-800">
                    Structured Investment Vehicle Analytics
                </h1>

                <div className="grid grid-cols-3 gap-12">
                    {/* Borrowers Section */}
                    <Card title="Loan Portfolio">
                        <CardItem
                            title="Total Loans Issued"
                            value={metrics.totalLoansCount}
                        />
                        <CardItem
                            title="Average Loan Size"
                            value={`${metrics.averageLoanSize.toFixed(2)} ETH`}
                        />
                        <CardItem
                            title="Total Principal"
                            value={`${metrics.totalPrincipal.toFixed(2)} ETH`}
                        />
                    </Card>

                    {/* SPV Section */}
                    <Card title="Special Purpose Vehicle">
                        <CardItem
                            title="Total Disbursed (Cumulative)"
                            value={`${Web3.utils.fromWei(
                                cumulativeLoans.toString(),
                                "ether"
                            )} ETH`}
                        />
                        <CardItem
                            title="Total Invested"
                            value={`${metrics.totalInvested.toLocaleString()} ETH`}
                        />
                        <CardItem
                            title="Interest Accrued"
                            value={`${metrics.totalInterest.toFixed(2)} ETH`}
                        />
                        <CardItem
                            title="Current Circulation"
                            value={`${metrics.currentCirculation.toFixed(
                                2
                            )} ETH`}
                        />
                    </Card>

                    {/* Investors Section */}
                    <Card title="Investment Pool">
                        <CardItem
                            title="Total Investment"
                            value={`${metrics.totalInvested.toLocaleString()} ETH`}
                        />
                        <CardItem
                            title="Interest Earned"
                            value={`${metrics.totalInterest.toFixed(2)} ETH`}
                        />
                        <CardItem
                            title="Token Circulation"
                            value={`${metrics.currentCirculation.toFixed(
                                2
                            )} ETH`}
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Card({ title, children }) {
    return (
        <div className="relative border-0 shadow-lg bg-white rounded-lg">
            <div className="border-b bg-slate-900 rounded-t-lg p-4">
                <h2 className="text-lg font-medium text-white text-center">
                    {title}
                </h2>
            </div>
            <div className="p-6 space-y-4">{children}</div>
        </div>
    );
}

function CardItem({ title, value }) {
    return (
        <div className="rounded-lg bg-slate-100 p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
    );
}
