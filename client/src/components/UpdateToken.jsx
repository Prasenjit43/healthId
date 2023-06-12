import React, { useEffect, useState } from "react";
import "../App.css";
import axios from "axios";
import keys from "../keys.json";

const UpdateToken = ({ account, healthScContractInstance}) => {
  const [tokenInput, setTokenInput] = useState(null);
  useEffect(() => {
    const retrieveHealthID = async () => {
      console.log("Inside retrieveHealthID");
    };
    retrieveHealthID();
  }, []);
 

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      token: tokenInput,
    };
    const jsonData = JSON.stringify(formData);
    console.log("jsonData : ", jsonData);
    const resFile = await axios({
      method: "post",
      url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      data: jsonData, //formData,
      headers: {
        Accept: "text/plain",
        pinata_api_key: `${keys.PINATA_API_KEY}`,
        pinata_secret_api_key: `${keys.PINATA_SECRET_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const jsonHash = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
    console.log("Hash :", jsonHash);


    try {
      await healthScContractInstance.methods
        .set_ipfsHash(resFile.data.IpfsHash)
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
      alert("Unexpected Error while setting ipfs hash");
      console.log("Unexpected Error while setting ipfs hash");
      console.log(error);
    }
  };

  const handleTokenChange = (event) => {
    event.preventDefault();
    console.log("Event :", event.target.value);
    setTokenInput(event.target.value);
  };

  return (
    <div className="App">
      <br></br>
      <form onSubmit={handleSubmit}>
        <div className="textarea-container">
          <textarea
            //value={token}
            onChange={handleTokenChange}
            className="textarea"
          />
        </div>
        <button type="submit"> Update </button>
      </form>
    </div>
  );
};

export default UpdateToken;
