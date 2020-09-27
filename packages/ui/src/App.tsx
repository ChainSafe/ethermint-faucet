import React, { useEffect, useState } from "react";
import AragonChainLogo from "./aragon-chain-logo.svg";
import "./App.css";
import web3 from "web3";
import { CircularProgress } from "@material-ui/core";

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

function App() {
  const [address, setAddress] = useState("");
  const [validAddress, setValidAddress] = useState(false);
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const isAddress = web3.utils.isAddress(address);
    setValidAddress(isAddress);
  }, [address]);

  const handleFaucetRequest = async () => {
    if (!address || !validAddress) return;

    setRequestInProgress(true);
    try {
      await sleep(2000);
      // const result = await api.requestFunds(address)
      setSuccess(true);
    } catch (error) {
      // The API should return a descriptive error here
      setError(error.message);
    }
    setRequestInProgress(false);
  };

  const resetState = () => {
    setAddress("");
    setSuccess(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img
          src={AragonChainLogo}
          className="App-logo"
          alt="Aragon Chain Logo"
        />
        <p>Skylark Testnet Faucet</p>
        {!requestInProgress ? (
          <div>
            <input
              className="Address-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address"
              disabled={requestInProgress || success}
            />
            <button
              onClick={handleFaucetRequest}
              className="Submit-button"
              disabled={!validAddress || requestInProgress || success}
            >
              Give me tokens
            </button>
          </div>
        ) : (
          <CircularProgress className="Progress-indicator" />
        )}
        {error && <p className="Error-message">{error}</p>}
        {success && (
          <>
            <p className="Success-message">
              Funds successfully sent to {address}
            </p>
            <button onClick={resetState}>Request for another address</button>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
