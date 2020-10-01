import React, { useEffect, useState } from "react";
import EthermintLogo from "./ethermint-logo.png";
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
        <img src={EthermintLogo} className="App-logo" alt="Ethermint Logo" />
        <p>Ethermint Testnet Faucet</p>
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
            <button onClick={resetState} className="Request-more-button">
              Request for another address
            </button>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
