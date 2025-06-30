import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  Legend, ResponsiveContainer
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import "./CryptoPredictionChart.css";
import { format, setMinutes, setSeconds, addMinutes, subHours } from 'date-fns';
import SentimentAnalysis from "./SentimentAnalysis";

// FIREBASE IMPORTS
import { db } from "./firebaseConfig";
import { collection, addDoc, query, where, orderBy, getDocs, limit } from "firebase/firestore";

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

const TIME_FORMAT = 'HH:mm';
const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
const PRICE_UPDATE_INTERVAL = 60 * 1000;
const PRICE_RANGE_INTERVAL = 1000;
const HOURS_TO_SHOW = 4;
const MINUTES_TO_PREDICT = 30;

const CryptoPredictionChart = () => {
  const [selectedCrypto, setSelectedCrypto] = useState(SUPPORTED_CRYPTOS[0]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chartData, setChartData] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextUpdate, setNextUpdate] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [livePrice, setLivePrice] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000, ticks: [] });
  const [historicalPrices, setHistoricalPrices] = useState([]);
  const [historicalPredictions, setHistoricalPredictions] = useState([]);

  const chartRef = useRef(null);
  const dataFetchingRef = useRef(null);
  const timeUpdateRef = useRef(null);
  const priceUpdateRef = useRef(null);

  const theme = {
    positive: "#22c55e",
    negative: "#ef4444",
    neutral: "#3b82f6",
    background: "#111827",
    text: "#f3f4f6",
    gradientStart: "rgba(34, 197, 94, 0.2)",
    gradientEnd: "rgba(239, 68, 68, 0.2)"
  };

  const calculatePriceRange = useCallback((prices) => {
    if (!prices.length) {
      return { min: 0, max: 100000, ticks: [] };
    }
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    const padding = range * 0.1;
    const min = Math.floor((minPrice - padding) / PRICE_RANGE_INTERVAL) * PRICE_RANGE_INTERVAL;
    const max = Math.ceil((maxPrice + padding) / PRICE_RANGE_INTERVAL) * PRICE_RANGE_INTERVAL;
    const ticks = [];
    for (let price = min; price <= max; price += PRICE_RANGE_INTERVAL) {
      ticks.push(price);
    }
    return { min, max, ticks };
  }, []);

  const getCurrentInterval = useCallback(() => {
    const now = new Date();
    now.setMinutes(Math.floor(now.getMinutes() / 15) * 15, 0, 0);
    return now;
  }, []);

  const getNextInterval = useCallback(() => {
    const currentInterval = getCurrentInterval();
    return new Date(currentInterval.getTime() + 15 * 60 * 1000);
  }, [getCurrentInterval]);

  // FETCH HISTORICAL PREDICTIONS FROM FIREBASE
  const fetchPredictionsFromDB = useCallback(async () => {
    try {
      // Get last 100 predictions for this crypto
      const q = query(
        collection(db, "predictions"),
        where("crypto_id", "==", selectedCrypto.id),
        orderBy("prediction_time", "desc"),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const pred = [];
      const prices = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        // For charting, both real and predicted
        pred.push({ timestamp: new Date(d.prediction_time).getTime(), value: d.predicted_price });
        prices.push({ timestamp: new Date(d.prediction_time).getTime(), value: d.real_time_price });
      });
      setHistoricalPredictions(pred);
      setHistoricalPrices(prices);
    } catch (err) {
      console.error("Error fetching historical predictions from DB:", err);
    }
  }, [selectedCrypto.id]);

  // Only fetch historical from DB on load/change
  useEffect(() => {
    fetchPredictionsFromDB();
  }, [fetchPredictionsFromDB, selectedCrypto]);

  const findHistoricalData = useCallback((timestamp) => {
    const time = new Date(timestamp);
    const roundedTime = new Date(time);
    roundedTime.setMinutes(Math.floor(time.getMinutes() / 15) * 15, 0, 0);

    const price = historicalPrices.find(p => {
      const pTime = new Date(p.timestamp);
      return pTime.getTime() === roundedTime.getTime();
    });

    const prediction = historicalPredictions.find(p => {
      const pTime = new Date(p.timestamp);
      return pTime.getTime() === roundedTime.getTime();
    });

    return { price, prediction };
  }, [historicalPrices, historicalPredictions]);

  const generatePredictionPoints = useCallback((predictionData, currentLivePrice) => {
    const now = new Date();
    const startTime = subHours(now, HOURS_TO_SHOW);
    const endTime = addMinutes(now, MINUTES_TO_PREDICT);
    const points = [];
    startTime.setMinutes(Math.floor(startTime.getMinutes() / 15) * 15, 0, 0);
    let currentTime = new Date(startTime);
    const currentInterval = getCurrentInterval();
    const nextInterval = getNextInterval();

    while (currentTime <= endTime) {
      const { price, prediction } = findHistoricalData(currentTime.getTime());
      const isCurrentInterval = currentTime >= currentInterval && currentTime < nextInterval;
      points.push({
        time: format(currentTime, TIME_FORMAT),
        timestamp: currentTime.getTime(),
        predicted: isCurrentInterval ? predictionData?.prediction_15m : 
                  prediction ? prediction.value : null,
        actual: currentTime <= now ? 
                (price ? price.value : 
                 isCurrentInterval ? currentLivePrice : null) : null
      });
      currentTime = addMinutes(currentTime, 15);
    }
    return points;
  }, [getCurrentInterval, getNextInterval, findHistoricalData]);

  const updatePriceRange = useCallback(() => {
    const allPrices = [
      ...historicalPrices.map(p => p.value),
      ...historicalPredictions.map(p => p.value),
      livePrice
    ].filter(Boolean);
    setPriceRange(calculatePriceRange(allPrices));
  }, [historicalPrices, historicalPredictions, livePrice, calculatePriceRange]);

  // Fetch live price for selected crypto
  const fetchLivePrice = useCallback(async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${selectedCrypto.id}&vs_currencies=usd`
      );
      if (!response.ok) throw new Error('Failed to fetch live price');
      const data = await response.json();
      const newPrice = data[selectedCrypto.id]?.usd;
      const now = getCurrentInterval();

      setLivePrice(newPrice);
      setHistoricalPrices(prev => {
        const exists = prev.find(p => p.timestamp === now.getTime());
        if (!exists) {
          return [...prev.filter(p => p.timestamp > subHours(now, HOURS_TO_SHOW).getTime()), 
                  { timestamp: now.getTime(), value: newPrice }];
        }
        return prev;
      });

      updatePriceRange();
      if (prediction) {
        const newChartData = generatePredictionPoints(prediction, newPrice);
        setChartData(newChartData);
      }
    } catch (error) {
      console.error("Error fetching live price:", error);
    }
  }, [getCurrentInterval, generatePredictionPoints, prediction, updatePriceRange, selectedCrypto, HOURS_TO_SHOW]);

  // --- STORE PREDICTION TO FIREBASE & FETCH ---
  const storePredictionToDB = useCallback(async (data, livePrice, nextUpdateVal) => {
    try {
      const predictionTime = new Date();
      await addDoc(collection(db, "predictions"), {
        crypto_id: selectedCrypto.id,
        symbol: selectedCrypto.symbol,
        name: selectedCrypto.name,
        sentiment_score: data.sentiment_score,
        prediction_time: predictionTime.toISOString(),
        predicted_for_time: format(nextUpdateVal, DATE_TIME_FORMAT),
        real_time_price: livePrice,
        predicted_price: data.prediction_15m,
      });
      // After storing, refresh local predictions from DB
      fetchPredictionsFromDB();
    } catch (dbErr) {
      console.error("Failed to save prediction to Firestore:", dbErr);
    }
  }, [selectedCrypto, fetchPredictionsFromDB]);

  // Fetch prediction data for selected crypto
  const fetchData = useCallback(async () => {
    const currentInterval = getCurrentInterval();
    if (lastFetchTime && currentInterval.getTime() === lastFetchTime.getTime()) {
      return;
    }

    try {
      setLoading(true);
      await fetchLivePrice();
      
      const response = await fetch(`http://localhost:5000/predict/${selectedCrypto.id}`);
      if (!response.ok) throw new Error('Failed to fetch prediction');
      const data = await response.json();
      setPrediction(data);

      setHistoricalPredictions(prev => {
        const exists = prev.find(p => p.timestamp === currentInterval.getTime());
        if (!exists) {
          return [...prev.filter(p => p.timestamp > subHours(currentInterval, HOURS_TO_SHOW).getTime()),
                  { timestamp: currentInterval.getTime(), value: data.prediction_15m }];
        }
        return prev;
      });

      const newChartData = generatePredictionPoints(data, livePrice);
      setChartData(newChartData);
      setLastFetchTime(currentInterval);
      setNextUpdate(getNextInterval());
      setError(null);

      // Store to Firestore
      await storePredictionToDB(
        data,
        livePrice,
        getNextInterval()
      );

    } catch (error) {
      console.error("Error fetching prediction:", error);
      setError("Failed to fetch prediction data");
    } finally {
      setLoading(false);
    }
  }, [getCurrentInterval, getNextInterval, generatePredictionPoints, lastFetchTime, fetchLivePrice, livePrice, selectedCrypto, HOURS_TO_SHOW, storePredictionToDB]);

  // Update time display and check for new interval
  useEffect(() => {
    const updateTimeDisplay = () => {
      const now = new Date();
      setCurrentTime(now);

      const currentInterval = getCurrentInterval();
      if (lastFetchTime && currentInterval.getTime() !== lastFetchTime.getTime()) {
        fetchData();
      }
    };

    timeUpdateRef.current = setInterval(updateTimeDisplay, 1000);
    return () => clearInterval(timeUpdateRef.current);
  }, [getCurrentInterval, lastFetchTime, fetchData]);

  // Fetch live price periodically
  useEffect(() => {
    fetchLivePrice();
    priceUpdateRef.current = setInterval(fetchLivePrice, PRICE_UPDATE_INTERVAL);

    return () => {
      if (priceUpdateRef.current) clearInterval(priceUpdateRef.current);
    };
  }, [fetchLivePrice]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
    return () => {
      if (dataFetchingRef.current) {
        clearTimeout(dataFetchingRef.current);
      }
    };
  }, [fetchData]);

  // Cleanup old data
  useEffect(() => {
    const cleanup = () => {
      const cutoffTime = subHours(new Date(), HOURS_TO_SHOW).getTime();
      setHistoricalPrices(prev => prev.filter(p => p.timestamp > cutoffTime));
      setHistoricalPredictions(prev => prev.filter(p => p.timestamp > cutoffTime));
    };

    const cleanupInterval = setInterval(cleanup, 15 * 60 * 1000);
    return () => clearInterval(cleanupInterval);
  }, []);

  // When switching cryptos, reset relevant state
  useEffect(() => {
    setChartData([]);
    setPrediction(null);
    setLoading(true);
    setError(null);
    setNextUpdate(null);
    setLastFetchTime(null);
    setLivePrice(null);
    setHistoricalPrices([]);
    setHistoricalPredictions([]);
    fetchPredictionsFromDB();
  }, [selectedCrypto, fetchPredictionsFromDB]);

  const renderPriceCard = useCallback(() => {
    if (!prediction || !livePrice) return null;

    const priceChange = ((prediction.prediction_15m - livePrice) / livePrice) * 100;
    const changeClass = priceChange >= 0 ? 'positive' : 'negative';

    return (
      <div className="price-card">
        <h3>{selectedCrypto.name} ({selectedCrypto.symbol})</h3>
        <p className="current-price">
          Live Price:
          <br />
          ${livePrice?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </p>
        <p className="price-value">
          Prediction until {format(nextUpdate || getNextInterval(), TIME_FORMAT)}:<br />
          ${prediction.prediction_15m?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
          <span className={`price-change ${changeClass}`}>
            ({priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%)
          </span>
        </p>
        <p className={`sentiment-value ${prediction.sentiment_score >= 0 ? 'positive' : 'negative'}`}>
          Sentiment: {prediction.sentiment_score?.toFixed(2)}
        </p>
      </div>
    );
  }, [prediction, livePrice, nextUpdate, getNextInterval, selectedCrypto]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="chart-container"
    >
      <div className="chart-header">
        <div className="crypto-info">
          <h2>{selectedCrypto.name} Price Prediction</h2>
          <div className="current-time">
            {format(currentTime, DATE_TIME_FORMAT)} UTC
          </div>
          {nextUpdate && (
            <div className="next-update">
              Next Prediction: {format(nextUpdate, TIME_FORMAT)} UTC
            </div>
          )}
        </div>
        <div className="crypto-switcher">
          <label htmlFor="crypto-select">Select Coin:</label>
          <select
            id="crypto-select"
            value={selectedCrypto.id}
            onChange={e => {
              const newCrypto = SUPPORTED_CRYPTOS.find(c => c.id === e.target.value);
              setSelectedCrypto(newCrypto);
            }}
          >
            {SUPPORTED_CRYPTOS.map(crypto => (
              <option key={crypto.id} value={crypto.id}>
                {crypto.name} ({crypto.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="error-container"
          >
            {error}
          </motion.div>
        ) : !loading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="price-cards">
              {renderPriceCard()}
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={chartData}
                  ref={chartRef}
                >
                  <defs>
                    <linearGradient id="predicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.positive} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={theme.positive} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="actual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.negative} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={theme.negative} stopOpacity={0}/>
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  
                  <XAxis
                    dataKey="time"
                    stroke={theme.text}
                    interval={0}
                    minTickGap={50}
                  />
                  
                  <YAxis
                    stroke={theme.text}
                    domain={[priceRange.min, priceRange.max]}
                    ticks={priceRange.ticks}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: theme.background,
                      borderColor: "#374151"
                    }}
                    labelStyle={{ color: theme.text }}
                    labelFormatter={(time) => `Time: ${time} UTC`}
                    formatter={(value, name) => [
                      `$${value?.toLocaleString()}`,
                      name
                    ]}
                  />
                  
                  <Legend />

                  <Line
                    type="stepAfter"
                    dataKey="predicted"
                    stroke={theme.positive}
                    strokeWidth={2}
                    dot={false}
                    name={`${selectedCrypto.symbol} Prediction`}
                    fill="url(#predicted)"
                    isAnimationActive={false}
                  />

                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke={theme.negative}
                    strokeWidth={2}
                    dot={false}
                    name={`${selectedCrypto.symbol} Live Price`}
                    fill="url(#actual)"
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Market Sentiment Analysis Card */}
            <div style={{ marginTop: 32 }}>
              <SentimentAnalysis
                score={prediction?.sentiment_score ?? null}
                symbol={selectedCrypto.symbol}
                cryptoName={selectedCrypto.name}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="loading-container"
          >
            <div className="loader"></div>
            Loading...
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CryptoPredictionChart;
