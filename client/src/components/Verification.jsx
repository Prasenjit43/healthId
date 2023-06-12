import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "../App.css";
import axios from "axios";
import keys from "../keys.json";
import healthSCArtifact from "../../../build/contracts/HealthSC.json";

const Verification = ({ state, account, healthScContractInstance }) => {
  const nullHealthId = "0x0000000000000000000000000000000000000000";
  const [inputHealthID, setInputHealthID] = useState(null);
  const [errorFlag, setErrorFlag] = useState(false);
  const [userPK, setUserPK] = useState("");
  const [timestamp, setTimeStamp] = useState("");
  const [verification, setVerification] = useState(false);
  const [generatedSign, setGeneratedSign] = useState("");
  const [challengeMsg, setChallengeMsg] = useState("");
  const [inputSign, setInputSign] = useState("");
  const [token, setToken] = useState(null);
  const [signStatus, setSignStatus] = useState(null);
  const [ownerType, setOwnerType] = useState(null);

  useEffect(() => {
    const retrieveHealthID = async () => {
      console.log("Inside retrieveHealthID");
      console.log("healthScContractInstance : ", healthScContractInstance);
    };
    retrieveHealthID();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    !errorFlag && (await checkHealthId());
    !errorFlag && (await getOwnerType());
    
  };

  const checkHealthId = async () => {
    console.log("Inside checkHealthId");
    try {
      await state.registrySCContract.methods
        .verify_attestation(inputHealthID)
        .call({ from: account[0] })
        .then(function (result) {
          console.log("is HealthID exist for provider :", result);
          if (result != nullHealthId) {
            setUserPK(result.toString());
          } else {
            setErrorFlag(true);
          }
        });
    } catch (error) {
      //alert("Falied to load getHealthId");
      console.log(error);
    }
  };


  const getOwnerType = async () => {
    console.log("Inside getUserType");
    try {
      await state.healthidmContract.methods
        .getHealthIdTrans(inputHealthID)
        .call({ from: account[0] })
        .then(function (result) {
          console.log("Owner Type  :", result.ownerType);
          setOwnerType(result.ownerType);
        });
    } catch (error) {
      //alert("Falied to load getHealthId");
      console.log(error);
      setErrorFlag(true);
    }
  };







  const handleChallangeSubmit = async (e) => {
    e.preventDefault();
    let bc_timeStamp;

    /** Getting Timestamp from HealthSC Contract */
    try {
      await healthScContractInstance.methods
        .get_timestamp()
        .call({ from: account[0] })
        .then(function (result) {
          console.log("get_timestamp :", result);
          bc_timeStamp = result;
          setTimeStamp(result);
        });
    } catch (error) {
      alert("Unexpected Error while fetching User Timestamp details");
      console.log("Unexpected Error while fetching User Timestamp details");
      console.log(error);
    }

    const tempToken =
      inputHealthID + userPK + bc_timeStamp + Math.floor(Date.now() / 1000);
    setChallengeMsg(tempToken);
    console.log("challangemsg : ", tempToken);
    const signatureOutput = await state.web3.eth.accounts.sign(
      tempToken,
      keys[userPK]
    );
    console.log("Signature :", signatureOutput.signature);
    setGeneratedSign(signatureOutput.signature);
  };

  const handleInputChange = (event) => {
    event.preventDefault();
    console.log("Event :", event.target.value);
    setInputHealthID(event.target.value);
  };

  const handleSignInputChange = (event) => {
    event.preventDefault();
    console.log("Event :", event.target.value);
    setInputSign(event.target.value);
  };

  const handleSignatureSubmit = async (e) => {
    e.preventDefault();
    const recoveredSigner = await state.web3.eth.accounts.recover(
      challengeMsg,
      inputSign
    );
    console.log("Recovered Sign :", recoveredSigner);
    //console.log("publicKey :", publicKey);
    if (recoveredSigner == userPK) {
      console.log("Signature Verified");
      alert("Signature Verified");
      setVerification(true);
      setGeneratedSign("");
    } else {
      alert("Invalid Signature");
      setVerification(false);
      setGeneratedSign("");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    console.log("Account[0] : ", account[0]);
    const healthSCContract_Patient = new state.web3.eth.Contract(
      healthSCArtifact.abi,
      inputHealthID
    );

    let returnToken;
    let ipfsData;

    try {
      await healthSCContract_Patient.methods
        .get_ipfsHash()
        .call({ from: account[0] })
        .then(function (result) {
          console.log("IPFS Hash :", result);
          //returnToken = getIPFSData(result);
          ipfsData = result;
        });
    } catch (error) {
      const errorMessage = error.message;
      if (errorMessage.includes("YOU ARE NOT ALLOWED")) {
        alert("You are not allowed to see the data, request access from user");
      } else {
        console.log("errorMessage :", errorMessage);
        alert(errorMessage);
      }
    }

    returnToken = await getIPFSData(ipfsData);
    console.log("returnToken : ", returnToken);
    const decodedToken = await decoded_token(returnToken);
    console.log("decodedToken 111: ", decodedToken);
    let messageToBeHashed;
    if(ownerType==="PATIENT"){
       messageToBeHashed =
      decodedToken.patientname +
      decodedToken.idType +
      decodedToken.idNumber +
      decodedToken.PublicKey +
      decodedToken.HealthId +
      decodedToken.ImgHash +
      decodedToken.Regulator_PK;
    } else if(ownerType==="PROVIDER"){
       messageToBeHashed =
      decodedToken.Name +
      decodedToken.Speciality +
      decodedToken.Licence +
      decodedToken.Date_of_issue +
      decodedToken.Date_of_expiry +
      decodedToken.PublicKey +
      decodedToken.HealthId +
      decodedToken.ImgHash +
      decodedToken.Regulator_PK;
    }
    console.log("messageToBeHashed : ", messageToBeHashed);

    //Take Regulator_PK from Contract
    /** Validating Signature */
    try {
      await state.verifyMsgContract.methods
        .verify(
          messageToBeHashed,
          decodedToken.Regulator_PK,
          decodedToken.signature
        )
        .call({ from: account[0] })
        .then(function (result) {
          console.log("Signature result :", result);
          setSignStatus(result);
        });
    } catch (error) {
      alert("Unexpected Error while validating signature");
      console.log("Unexpected Error while validating signature");
      console.log(error);
    }
  };

  const getIPFSData = async (ipfsCid) => {
    let output;
    await axios({
      method: "get",
      url: `https://gateway.pinata.cloud/ipfs/${ipfsCid}`,
      headers: {
        Accept: "text/plain",
      },
    })
      .then((response) => {
        console.log("JSON object retrieved successfully:", response.data.token);
        output = response.data.token;
      })
      .catch((error) => {
        console.error("Error retrieving JSON object:", error);
      });
    return output;
  };

  /* Function to decode token */
  const decoded_token = async (_token) => {
    let decoded_token;
    await fetch(`http://localhost:3000/decode-token?token=${_token}`)
      .then((response) => response.json())
      .then((data) => {
        decoded_token = data;
        console.log("decoded_token : ", decoded_token);
        console.log(
          "decoded_token payload: ",
          decoded_token.decodedToken.payload
        );
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    return decoded_token.decodedToken.payload;
  };

  return (
    <div className="App">
      <br></br>
      <form onSubmit={handleSubmit}>
        <label>Health ID : </label>
        <input
          type="text"
          name="address"
          // value={addr}
          onChange={handleInputChange}
        />
        &nbsp; &nbsp;
        <button type="submit"> Submit </button>
      </form>
      {userPK != "" && generatedSign == "" && !verification ? (
        <form onSubmit={handleChallangeSubmit}>
          <button type="submit"> Generate Challange Message </button>
        </form>
      ) : null}
      {userPK != "" && generatedSign != "" ? (
        <>
          <label>Input Signature </label>
          <input
            type="text"
            name="signText"
            //value={healthIdInput}
            onChange={handleSignInputChange}
          />
          <form onSubmit={handleSignatureSubmit}>
            <button type="submit"> Verify Signature </button>
          </form>
        </>
      ) : null}
      {userPK != "" && verification ? (
        <button type="submit" onClick={handleVerify}>
          {" "}
          Verify{" "}
        </button>
      ) : null}
      <br></br>
      {signStatus != null ? (
        <label> {signStatus ? "Valid Token" : "Invalid Token"} </label>
      ) : null}
    </div>
  );
};

export default Verification;
