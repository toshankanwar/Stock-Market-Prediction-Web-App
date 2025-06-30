import React, { useEffect, useState } from "react";
import { db } from "./firebaseConfig";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";

const SUPPORTED_CRYPTOS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "binancecoin", symbol: "BNB", name: "Binance Coin" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "ripple", symbol: "XRP", name: "Ripple" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  { id: "matic-network", symbol: "MATIC", name: "Polygon" },
];

// Pretty date/time helper
function prettyDT(isoStr) {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

export default function PredictionHistory() {
  const [selectedCrypto, setSelectedCrypto] = useState(SUPPORTED_CRYPTOS[0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "predictions"),
          where("crypto_id", "==", selectedCrypto.id),
          orderBy("prediction_time", "desc"),
          limit(100)
        );
        const querySnapshot = await getDocs(q);
        let result = [];
        querySnapshot.forEach((doc) => {
          result.push({ id: doc.id, ...doc.data() });
        });
        setRows(result);
      } catch (err) {
        setRows([]);
        console.error("[Firestore Query] Error fetching predictions:", err);
      }
      setLoading(false);
    };
    fetchPredictions();
  }, [selectedCrypto.id]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#0a174e,#133b5c 90%)",
      paddingTop: "90px",
      paddingBottom: "40px"
    }}>
      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        background: "rgba(20,40,90,0.98)",
        borderRadius: "18px",
        boxShadow: "0 6px 32px 2px rgba(0,0,0,0.13)",
        padding: "2.5rem 1.5rem 2rem 1.5rem",
        marginTop: "1.5rem"
      }}>
        <h2 style={{
          color: "#22c55e",
          letterSpacing: "0.01em",
          fontWeight: 700,
          fontSize: "2rem",
          marginBottom: "0.7rem"
        }}>
          Prediction History
          <span style={{
            color: "#60a5fa",
            fontWeight: 600,
            marginLeft: 12,
            fontSize: "1.05rem"
          }}>
            {selectedCrypto.name} ({selectedCrypto.symbol})
          </span>
        </h2>
        <div style={{
          margin: "1.5rem 0",
          display: "flex",
          alignItems: "center",
          gap: "1rem"
        }}>
          <label htmlFor="crypto-select" style={{
            color: "#e5e7eb",
            fontWeight: 500,
            fontSize: "1rem"
          }}>Select Coin:</label>
          <select
            id="crypto-select"
            value={selectedCrypto.id}
            onChange={e => {
              const newCrypto = SUPPORTED_CRYPTOS.find(c => c.id === e.target.value);
              setSelectedCrypto(newCrypto);
            }}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "7px",
              border: "1px solid #24335a",
              background: "#133b5c",
              color: "#fff",
              fontWeight: 600,
              fontSize: "1rem",
              minWidth: 180,
              outline: "none"
            }}
          >
            {SUPPORTED_CRYPTOS.map(crypto => (
              <option key={crypto.id} value={crypto.id}>
                {crypto.name} ({crypto.symbol})
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <div style={{
            color: "#60a5fa",
            fontWeight: 500,
            textAlign: "center",
            fontSize: "1.1rem",
            padding: "2rem 0"
          }}>Loading...</div>
        ) : (
          <div style={{
            overflowX: "auto",
            borderRadius: "12px",
            border: "1px solid #223259",
            background: "rgba(13,34,74,0.93)"
          }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "1.03rem",
              minWidth: "650px"
            }}>
              <thead>
                <tr style={{
                  background: "linear-gradient(90deg,#102756,#153a75 90%)",
                  color: "#60a5fa"
                }}>
                  <th style={{
                    padding: "12px 8px",
                    fontWeight: 700,
                    fontSize: "1.01rem",
                    borderBottom: "2px solid #1e2746"
                  }}>Prediction Time</th>
                  <th style={{
                    padding: "12px 8px",
                    fontWeight: 700,
                    fontSize: "1.01rem",
                    borderBottom: "2px solid #1e2746"
                  }}>Predicted For</th>
                  <th style={{
                    padding: "12px 8px",
                    fontWeight: 700,
                    fontSize: "1.01rem",
                    borderBottom: "2px solid #1e2746"
                  }}>Real Price</th>
                  <th style={{
                    padding: "12px 8px",
                    fontWeight: 700,
                    fontSize: "1.01rem",
                    borderBottom: "2px solid #1e2746"
                  }}>Predicted Price</th>
                  <th style={{
                    padding: "12px 8px",
                    fontWeight: 700,
                    fontSize: "1.01rem",
                    borderBottom: "2px solid #1e2746"
                  }}>Sentiment</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} style={{
                    borderBottom: "1px solid #1e2746",
                    background: "rgba(20,40,90,0.82)"
                  }}>
                    <td style={{
                      padding: 10,
                      textAlign: "center",
                      fontWeight: 500,
                      color: "#eab308", // golden yellow for time
                      background: "rgba(16,39,86,0.09)"
                    }}>{prettyDT(row.prediction_time)}</td>
                    <td style={{
                      padding: 10,
                      textAlign: "center",
                      fontWeight: 500,
                      color: "#38bdf8", // sky blue
                      background: "rgba(16,39,86,0.04)"
                    }}>{prettyDT(row.predicted_for_time)}</td>
                    <td style={{ padding: 10, textAlign: "center" }}>
                      {row.real_time_price !== undefined && row.real_time_price !== null ? (
                        <span style={{ color: "#60a5fa", fontWeight: 600 }}>
                          ${Number(row.real_time_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      ) : "-"}
                    </td>
                    <td style={{ padding: 10, textAlign: "center" }}>
                      {row.predicted_price !== undefined && row.predicted_price !== null ? (
                        <span style={{ color: "#22c55e", fontWeight: 600 }}>
                          ${Number(row.predicted_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      ) : "-"}
                    </td>
                    <td style={{ padding: 10, textAlign: "center", fontWeight: 700 }}>
                      <span style={{
                        color: row.sentiment_score > 0.3 ? "#22c55e" : row.sentiment_score < -0.3 ? "#ef4444" : "#eab308"
                      }}>
                        {row.sentiment_score !== undefined ? row.sentiment_score.toFixed(2) : "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div style={{
                color: "#eab308",
                marginTop: 16,
                textAlign: "center",
                padding: "1.1rem 0",
                fontWeight: 500
              }}>
                No data available for this coin yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}