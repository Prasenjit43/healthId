// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract VerifyMsg {
    constructor() {}

    function verify(
        string memory _message,
        address _signer,
        bytes memory _signature
    ) public pure returns (bool) {
        bytes32 hashedMsg = getHashedMsg(_message);
        bytes32 ethSignedHashedMsg = getEthSignedHashedMsg(hashedMsg);
        address recovedSigner = recoverSigner(ethSignedHashedMsg, _signature);

        return recovedSigner == _signer;
    }

    function getHashedMsg(
        string memory _message
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(_message));
    }

    function getEthSignedHashedMsg(
        bytes32 _hashedMsg
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", _hashedMsg)
            );
    }

    function recoverSigner(
        bytes32 _ethSignedHashedMsg,
        bytes memory _signature
    ) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedHashedMsg, v, r, s);
    }

    function splitSignature(
        bytes memory _signature
    ) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(_signature.length == 65, "Invalid Signature Length");
        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(_signature, 32))
            // second 32 bytes
            s := mload(add(_signature, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(_signature, 96)))
        }
    }
}
