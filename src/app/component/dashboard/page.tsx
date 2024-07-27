import React, { useState, useEffect } from 'react';
import { PieChart } from "@mui/x-charts/PieChart";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import { FaTachometerAlt, FaEyeSlash, FaEye } from 'react-icons/fa';
import { getSolBalance, getSolPriceInUSD, getTokenAccounts, getStakeAccounts } from '../web3/portfolio';
import { SimplifiedTransactionDetail, useFetchTransactions } from '../web3/fetchTransaction';

// const SOLANA_MAINNET = process.env.REACT_APP_SOLANA_MAINNET || 'https://mainnet.helius-rpc.com/?api-key=4c4a4f43-145d-4406-b89c-36ad977bb738';
const RPC_ENDPOINTS = [
  process.env.REACT_APP_SOLANA_RPC_ENDPOINT,
  'https://mainnet.helius-rpc.com/?api-key=4c4a4f43-145d-4406-b89c-36ad977bb738',
  clusterApiUrl('mainnet-beta'),
];

interface TokenAccount {
  address: string;
  balance: number;
}

interface StakeAccount {
  address: string;
  balance: number;
}

const Dashboard: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);
  const [stakeAccounts, setStakeAccounts] = useState<StakeAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState<boolean>(false);
  const [transactions, setTransactions] = useState< SimplifiedTransactionDetail[]>([]);

  const fetchTransactions = useFetchTransactions();

  const tryRPCEndpoints = async (fetchFunction: (connection: Connection) => Promise<any>) => {
    for (const endpoint of RPC_ENDPOINTS) {
      if (endpoint) {
        try {
          const tempConnection = new Connection(endpoint);
          const result = await fetchFunction(tempConnection);
          return result;
        } catch (error) {
          console.error(`Error with endpoint ${endpoint}:`, error);
        }
      }
    }
    throw new Error("All RPC endpoints failed");
  };

  const toggleBalance = () => {
    setShowBalance((prevShowBalance) => !prevShowBalance);
  };

  const data = [
    { id: 0, value: 10, color: "#8cff05", label: "series A" },
    { id: 1, value: 15, color: "#4e9002", label: "series B" },
    { id: 2, value: 20, color: "#1f3a00", label: "series C" },
  ];

  const obfuscateValue = (value: string): string => "*".repeat(value.length);

  useEffect(() => {
    if (connected && publicKey) {
      fetchAllData();
    } else {
      resetState();
    }
  }, [connected, publicKey]);

  const resetState = () => {
    setSolBalance(null);
    setSolPrice(null);
    setTokenAccounts([]);
    setStakeAccounts([]);
    setTransactions([]);
    setError(null);
    setLoading(false);
  };

  const fetchAllData = async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const [balance, price, tokenData, stakeData] = await Promise.all([
        tryRPCEndpoints((conn) => getSolBalance(publicKey, conn)),
        getSolPriceInUSD(),
        tryRPCEndpoints((conn) => getTokenAccounts(publicKey, conn)),
        tryRPCEndpoints((conn) => getStakeAccounts(publicKey, conn)),
      ]);

      setSolBalance(balance);
      setSolPrice(price);
      setTokenAccounts(tokenData);
      setStakeAccounts(stakeData);

      const txData = await tryRPCEndpoints((conn) => fetchTransactions(conn));
      setTransactions(txData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error fetching data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      fetchAllData();
    } else {
      resetState();
    }
  }, [connected, publicKey]);

  if (!connected) {
    return <h1>Please connect your wallet</h1>;
  }

  return (
    <div className="project">
      <section className="section">
        <section className="titletext">
          <h1>Dashboard</h1>
          <span>
            <FaTachometerAlt />
          </span>
        </section>
        <div className="pcontainer">
          <div className="projectcard">
            <p className="titletxt">Net Worth:</p>
            <button onClick={toggleBalance} className="toggle-btn">
              {showBalance ? <FaEyeSlash /> : <FaEye />}{" "}
              {showBalance ? "Hide Balance" : "View Balance"}
            </button>
            {solBalance !== null && solPrice !== null && (
              <div className="balance">
                <div className="balance-card">
                  <h1>
                    $
                    {showBalance && solBalance !== null
                      ? (solBalance * solPrice).toFixed(2)
                      : obfuscateValue("1000")}
                  </h1>
                  <p>
                    <span>
                      {showBalance && solPrice !== null
                        ? solBalance.toFixed(2)
                        : obfuscateValue("0.82456098")}
                    </span>{" "}
                    SOL
                  </p>
                </div>
                <div className="balance-card">
                  <h1>
                    {showBalance ? tokenAccounts.length : obfuscateValue("10")} NFTs
                  </h1>
                </div>
                <div className="balance-card">
                  <h1>
                    {showBalance ? stakeAccounts.length : obfuscateValue("10")} Stakes
                  </h1>
                </div>
              </div>
            )}
            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}
            <div>
              <button className="con-btn2">
                {connected ? "Connected" : "Connect Wallet"}
              </button>
              <p className="titletxt">Wallet Address</p>
              <div className="balance2">
                {publicKey && <p>{publicKey.toBase58()}</p>}
              </div>
              <div className="profile-pic-frame">
                <img src="https://via.placeholder.com/100" alt="Profile" />
              </div>
            </div>
          </div>
          <div className="projectcard">
            <p className="titletxt">
              Transactions <span></span>
            </p>
            {loading ? (
              <p>Loading transactions...</p>
            ) : error ? (
              <p>Error: {error}</p>
            ) : (
              <ul className="transaction-list">
                {transactions.map((tx) => (
                  <li key={tx.signature} className="transaction-item">
                    <span>{tx.message}</span>
                    <span>{tx.status}</span>
                    <a
                      href={`https://explorer.solana.com/tx/${tx.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {tx.signature.slice(0, 8)}...
                    </a>
                    <span>{tx.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="projectcard">
            <div className="charts">
              <PieChart
                series={[
                  {
                    data,
                    highlightScope: {
                      faded: "global",
                      highlighted: "item",
                    },
                    faded: {
                      innerRadius: 30,
                      additionalRadius: -30,
                      color: "gray",
                    },
                  },
                ]}
                slotProps={{
                  legend: {
                    labelStyle: {
                      fontSize: 14,
                      fill: "#8cff05",
                    },
                  },
                }}
                height={200}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
