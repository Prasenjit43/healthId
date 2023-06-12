import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useNavigate,
} from "react-router-dom";
import "../App.css";

const RevokeAccess = ({ account, healthScContractInstance }) => {
  let navigate = useNavigate();
  const [userAddr, setUserAddr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await healthScContractInstance.methods
        .revokeAccess(userAddr)
        .send({ from: account[0] })
        .on("transactionHash", function (hash) {})
        .on("confirmation", function (confirmationNumber, receipt) {
          console.log("confirmationNumber:", confirmationNumber);
          console.log("receipt:", receipt);
          alert("Access Revoked");
        })
        .on("receipt", function (receipt) {
          console.log("Receipt:", receipt);
        })
        .on("error", function (error, receipt) {
          console.log("Error:", error);
          console.log("Receipt:", receipt);
        });
    } catch (error) {
      alert("Unexpected Error while revoking access");
      console.log("Unexpected Error while revoking access");
      console.log(error);
    }
    navigate("/");
  };

  const handleInputChange = (event) => {
    event.preventDefault();
    console.log("Event :", event.target.value);
    setUserAddr(event.target.value);
  };

  return (
    <div className="App">
      <br></br>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="address"
          // value={addr}
          onChange={handleInputChange}
        />
        &nbsp; &nbsp;
        <button type="submit"> Submit </button>
      </form>
    </div>
  );
};

export default RevokeAccess;
