import React, { useEffect, useState } from "react";
import EthermintLogo from "./ethermint-logo.png";
import "./App.css";
import web3 from "web3";
import { CircularProgress } from "@material-ui/core";

function App() {
  const [address, setAddress] = useState("");
  const [validAddress, setValidAddress] = useState(false);
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [error, setError] = useState<string | false>(false);
  const [success, setSuccess] = useState<string | false>(false);

  useEffect(() => {
    const isAddress = web3.utils.isAddress(address);
    setValidAddress(isAddress);
  }, [address]);

  const handleFaucetRequest = async () => {
    const apiUrl = process.env.REACT_APP_API_URL;

    if (!address || !validAddress || !apiUrl) return;

    setSuccess(false);
    setError(false);
    setRequestInProgress(true);
    try {
      const response = await fetch(apiUrl, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        const responseBody = await response.json();
        console.log(responseBody);
        if (response.status === 429) {
          setError(responseBody);
        } else {
          setError(
            "There was an internal server error. Please try again later."
          );
        }
      } else {
        const responseBody = await response.json();
        console.log(responseBody);
        setSuccess("Yay");
      }
    } catch (error) {
      setError(error.message);
    }
    setRequestInProgress(false);
  };

  const resetState = () => {
    setAddress("");
    setSuccess(false);
    setError(false);
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
              disabled={requestInProgress || !!success}
            />
            <button
              onClick={handleFaucetRequest}
              className="Submit-button"
              disabled={!validAddress || requestInProgress || !!success}
            >
              Give me tokens
            </button>
          </div>
        ) : (
          <CircularProgress className="Progress-indicator" />
        )}
        {!!error && <p className="Error-message">{error}</p>}
        {!!success && (
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
