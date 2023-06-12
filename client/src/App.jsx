import React, { useEffect, useState } from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useNavigate,
  Navigate,
} from "react-router-dom";
import Patient from "./components/Patient";
import Regulator from "./components/Regulator";
import Provider from "./components/Provider";
import RequestForRegulator from "./components/RequestForRegulator";
import Web3 from "web3";
import idmArtifact from "../../build/contracts/HealthCareIDM.json";
import registrySCArtifact from "../../build/contracts/RegistrySC.json";
import verifyMsgArtifact from "../../build/contracts/VerifyMsg.json";

const App = () => {
  const [account, setAccount] = useState("");
  const [state, setState] = useState({
    web3: null,
    healthidmContract: null,
    registrySCContract: null,
    verifyMsgContract: null,
  });
  const [validRegulator, setvalidRegulator] = useState(false);
  const IDM_ADDRESS = "0x1dBac0Af9CCe7420e1F8Bf54fEaECC4B2D8dAdEF";
  const REGISTRY_SC_ADDRESS = "0x2E846eFfBB56f7e44EC7F9d25e6b00f6B2b957E5";
  const VERIFY_MSG_ADDRESS = "0x74576e31664A3445264A6f0af85B79FE1f6B7899";

  useEffect(() => {
    const connectWallet = async () => {
      console.log("Inside connect wallet");
      try {
        const { ethereum } = window;
        if (ethereum) {
          const web3 = new Web3(window.ethereum);
          // const account = await ethereum.request({
          //   method: "eth_requestAccounts",
          // });
          await ethereum.request({
            method: "eth_requestAccounts",
          });
          const account = await web3.eth.getAccounts();
          window.ethereum.on("chainChanged", () => {
            window.location.reload();
          });
          window.ethereum.on("accountsChanged", () => {
            window.location.reload();
          });
          const healthIdContract = new web3.eth.Contract(
            idmArtifact.abi,
            IDM_ADDRESS
          );
          const registrySCContract = new web3.eth.Contract(
            registrySCArtifact.abi,
            REGISTRY_SC_ADDRESS
          );
          const verifyMsgContract = new web3.eth.Contract(
            verifyMsgArtifact.abi,
            VERIFY_MSG_ADDRESS
          );

          try {
            await registrySCContract.methods
              .verify_regulator(account[0])
              .call({ from: account[0] })
              .then(function (result) {
                console.log("is Regulator :", result);
                if (!result) {
                } else {
                  setvalidRegulator(true);
                }
              });
          } catch (error) {
            console.log(error);
          }

          setAccount(account);
          setState({
            web3: web3,
            healthidmContract: healthIdContract,
            registrySCContract: registrySCContract,
            verifyMsgContract: verifyMsgContract,
          });
        } else {
          alert("Please install metamask");
        }
      } catch (error) {
        console.log(error);
      }
    };
    connectWallet();
  }, []);
  console.log("State :", state);
  console.log("account :", account[0]);

  return (
    <Router>
      <div className="App">
        <nav>
          <ul className="nav-links">
            <li>
              <Link
                to="/Patient"
                className="nav-link"
                activeClassName="active-link"
              >
                Patient
              </Link>
            </li>
            <li>
              <Link
                to="/Provider"
                className="nav-link"
                activeClassName="active-link"
              >
                Health Provider
              </Link>
            </li>

            {validRegulator ? (
              <li>
                <Link
                  to="/Regulator"
                  className="nav-link"
                  activeClassName="active-link"
                >
                  Health Regulator
                </Link>
              </li>
            ) : null}
            {!validRegulator ? (
              <li>
                <Link
                  to="/RequestForRegulator"
                  className="nav-link"
                  activeClassName="active-link"
                >
                  Request to become Regulator
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
        <br></br>
        <nav>
          {" "}
          Logged In address : {account[0] ? account[0] : "Not Connected"}
        </nav>
      </div>

      <Routes>
        {/* Add your routes here */}
        <Route
          path="/Patient"
          element={<Patient state={state} account={account} />}
        ></Route>
        <Route
          path="/Provider"
          element={<Provider state={state} account={account} />}
        ></Route>
        <Route
          path="/Regulator"
          element={<Regulator state={state} account={account} />}
        ></Route>

        <Route
          path="/RequestForRegulator"
          element={<RequestForRegulator state={state} account={account} />}
        ></Route>
      </Routes>
    </Router>
  );
};

export default App;
