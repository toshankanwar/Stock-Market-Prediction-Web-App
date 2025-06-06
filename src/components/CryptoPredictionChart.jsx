import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  Legend, ResponsiveContainer
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import "./CryptoPredictionChart.css";
import { format, setMinutes, setSeconds, addMinutes, subHours } from 'date-fns';

const TIME_FORMAT = 'HH:mm';
const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
const PRICE_UPDATE_INTERVAL = 60 * 1000; // 1 minute in milliseconds
const PRICE_RANGE_INTERVAL = 1000; // $1,000 intervals
const PRICE_RANGE_PADDING = 5000; // $5,000 padding above and below
const HOURS_TO_SHOW = 4; // Past hours to show
const MINUTES_TO_PREDICT = 30; // Future minutes to show

const CryptoPredictionChart = () => {
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
        predicted: isCurrentInterval ? predictionData.prediction_15m : 
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

  const fetchLivePrice = useCallback(async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      if (!response.ok) throw new Error('Failed to fetch live price');
      const data = await response.json();
      const newPrice = data.bitcoin.usd;
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
  }, [getCurrentInterval, generatePredictionPoints, prediction, updatePriceRange]);

  const fetchData = useCallback(async () => {
    const currentInterval = getCurrentInterval();
    if (lastFetchTime && currentInterval.getTime() === lastFetchTime.getTime()) {
      return;
    }

    try {
      setLoading(true);
      
      await fetchLivePrice();
      
      const response = await fetch('https://smp-backend-btc.onrender.com/predict');
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
    } catch (error) {
      console.error("Error fetching prediction:", error);
      setError("Failed to fetch prediction data");
    } finally {
      setLoading(false);
    }
  }, [getCurrentInterval, getNextInterval, generatePredictionPoints, lastFetchTime, fetchLivePrice, livePrice]);

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

  const renderPriceCard = useCallback(() => {
    if (!prediction || !livePrice) return null;

    const priceChange = ((prediction.prediction_15m - livePrice) / livePrice) * 100;
    const changeClass = priceChange >= 0 ? 'positive' : 'negative';

    return (
      <div className="price-card">
        <h3>Bitcoin (BTC)</h3>
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
  }, [prediction, livePrice, nextUpdate, getNextInterval]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="chart-container"
    >
      <div className="chart-header">
        <div className="crypto-info">
          <h2>Bitcoin Price Prediction</h2>
          <div className="current-time">
            {format(currentTime, DATE_TIME_FORMAT)} UTC
          </div>
          {nextUpdate && (
            <div className="next-update">
              Next Prediction: {format(nextUpdate, TIME_FORMAT)} UTC
            </div>
          )}
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
                    name="BTC Prediction"
                    fill="url(#predicted)"
                    isAnimationActive={false}
                  />

                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke={theme.negative}
                    strokeWidth={2}
                    dot={false}
                    name="BTC Live Price"
                    fill="url(#actual)"
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
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
