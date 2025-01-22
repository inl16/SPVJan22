// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract LoanContract {
    struct Loan {
        address borrower;
        uint256 principal;
        uint256 interestRate; // e.g. 3 for 3%
        uint256 maturityDate;
        bool isMatured;
    }

    struct Borrower {
        address wallet;
        uint256 totalLoans;
    }

    struct Investor {
        address wallet;
        uint256 investedAmount;
    }

    struct SPV {
        uint256 totalLoansDisbursed;
        uint256 totalInterestCollected;
        uint256 totalPrincipalRepaid;
        uint256 totalInvested;
        uint256 totalSupply;
    }

    // Fixed number of loan slots, re-used each simulation cycle
    uint256 public constant MAX_LOANS = 20;

    // State variables
    SPV public spv;

    // Instead of an ever-increasing counter, we keep a fixed array range [1..MAX_LOANS]
    mapping(uint256 => Loan) public loans;

    // Borrowers, investors, and their lists
    mapping(address => Borrower) public borrowers;
    address[] public borrowerList;

    mapping(address => Investor) public investors;
    address[] public investorList;

    // For tracking minted "tokens"
    mapping(address => uint256) public spvBalances;

    // Events
    event BorrowerRegistered(address indexed wallet);
    event InvestorRegistered(address indexed wallet);
    event LoanInitialized(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 principal,
        uint256 interestRate,
        uint256 maturityDate
    );
    event InvestmentMade(address indexed investor, uint256 amount);
    event TokensMinted(address indexed investor, uint256 amount);
    event LoanMatured(uint256 indexed loanId, address indexed borrower);

    // --------------------------------------
    // PUBLIC REGISTRATION
    // --------------------------------------
    function registerBorrower(address _borrower) external {
        require(_borrower != address(0), "Cannot register zero address.");
        if (borrowers[_borrower].wallet == address(0)) {
            borrowers[_borrower] = Borrower({wallet: _borrower, totalLoans: 0});
            borrowerList.push(_borrower);
            emit BorrowerRegistered(_borrower);
        }
    }

    function registerInvestor(address _investor) external {
        require(_investor != address(0), "Cannot register zero address.");
        if (investors[_investor].wallet == address(0)) {
            investors[_investor] = Investor({
                wallet: _investor,
                investedAmount: 0
            });
            investorList.push(_investor);
            emit InvestorRegistered(_investor);
        }
    }

    // --------------------------------------
    // MAIN SIMULATION FUNCTION
    // --------------------------------------
    function runSimulation() external {
        console.log("Starting simulation...");

        // 1) Re-initialize any empty or matured loan slots
        for (uint256 i = 1; i <= MAX_LOANS; i++) {
            Loan storage ln = loans[i];
            // If never used or was matured, re-initialize
            if (ln.borrower == address(0) || ln.isMatured) {
                // pick a borrower from borrowerList in round-robin
                // Example: use i-1 mod borrowerList.length
                if (borrowerList.length > 0) {
                    address b = borrowerList[(i - 1) % borrowerList.length];
                    initializeLoanInternal(
                        b,
                        100 ether,
                        3,
                        block.timestamp + 730 days,
                        i
                    );
                }
            }
        }

        // 2) Investors each invest 50 ETH
        for (uint256 i = 0; i < investorList.length; i++) {
            address inv = investorList[i];
            investInternal(inv, 50 ether);
        }

        // 3) Make payments on all loans
        for (uint256 i = 1; i <= MAX_LOANS; i++) {
            makePayment(i);
        }

        // 4) If any matured just now, it's fine — next runSimulation() will re-init them
        console.log("Simulation completed.");
    }

    // --------------------------------------
    // SPV METRICS
    // --------------------------------------
    function getSPVMetrics()
        public
        view
        returns (
            uint256 totalLoansDisbursed_,
            uint256 totalInvested_,
            uint256 totalInterestCollected_,
            uint256 totalPrincipalRepaid_,
            uint256 currentCirculation_
        )
    {
        totalLoansDisbursed_ = spv.totalLoansDisbursed;
        totalInvested_ = spv.totalInvested;
        totalInterestCollected_ = spv.totalInterestCollected;
        totalPrincipalRepaid_ = spv.totalPrincipalRepaid;
        currentCirculation_ =
            spv.totalInvested +
            (spv.totalLoansDisbursed - spv.totalPrincipalRepaid);
    }

    // --------------------------------------
    // INTERNAL FUNCTIONS
    // --------------------------------------
    function initializeLoanInternal(
        address _borrower,
        uint256 _principal,
        uint256 _interestRate,
        uint256 _maturityDate,
        uint256 _slotId
    ) internal {
        loans[_slotId] = Loan({
            borrower: _borrower,
            principal: _principal,
            interestRate: _interestRate,
            maturityDate: _maturityDate,
            isMatured: false
        });
        borrowers[_borrower].totalLoans++;
        spv.totalLoansDisbursed += _principal;

        emit LoanInitialized(
            _slotId,
            _borrower,
            _principal,
            _interestRate,
            _maturityDate
        );
    }

    function investInternal(address _investor, uint256 _amount) internal {
        investors[_investor].investedAmount += _amount;
        spv.totalInvested += _amount;
        mintTokens(_investor, _amount);

        emit InvestmentMade(_investor, _amount);
    }

    function mintTokens(address _investor, uint256 _amount) internal {
        spvBalances[_investor] += _amount;
        spv.totalSupply += _amount;
        emit TokensMinted(_investor, _amount);
    }

    function makePayment(uint256 loanId) internal {
        Loan storage loan = loans[loanId];
        if (loan.isMatured || loan.borrower == address(0)) return;

        // E.g. monthly interest + partial principal
        uint256 monthlyPayment = (loan.principal * loan.interestRate) /
            100 /
            12;
        uint256 principalPayment = loan.principal / 24; // 24-month distribution

        spv.totalInterestCollected += monthlyPayment;
        spv.totalPrincipalRepaid += principalPayment;
        loan.principal -= principalPayment;

        // If principal = 0, mark matured
        if (loan.principal == 0) {
            loan.isMatured = true;
            emit LoanMatured(loanId, loan.borrower);
        }
        console.log(
            "Borrower %s paid %s interest and %s principal.",
            loan.borrower,
            monthlyPayment,
            principalPayment
        );
        console.log("Loan Slot ID: %s", loanId);
    }
}
