This repository contains the implementation of a HealthCareIDM (Healthcare Identity Management) smart contract system written in Solidity. The contract enables the registration and verification of healthcare identities and provides functionalities for regulators and healthcare providers. The contract includes the `HealthCareIDM`, `HealthSC`, and `RegistrySC` contracts.

The `HealthCareIDM` contract manages the creation and state tracking of healthcare identities. It includes features such as registration initiation, verification, and retrieval of identity information.

The `HealthSC` contract represents a healthcare identity and provides methods for managing its attributes and access control. It includes features like setting and retrieving IPFS hash, pausing and unpausing functionality, and managing access permissions.

The `RegistrySC` contract handles the registration and verification process for healthcare regulators. It allows the registration of new regulators, voting on registration requests, and attesting healthcare identities.

To deploy the contracts, compile them using a Solidity compiler of version >= 0.4.22 < 0.9.0, and deploy the contracts in the following order: `HealthCareIDM`, `HealthSC`, and `RegistrySC`.

This project is licensed under the MIT License. Use it at your own risk.

Please note that this implementation is for educational purposes and may not cover all possible security considerations.
