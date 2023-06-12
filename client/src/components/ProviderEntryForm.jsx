import React, { useEffect, useState } from "react";
import "../App.css";
import axios from "axios";
import keys from "../keys.json";

const ProviderEntryForm = ({ state, account, healthid, publicKey, saveToken }) => {
  const [formData, setFormData] = useState({
    Name: "",
    Speciality:"",
    Licence:"",
    Date_of_issue:"",
    Date_of_expiry:""
  });

  const [fileName, setFileName] = useState("No image selected");
  const [file, setFile] = useState(null);
  const [fileString64, setfileString64] = useState("");


  const handleRegister = async (e) => {
    e.preventDefault();
    console.log("Form Data : ", formData);
    const ImgHash = await uploadFile();
    console.log("ImgHash : ", ImgHash);


    /** Register HealthId, User PublicKey and Regulator Public Key to RegisterSc contract */
    try {
      await state.registrySCContract.methods
        .register_attestation(healthid, publicKey)
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
      alert("Unexpected Error while creating attestation");
      console.log("Unexpected Error while creating attestation");
      console.log(error);
    }


    /** Updating state to HealthIDM contract */
    try {
      await state.healthidmContract.methods
        .setState(healthid, 2, state.registrySCContract._address)
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
      alert("Unexpected Error while updating registration state");
      console.log("Unexpected Error while updating registration state");
      console.log(error);
    }

    formData.PublicKey = publicKey;
    formData.HealthId = healthid;
    formData.ImgHash = ImgHash;
    formData.Regulator_PK = account[0];
    console.log("formData Final : ", formData);
    const messageToBeHashed =
      formData.Name +
      formData.Speciality +
      formData.Licence +
      formData.Date_of_issue +
      formData.Date_of_expiry +
      formData.PublicKey +
      formData.HealthId +
      formData.ImgHash +
      formData.Regulator_PK;
    console.log("messageToBeHashed : ", messageToBeHashed);
    const hashedMessage = await state.web3.utils.keccak256(
      state.web3.eth.abi.encodeParameters(["string"], [messageToBeHashed])
    );
    console.log("Hashed Message : ", hashedMessage);
    const sign = await state.web3.eth.personal.sign(hashedMessage, account[0]);
    console.log("sign : ", sign);
    formData.signature = sign;
    const params = new URLSearchParams(formData);

    await generateToken(params);
  }


  /* Function to generate token */
  const generateToken = async (params) => {
    let generatedToken;
    fetch(`http://localhost:3000/generate-token?${params}`)
      .then(response => response.json())
      .then(data => {
        generatedToken = data.token;
        console.log("Generated Token : ", generatedToken);
        saveToken(generatedToken);
      })
      .catch(error => {
        alert("Unexpected Error while generating token");
        console.error('Error:', error);
      });
  }


  const getBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new window.FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        console.log("Called", reader);
        const baseURL = reader.result;
        console.log(baseURL);
        resolve(baseURL);
      };
    });
  };

  const handleInputChange = (event) => {
    event.preventDefault();
    let data;
    let result;
    const { name, value } = event.target;
    if (name === "base64") {
      data = event.target.files[0]; //files array of files object

      getBase64(data)
        .then((result) => {
          setFormData((formData) => ({ ...formData, [name]: result }));
        })
        .catch((err) => {
          console.log(err);
        });
      setFileName(event.target.files[0].name);
    } else {
      setFormData((formData) => ({ ...formData, [name]: value }));
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    console.log("Reject Clicked");

    /** Updating state to HealthIDM contract */
    try {
      await state.healthidmContract.methods
        .setState(healthid, 1, state.registrySCContract._address)
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
      alert("Unexpected Error while updating registration state");
      console.log("Unexpected Error while updating registration state");
      console.log(error);
    }
  }


  const handleFileUploadChange = (e) => {
    const data = e.target.files[0]; //files array of files object
    console.log(data);
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(data);
    reader.onloadend = () => {
      setFile(e.target.files[0]);
    };
    setFileName(e.target.files[0].name);
    e.preventDefault();
  };


  const uploadFile = async () => {
   // e.preventDefault();
   let ImgHash;
    if (file) {
      try {
        const formDataFile = new FormData();
        formDataFile.append("file", file);
        console.log("formDataFile : ", formDataFile);

        const resFile = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formDataFile,
          headers: {
            pinata_api_key: keys.PINATA_API_KEY,
            pinata_secret_api_key: keys.PINATA_SECRET_API_KEY,
            "Content-Type": "multipart/form-data",
          },
        });
        ImgHash = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
        console.log("IMG hash : ", ImgHash);
        alert("Successfully Image Uploaded");
        setFileName("No image selected");
        setFile(null);
      } catch (e) {
        alert("Unable to upload image to Pinata");
      }
    }
    return ImgHash;
  };



  return (
    <div className="App">
      <br></br>
      <form onSubmit={handleRegister}>
        <label>
          ************************************************************
        </label>
        <br></br>
        <label>
          Name :
          <input
            type="text"
            name="name"
            value={formData.Name}
            onChange={handleInputChange}
          />
        </label>
        <br></br>
        <br></br>
        <label>
          Speciality :
          <input
            type="text"
            name="speciality"
            value={formData.Speciality}
            onChange={handleInputChange}
          />
        </label>
        <br></br>
        <br></br>
        <label>
          Licence No :
          <input
            type="text"
            name="licence"
            value={formData.Licence}
            onChange={handleInputChange}
          />
        </label>
        <br></br>
        <br></br>
        <label>
          Date of Issue :
          <input
            type="date"
            name="date_of_issue"
            value={formData.Date_of_issue}
            onChange={handleInputChange}
          />
        </label>
        <br></br>
        <br></br>
        <label>
          Date of Expiry :
          <input
            type="date"
            name="date_of_expiry"
            value={formData.Date_of_expiry}
            onChange={handleInputChange}
          />
        </label>
        <br></br>
        <br></br>
        <label htmlFor="file-upload" className="choose">
          Choose Image :
        </label>

        <input
          type="file"
          id="file-upload"
          name="base64"
          onChange={handleFileUploadChange}
        />

        <br></br>
        <br></br>
        <button type="submit">Register</button>
        &nbsp;&nbsp;
        <button type="submit" onClick={handleReject} >Reject</button>
      </form>
    </div>
  );
};

export default ProviderEntryForm;
