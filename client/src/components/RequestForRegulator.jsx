import React, { useEffect, useState } from "react";
import "../App.css";

const RequestForRegulator = ({ state, account }) => {
  const [regulator, setRegulator] = useState("");
  const [regStatus, setRegStatus] = useState(null);
  const [regId, setRegId] = useState(0);
  const [totalRegulator, setTotalRegulator] = useState(0);
  const [votingStatus, setVotingStatus] = useState(null);

  const RegistrationStatus = Object.freeze({
    0: "Approved",
    1: "Rejected",
    2: "Un-Known",
  });

  useEffect(() => {
    const getRegistrationRequest = async (_requestId) => {
      try {
        await state.registrySCContract.methods
          .checkRegistration(_requestId)
          .call({ from: account[0] })
          .then(function (result) {
            console.log(
              "Registration Request Status : ",
              RegistrationStatus[result._status]
            );
            if (result.approvalCount + result.rejectedCount == totalRegulator) {
              console.log("Voting completed");
              setVotingStatus("COMPLETED");
            } else {
              console.log("Voting in progress");
              setVotingStatus("IN PROGRESS");
            }
            setRegStatus(result._status);
          });
      } catch (error) {
        alert("Unexpected Error while checking");
        console.log("Unexpected Error while fetching registration");
        console.log(error);
      }
    };

    const fetchRegistrationId = async () => {
      try {
        await state.registrySCContract.methods
          .getRegistrationId(account[0])
          .call({ from: account[0] })
          .then(function (result) {
            console.log(
              "Registration Id : ",
              result == 0 ? "No Registered" : result
            );
            if (result != 0) {
              setRegulator("INTRANSIT");
              getRegistrationRequest(result);
              setRegId(result);
            }
          });
      } catch (error) {
        //alert("Unexpected Error while checking");
        console.log("Unexpected Error while fetching registration Id");
        console.log(error);
      }
    };

    const veriFyRegulator = async () => {
      console.log("Inside veriFyRegulator");
      try {
        await state.registrySCContract.methods
          .verify_regulator(account[0])
          .call({ from: account[0] })
          .then(function (result) {
            console.log("is Regulator :", result);
            if (result) {
              //alert("Your are already a regulator ");
              setRegulator("REGULATOR");
            } else {
              fetchRegistrationId();
            }
          });
      } catch (error) {
        //alert(error.message);
        console.log(error.message);
      }
    };
    totalRegulator != 0 && veriFyRegulator();
  }, [totalRegulator]);

  useEffect(() => {
    const getTotalRegulator = async () => {
      try {
        await state.registrySCContract.methods
          .getTotalRegulator()
          .call({ from: account[0] })
          .then(function (result) {
            console.log("Total Regulator : ", result);
            setTotalRegulator(result);
          });
      } catch (error) {
        alert("nexpected Error while fetching total regulator");
        console.log("Unexpected Error while fetching total regulator");
        console.log(error);
      }
    };
    getTotalRegulator();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await state.registrySCContract.methods
        .register_regulator()
        .send({ from: account[0] })
        .on("transactionHash", function (hash) { })
        .on("confirmation", function (confirmationNumber, receipt) {
          console.log("confirmationNumber:", confirmationNumber);
          console.log("receipt:", receipt);
          setRegStatus(2);
          setRegulator("INTRANSIT");
          //setRegulator("INTRANSIT");
        })
        .on("receipt", function (receipt) {
          console.log("Receipt:", receipt);
        })
        .on("error", function (error, receipt) {
          console.log("Error:", error);
          console.log("Receipt:", receipt);
        });
    } catch (error) {
      alert("Unexpected Error while creating request for regulator");
      console.log("UUnexpected Error while creating request for regulator");
      console.log(error);
    }
  };

  const checkStatus = async (e) => {
    e.preventDefault();
    let result;
    try {
      const result = await state.registrySCContract.methods
        .claimToBecomeRegulator(regId)
        .send({ from: account[0] })
        .on("transactionHash", function (hash) { })
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
      if (errorMessage.includes("Voting Yet to complete")) {
        alert("Voting Yet to complete");
      } else {
        console.log("errorMessage :", errorMessage);
        alert(errorMessage);
      }
    }
  };

  return (
    <div className="App">
      <br></br>

      {regulator == "" ? (
        <form onSubmit={handleSubmit}>
          <button type="submit"> Submit Request </button>
        </form>
      ) : null}

      {regulator == "INTRANSIT" ? (
        <>
          <label>
            Request Status : {RegistrationStatus[regStatus]}, Registration Id :{" "}
            {regId} , Voting Status : {votingStatus}
          </label>
          <br></br>
          <button type="submit" onClick={checkStatus}>
            {" "}
            Check Status{" "}
          </button>
        </>
      ) : null}
    </div>
  );
};

export default RequestForRegulator;
