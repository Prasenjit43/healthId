// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./HealthSC.sol";
import "./RegistrySC.sol";

contract HealthCareIDM {
    enum Stages {
        REGISTRATION_INITIATED,
        VERIFICATION_PENDING,
        VERIFICATION_COMPLETED
    }

    struct HealthIdTransaction {
        string ownerType;
        Stages state;
    }

    //Health ID Contract ->  HealthIdTransaction
    mapping(address => HealthIdTransaction) public headlthIdtrans;

    //Patient/Hospital address -> Health ID
    //mapping(address => address) public healthIdPerAddress;
    mapping(address => mapping(string => address)) public isHealthIDExist;
    HealthSC newhealthSC;

    modifier onlyRegulator(RegistrySC _registrySCAddr) {
        require(
            (_registrySCAddr.verify_regulator(msg.sender)),
            "You are not regulator"
        );
        _;
    }

    function createHealthSCUser(string memory _ownerType) external {
        require(
            isHealthIDExist[msg.sender][_ownerType] == address(0),
            "HEALTH ACCOUNT ALREADY PRESENT"
        );
        newhealthSC = new HealthSC(msg.sender);
        isHealthIDExist[msg.sender][_ownerType] = address(newhealthSC);

        HealthIdTransaction memory tempHealthIdTras = HealthIdTransaction({
            ownerType: _ownerType,
            state: Stages.REGISTRATION_INITIATED
        });
        headlthIdtrans[address(newhealthSC)] = tempHealthIdTras;
    }

    function setState(
        address _healthId,
        Stages _state,
        RegistrySC _registrySCAddr
    ) public onlyRegulator(_registrySCAddr) {
        headlthIdtrans[_healthId].state = _state;
    }

    function getState(address _healthId) external view returns (Stages) {
        return headlthIdtrans[_healthId].state;
    }

    function getHealthId(
        address _addr,
        string memory _ownerType
    ) external view returns (address) {
        return isHealthIDExist[_addr][_ownerType];
    }

    function getHealthIdTrans(
        address _healthId
    ) external view returns (HealthIdTransaction memory) {
        return headlthIdtrans[_healthId];
    }
}
