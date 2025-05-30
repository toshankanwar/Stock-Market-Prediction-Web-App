import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000";
const COINGECKO_API = "https://api.coingecko.com/api/v3";

// Supported cryptocurrencies
export const SUPPORTED_CRYPTOS = [
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

export const fetchPrediction = async (cryptoId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/predict/${cryptoId}`);
    return response.data;
  } catch (error) {
    console.error(`🚨 Error fetching ${cryptoId} predictions:`, error);
    return null;
  }
};

export const fetchLivePrice = async (cryptoIds) => {
  try {
    const ids = cryptoIds.join(",");
    const response = await axios.get(
      `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd`
    );
    return Object.fromEntries(
      Object.entries(response.data).map(([key, value]) => [
        key,
        value.usd
      ])
    );
  } catch (error) {
    console.error("🚨 Error fetching live prices:", error);
    return {};
  }
};