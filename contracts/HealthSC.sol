// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "@openzeppelin/contracts/security/Pausable.sol";

contract HealthSC is Pausable {
    address private owner;
    uint256 timeStamp;
    string private ipfsHash;

    mapping(address => bool) public addressExist;

    modifier onlyOwner() {
        require(msg.sender == owner, "YOU ARE NOT OWNER");
        _;
    }

    modifier isAllowed() {
        require(addressExist[msg.sender], "YOU ARE NOT ALLOWED");
        _;
    }

    constructor(address _sender) {
        owner = _sender;
        timeStamp = block.timestamp;
    }

    function get_public_key() external view returns (address) {
        require(owner != address(0), "Owner is not set");
        return owner;
    }

    function get_timestamp() external view returns (uint) {
        return timeStamp;
    }

    function set_ipfsHash(string memory _hashId) external onlyOwner {
        require(bytes(_hashId).length != 0, "HashId should not be null");
        ipfsHash = _hashId;
    }

    function get_ipfsHash()
        external
        view
        whenNotPaused
        isAllowed
        returns (string memory)
    {
        return ipfsHash;
    }

    function setpause() external onlyOwner {
        super._pause();
    }

    function setUnpause() external onlyOwner {
        super._unpause();
    }

    function getPauseStatus() external view returns (bool) {
        return super.paused();
    }

    function grantAccess(address _addr) external onlyOwner {
        require(!addressExist[_addr], "Access already granted");
        addressExist[_addr] = true;
    }

    function revokeAccess(address _addr) external onlyOwner {
        require(addressExist[_addr], "Access already revoked");
        addressExist[_addr] = false;
    }
}
