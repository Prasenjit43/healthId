// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/utils/Counters.sol";

contract RegistrySC {
    using Counters for Counters.Counter;
    Counters.Counter public _registrationIds;
    enum ApprovalStatus {
        APPROVED,
        REJECTED,
        NOT_KNOWN
    }

    struct RegisterRegulator {
        uint256 approvalCount;
        uint256 rejectedCount;
        bool votingInProgress;
        address requestor;
        ApprovalStatus _status;
    }

    uint256 approvalCount;
    uint256 totalRegulator;

    //Address of Sender who want to become regulator => Structure Instance
    mapping(uint256 => RegisterRegulator) public newRegistration;
    mapping(address => uint256) public resgistrationPerAddr;

    //Address of person who want to become regulator => Address of Registered Regulator => bool
    mapping(uint256 => mapping(address => bool)) polled;

    //HealthRegulator Ethereum address -> Bool(Yes/NO)
    mapping(address => bool) isHealthRegulator;

    //HealthId(Contract address) -> HealthRegulator Ethereum address
    mapping(address => address) whoAttested;

    //HealthId(Contract address)  -> User/Health Provider Public Key
    mapping(address => address) attestedHealthId;

    modifier onlyRegulator() {
        require(isHealthRegulator[msg.sender], "You are not regulator");
        _;
    }

    modifier onlyRegulatorRequestor(uint256 _requestId) {
        require(
            newRegistration[_requestId].requestor == msg.sender,
            "You are not allowed"
        );
        _;
    }

    constructor(address[] memory _regulators, uint256 _approvalCount) {
        for (uint8 i = 0; i < _regulators.length; i++) {
            isHealthRegulator[_regulators[i]] = true;
            totalRegulator++;
        }
        approvalCount = _approvalCount;
    }

    function register_regulator() external {
        require(!isHealthRegulator[msg.sender], "Already a regulator");
        uint256 _requestId = resgistrationPerAddr[msg.sender];
        require(
            !newRegistration[_requestId].votingInProgress,
            "Already Applied for Registration"
        );
        RegisterRegulator memory newInstance = RegisterRegulator({
            approvalCount: 0,
            rejectedCount: 0,
            votingInProgress: true,
            requestor: msg.sender,
            _status: ApprovalStatus.NOT_KNOWN
        });
        _registrationIds.increment();
        newRegistration[_registrationIds.current()] = newInstance;
        resgistrationPerAddr[msg.sender] = _registrationIds.current();
    }

    function vote(
        uint256 _requestId,
        ApprovalStatus _status
    ) external onlyRegulator {
        require(
            (_requestId > 0) && (_requestId <= _registrationIds.current()),
            "Invalid Registration Id"
        );
        require(
            !isHealthRegulator[newRegistration[_requestId].requestor],
            "Already a regulator"
        );
        require(!polled[_requestId][msg.sender], "Already Voted");
        RegisterRegulator storage tempInstance = newRegistration[_requestId];
        require(tempInstance.votingInProgress, "Voting Completed");
        if (_status == ApprovalStatus.APPROVED) {
            tempInstance.approvalCount++;
        } else {
            tempInstance.rejectedCount++;
        }
        polled[_requestId][msg.sender] = true;
    }

    function claimToBecomeRegulator(
        uint256 _requestId
    ) external onlyRegulatorRequestor(_requestId) {
        require(
            (_requestId > 0) && (_requestId <= _registrationIds.current()),
            "Invalid Registration Id"
        );
        require(
            !isHealthRegulator[newRegistration[_requestId].requestor],
            "Already a regulator"
        );
        RegisterRegulator storage tempInstance = newRegistration[_requestId];
        require(tempInstance.votingInProgress, "Voting Completed");
        require(
            (tempInstance.approvalCount) + (tempInstance.rejectedCount) ==
                totalRegulator,
            "Voting Yet to complete"
        );

        if (tempInstance.approvalCount > tempInstance.rejectedCount) {
            isHealthRegulator[tempInstance.requestor] = true;
            tempInstance._status = ApprovalStatus.APPROVED;
            tempInstance.votingInProgress = false;
            delete resgistrationPerAddr[tempInstance.requestor];
            totalRegulator++;
        } else {
            tempInstance.votingInProgress = false;
            tempInstance._status = ApprovalStatus.REJECTED;
            delete resgistrationPerAddr[tempInstance.requestor];
        }
    }

    function getTotalRegulator() external view returns (uint) {
        return totalRegulator;
    }

    function checkRegistration(
        uint256 _requestId
    ) external view returns (RegisterRegulator memory) {
        return newRegistration[_requestId];
    }

    function getRegistrationId(
        address _nominatedRegulator
    ) external view returns (uint) {
        return resgistrationPerAddr[_nominatedRegulator];
    }

    function verify_regulator(
        address _regulatorAddress
    ) external view returns (bool) {
        return isHealthRegulator[_regulatorAddress];
    }

    function register_attestation(
        address _healthID,
        address _ownerPublicKey
    ) external onlyRegulator {
        require(
            attestedHealthId[_healthID] == address(0),
            "Health ID already Attested"
        );
        attestedHealthId[_healthID] = _ownerPublicKey;
        whoAttested[_healthID] = msg.sender;
    }

    function verify_attestation(
        address _healthID
    ) external view returns (address) {
        require(
            attestedHealthId[_healthID] != address(0),
            "Health ID is not present"
        );
        return attestedHealthId[_healthID];
    }

    function revoke_attestation(address _healthID) external onlyRegulator {
        require(
            attestedHealthId[_healthID] != address(0),
            "Health ID is not present"
        );
        delete attestedHealthId[_healthID];
    }

    function getRegulator(address _healthID) external view returns (address) {
        require(
            whoAttested[_healthID] != address(0),
            "Health ID is not present"
        );
        return whoAttested[_healthID];
    }
}
