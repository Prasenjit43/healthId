import React, { useEffect, useState } from "react";
import "../App.css";
import healthSCArtifact from "../../../build/contracts/HealthSC.json";
import PatientEntryForm from "./PatientEntryForm";
import ProviderEntryForm from "./ProviderEntryForm";
import keys from "../keys.json";

const Regulator = ({ state, account }) => {
  const [healthid, setHealthid] = useState("");
  const [healthIdInput, setHealthIdInput] = useState(null);
  const [healthIdDetails, setHealthIdDetails] = useState({
    owner_type: null,
    stage: null,
  });
  const [publicKey, setPublicKey] = useState("");
  const [timestamp, setTimeStamp] = useState("");
  const [challengeMsg, setChallengeMsg] = useState("");
  const [generatedSign, setGeneratedSign] = useState("");
  const [inputSign, setInputSign] = useState("");
  const [verification, setVerification] = useState(false);
  const [token, setToken] = useState(null);
  const [inputRegId, setInputRegId] = useState(null);
  const [selectedOption2, setSelectedOption2] = useState("0");
  const RegistrationStatus = Object.freeze({
    0: "Registration Initiated",
    1: "Verification Pending",
    2: "Verification Completed",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    //Get HealthID details from HealthCareIDM Contract
    try {
      await state.healthidmContract.methods
        .getHealthIdTrans(healthIdInput)
        .call({ from: account[0] })
        .then(function (result) {
          if (result.ownerType == "PATIENT") {
            setHealthid(healthIdInput);
            setHealthIdDetails({
              owner_type: "PATIENT",
              stage: RegistrationStatus[result.state],
            });
          } else if (result.ownerType == "PROVIDER") {
            setHealthid(healthIdInput);
            setHealthIdDetails({
              owner_type: "PROVIDER",
              stage: RegistrationStatus[result.state],
            });
          } else {
            console.log("Invalid Health ID");
            alert("Invalid Health ID - Timestamp 0 ");
          }
        });
    } catch (error) {
      alert("Unexpected Error while fetching Health ID details");
      console.log("Unexpected Error while fetching Health ID details");
      console.log(error);
    }
  };

  const handleRegIdSearchSubmit = async (e) => {
    e.preventDefault();

    try {
      await state.registrySCContract.methods
        .vote(inputRegId, selectedOption2)
        .send({ from: account[0] })
        .on("transactionHash", function (hash) {})
        .on("confirmation", function (confirmationNumber, receipt) {
          console.log("confirmationNumber:", confirmationNumber);
          console.log("receipt:", receipt);
        })
        .on("receipt", function (receipt) {
          console.log("Receipt:", receipt);
        })
        .on("error", function (error, receipt) {
          console.log("Error:", error);
          console.log("Receipt:", receipt);
        });
    } catch (error) {
      const errorMessage = error.message;
      if (errorMessage.includes("Already Voted")) {
        alert("You already voted for candidate");
      } else if (errorMessage.includes("Already a regulator")) {
        alert("Requestor already become a regulator");
      } else if (errorMessage.includes("Voting Completed")) {
        alert("Voting Completed");
      } else if (errorMessage.includes("Invalid Registration Id")) {
        alert("Invalid Registration Id");
      } else {
        console.log("errorMessage :", errorMessage);
        alert(errorMessage);
      }
    }
  };

  const handleHealthIdChange = (event) => {
    event.preventDefault();
    console.log("Event :", event.target.value);
    setHealthIdInput(event.target.value);
    setHealthid("");
    setHealthIdDetails({ owner_type: null, stage: null });
  };

  const handleRegIdChange = (event) => {
    event.preventDefault();
    console.log("Event :", event.target.value);
    setInputRegId(event.target.value);
  };

  const handleRegIdClick = (event) => {
    event.preventDefault();
    console.log("Event :", event.target.value);
  };

  const handleOption2Change = async (e) => {
    e.preventDefault();
    setSelectedOption2(e.target.value);
    console.log(e.target.value);
  };

  const handleHealthIdClick = (event) => {
    event.preventDefault();
    console.log("Event :", event.target.value);
    setHealthid("");
    setHealthIdDetails({ owner_type: null, stage: null });
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
    if (recoveredSigner == publicKey) {
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

  const handleChallangeSubmit = async (e) => {
    e.preventDefault();
    const healthSCContract = new state.web3.eth.Contract(
      healthSCArtifact.abi,
      healthid
    );
    let bc_public_key;
    let bc_timeStamp;

    /** Getting Public Key from HealthSC Contract */
    try {
      await healthSCContract.methods
        .get_public_key()
        .call({ from: account[0] })
        .then(function (result) {
          console.log("Public Key :", result);
          bc_public_key = result;
          setPublicKey(result);
        });
    } catch (error) {
      alert("Unexpected Error while fetching User Public Key details");
      console.log("Unexpected Error while fetching User Public Key details");
      console.log(error);
    }

    /** Getting Timestamp from HealthSC Contract */
    try {
      await healthSCContract.methods
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
      healthid + bc_public_key + bc_timeStamp + Math.floor(Date.now() / 1000);
    setChallengeMsg(tempToken);
    //console.log("challangemsg : ", tempToken);
    const signatureOutput = await state.web3.eth.accounts.sign(
      tempToken,
      keys[bc_public_key]
    );
    console.log("Signature :", signatureOutput.signature);
    setGeneratedSign(signatureOutput.signature);
  };

  const saveToken = (_token) => {
    console.log("Token : ", _token);
    setToken(_token);
  };

  return (
    <div className="App">
      <br></br>
      <br></br>
      <form onSubmit={handleSubmit}>
        <label>
          Enter Health Id to Verify :
          <input
            type="text"
            name="healthId1"
            value={healthIdInput}
            onChange={handleHealthIdChange}
            onClick={handleHealthIdClick}
          />
          &nbsp; &nbsp;
        </label>
        <button type="submit"> Search </button>
      </form>
      <br></br>

      <form onSubmit={handleRegIdSearchSubmit}>
        <label>
          Enter Registration Id to Vote:
          <input
            type="text"
            name="regId"
            //value={healthIdInput}
            onChange={handleRegIdChange}
            onClick={handleRegIdClick}
          />
          <select value={selectedOption2} onChange={handleOption2Change}>
            <option value="0">APPROVE</option>
            <option value="1">REJECT</option>
          </select>
          &nbsp; &nbsp;
        </label>
        <button type="submit"> Vote </button>
      </form>

      <br></br>
      {healthid != "" ? (
        <>
          <label>Health ID : {healthid != "" ? healthid : "Invlaid"} </label>
          <br></br>
          <label>Status : {healthIdDetails.stage} </label>
          <br></br>
          {/* <label>Status : {healthIdDetails.stage} </label>
          <form onSubmit={handleChallangeSubmit}>
          <button type="submit"> Generate Challange Message </button>
          </form> */}
        </>
      ) : null}
      {/*   */}
      {healthid != "" &&
      generatedSign == "" &&
      !verification &&
      healthIdDetails.stage != "Verification Completed" ? (
        <form onSubmit={handleChallangeSubmit}>
          <button type="submit"> Generate Challange Message </button>
        </form>
      ) : null}

      {healthid != "" && generatedSign != "" ? (
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

      {healthIdDetails.owner_type == "PATIENT" &&
      healthIdDetails.stage != "Verification Completed" &&
      verification ? (
        <PatientEntryForm
          state={state}
          account={account}
          healthid={healthid}
          publicKey={publicKey}
          saveToken={saveToken}
        >
          {" "}
        </PatientEntryForm>
      ) : null}

      {healthIdDetails.owner_type == "PROVIDER" &&
      healthIdDetails.stage != "Verification Completed" &&
      verification ? (
        <ProviderEntryForm
          state={state}
          account={account}
          healthid={healthid}
          publicKey={publicKey}
          saveToken={saveToken}
        >
          {" "}
        </ProviderEntryForm>
      ) : null}

      {/* {token != null ?
        (<label>Token : {token} </label>) :
        (null)
      } */}

      {token != null ? (
        <div className="textarea-container">
          <textarea
            value={token}
            //onChange={handleTokenChange}
            readOnly
            className="textarea"
          />
        </div>
      ) : null}
    </div>
  );
};

export default Regulator;
