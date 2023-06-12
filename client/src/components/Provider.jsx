import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "../App.css";
import UpdateToken from "./UpdateToken";
import GrantAccess from "./GrantAccess";
import RevokeAccess from "./RevokeAccess";
import Verification from "./Verification";
import healthSCArtifact from "../../../build/contracts/HealthSC.json";

const Provider = ({ state, account }) => {
  const nullHealthId = "0x0000000000000000000000000000000000000000";
  const [healthid, setHealthid] = useState("");
  const [status, setStatus] = useState(null);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [accessVisibility, setAccessVisibility] = useState("");
  const [paused, setPaused] = useState(false);
  const [healthScContractInstance, setHealthScContract] = useState(null);
  const [verifyHealthid, setverifyHealthid] = useState(false);

  const RegistrationStatus = Object.freeze({
    0: "Registration Initiated",
    1: "Verification Pending",
    2: "Verification Completed",
  });

  const retrieveHealthID = async () => {
    console.log("Inside retrieveHealthID");
    try {
      await state.healthidmContract.methods
        .getHealthId(account[0],"PROVIDER")
        .call({ from: account[0] })
        .then(function (result) {
          console.log("is HealthID exist for provider :", result);
          if (result != nullHealthId) {
            setHealthid(result.toString());

            /************************** */
            try {
              state.healthidmContract.methods
                .getHealthIdTrans(result.toString())
                .call({ from: account[0] })
                .then(function (result) {
                  console.log("Reslut :", result.state);
                  setStatus(RegistrationStatus[result.state]);
                });
            } catch (error) {
              alert("Unexpected Error while fetching Health ID details");
              console.log("Unexpected Error while fetching Health ID details");
              console.log(error);
            }
            /************************* */
          }
        });
    } catch (error) {
      console.log(error);
    }
  };

  const retrievePauseStatus = async () => {
    const healthSCContract = new state.web3.eth.Contract(
      healthSCArtifact.abi,
      healthid
    );
    setHealthScContract(healthSCContract);
    try {
      await healthSCContract.methods
        .getPauseStatus()
        .call({ from: account[0] })
        .then(function (result) {
          console.log("Pause status :", result);
          setPaused(result);
        });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    retrieveHealthID();
  }, []);

  useEffect(() => {
    healthid != "" && retrievePauseStatus();
  }, [healthid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await state.healthidmContract.methods
      .createHealthSCUser("PROVIDER")
      .send({ from: account[0] })
      .on("transactionHash", function (hash) {})
      .on("confirmation", function (confirmationNumber, receipt) {
        console.log("confirmationNumber:", confirmationNumber);
        console.log("receipt:", receipt);
      })
      .on("receipt", function (receipt) {
        console.log("Receipt:", receipt);
        alert("Account Created succeessfully");
        retrieveHealthID();
      })
      .on("error", function (error, receipt) {
        console.log("Error:", error);
        console.log("Receipt:", receipt);
      });
  };

  const handleTokenVisibilty = async (e) => {
    e.preventDefault();
    setTokenVisible(true);
  };

  const handleAccessGrant = async (e) => {
    e.preventDefault();
    setAccessVisibility("GRANT");
  };

  const handleAccessRevoke = async (e) => {
    e.preventDefault();
    setAccessVisibility("REVOKE");
  };

  const handleHealthIdVerification = async (e) => {
    e.preventDefault();
    setverifyHealthid(true);
  };

  const handlePause = async (e) => {
    e.preventDefault();
    if (paused) {
      // /****************** */
      try {
        await healthScContractInstance.methods
          .setUnpause()
          .send({ from: account[0] })
          .on("transactionHash", function (hash) {})
          .on("confirmation", function (confirmationNumber, receipt) {
            console.log("confirmationNumber:", confirmationNumber);
            console.log("receipt:", receipt);
            setPaused(false);
          })
          .on("receipt", function (receipt) {
            console.log("Receipt:", receipt);
          })
          .on("error", function (error, receipt) {
            console.log("Error:", error);
            console.log("Receipt:", receipt);
          });
      } catch (error) {
        alert("Unexpected Error while unpausing contract");
        console.log("Unexpected Error while unpausing contract");
        console.log(error);
      }
    } else {
      try {
        await healthScContractInstance.methods
          .setpause()
          .send({ from: account[0] })
          .on("transactionHash", function (hash) {})
          .on("confirmation", function (confirmationNumber, receipt) {
            console.log("confirmationNumber:", confirmationNumber);
            console.log("receipt:", receipt);
            setPaused(true);
          })
          .on("receipt", function (receipt) {
            console.log("Receipt:", receipt);
          })
          .on("error", function (error, receipt) {
            console.log("Error:", error);
            console.log("Receipt:", receipt);
          });
      } catch (error) {
        alert("Unexpected Error while pausing");
        console.log("Unexpected Error while pausing");
        console.log(error);
      }
    }
  };

  return (
    <div className="App">
      <br></br>
      {healthid == "" ? (
        <form onSubmit={handleSubmit}>
          <button type="submit">Initiate Registration</button>
        </form>
      ) : null}
      {healthid != "" ? (
        <>
          {" "}
          <label>Health ID : {healthid} </label>
          <br></br>
          <br></br>
          <label>Status : {status} </label>
        </>
      ) : null}

      <br></br>
      <br></br>
      {status == "Verification Completed" ? (
        <>
          <button type="submit" onClick={handleTokenVisibilty}>
            Update Token
          </button>
          &nbsp; &nbsp;
          <button type="submit" onClick={handlePause}>
            {" "}
            {paused ? "Unpause" : "Pause"}{" "}
          </button>
          &nbsp; &nbsp;
          <button type="submit" onClick={handleAccessGrant}>
            Grant Access
          </button>
          &nbsp; &nbsp;
          <button type="submit" onClick={handleAccessRevoke}>
            Revoke Access
          </button>
          &nbsp; &nbsp;
          <button type="submit" onClick={handleHealthIdVerification}>
            Verify Health Id
          </button>
        </>
      ) : null}
      {tokenVisible ? (
        <UpdateToken
          account={account}
          healthScContractInstance={healthScContractInstance}
        ></UpdateToken>
      ) : null}

      {accessVisibility == "GRANT" ? (
        <GrantAccess
          account={account}
          healthScContractInstance={healthScContractInstance}
        ></GrantAccess>
      ) : null}

      {accessVisibility == "REVOKE" ? (
        <RevokeAccess
          account={account}
          healthScContractInstance={healthScContractInstance}
        ></RevokeAccess>
      ) : null}

        {verifyHealthid ? (
        <Verification
          state = {state}
          account={account}
          healthScContractInstance={healthScContractInstance}
        ></Verification>
      ) : null}
    </div>
  );
};

export default Provider;
