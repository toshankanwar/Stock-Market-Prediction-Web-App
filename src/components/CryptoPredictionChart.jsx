import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  Legend, ResponsiveContainer, ReferenceArea, Label
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { SUPPORTED_CRYPTOS, fetchPrediction, fetchLivePrice } from "../api/cryptoService";
import "./CryptoPredictionChart.css";
import { format, parseISO } from 'date-fns';

const TIME_FORMAT = 'HH:mm:ss';
const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

const CryptoPredictionChart = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCrypto, setSelectedCrypto] = useState(SUPPORTED_CRYPTOS[0]);
  const [chartData, setChartData] = useState([]);
  const [livePrice, setLivePrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomState, setZoomState] = useState({
    xDomain: ['dataMin', 'dataMax'],
    yDomain: [0, 'auto'],
    scale: 1,
    dragging: false
  });
  const [priceRange, setPriceRange] = useState(null);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const chartRef = useRef(null);
  const dataFetchingRef = useRef(null);
  const timeUpdateRef = useRef(null);

  const cryptoPriceConfig = {
    bitcoin: {
      baseStep: 1000,
      format: { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    },
    ethereum: {
      baseStep: 50,
      format: { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    },
    binancecoin: {
      baseStep: 10,
      format: { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    },
    cardano: {
      baseStep: 0.01,
      format: { minimumFractionDigits: 4, maximumFractionDigits: 4 }
    }
  };

  const theme = {
    positive: "#22c55e",
    negative: "#ef4444",
    neutral: "#3b82f6",
    background: "#111827",
    text: "#f3f4f6",
    gradientStart: "rgba(34, 197, 94, 0.2)",
    gradientEnd: "rgba(239, 68, 68, 0.2)"
  };

  useEffect(() => {
    timeUpdateRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      if (timeUpdateRef.current) {
        clearInterval(timeUpdateRef.current);
      }
    };
  }, []);

  const calculatePriceRange = useCallback((price, cryptoId) => {
    if (!price || price <= 0) return null;

    const config = cryptoPriceConfig[cryptoId] || {
      baseStep: price * 0.01,
      format: { minimumFractionDigits: 2, maximumFractionDigits: 6 }
    };

    const magnitude = Math.floor(Math.log10(price));
    const baseStep = config.baseStep * Math.pow(10, Math.floor(magnitude / 3));

    return {
      min: Math.max(0, price * 0.5),
      max: price * 1.5,
      step: baseStep,
      format: config.format,
      ticks: Array.from(
        { length: 6 },
        (_, i) => Math.max(0, price * 0.5 + (i * (price * 0.2)))
      )
    };
  }, []);

  const resetChartData = useCallback(() => {
    setChartData([]);
    setLivePrice(null);
    setPriceRange(null);
    setZoomState({
      xDomain: ['dataMin', 'dataMax'],
      yDomain: [0, 'auto'],
      scale: 1,
      dragging: false
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [prediction, prices] = await Promise.all([
        fetchPrediction(selectedCrypto.id),
        fetchLivePrice([selectedCrypto.id])
      ]);

      if (!prediction || !prices[selectedCrypto.id]) {
        throw new Error("Failed to fetch prediction or price data");
      }

      const currentPrice = prices[selectedCrypto.id];
      const newRange = calculatePriceRange(currentPrice, selectedCrypto.id);

      if (!newRange) {
        throw new Error("Failed to calculate price range");
      }

      const newDataPoint = {
        time: format(currentTime, TIME_FORMAT),
        timestamp: currentTime.getTime(),
        predicted: prediction.prediction_15m,
        actual: currentPrice,
        sentiment: prediction.sentiment_score
      };

      setChartData(prev => {
        const oneDayAgo = currentTime.getTime() - (24 * 60 * 60 * 1000);
        const relevantData = prev
          .filter(point => point.timestamp > oneDayAgo)
          .filter(point => 
            point.actual > newRange.min && 
            point.actual < newRange.max
          );
        
        return [...relevantData.slice(-19), newDataPoint]
          .filter(Boolean)
          .sort((a, b) => a.timestamp - b.timestamp);
      });

      setLivePrice(currentPrice);
      setPriceRange(newRange);
      setError(null);

    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch latest data");
    } finally {
      setLoading(false);
    }
  }, [selectedCrypto, calculatePriceRange, currentTime]);

  useEffect(() => {
    setLoading(true);
    resetChartData();

    if (dataFetchingRef.current) {
      clearInterval(dataFetchingRef.current);
    }

    fetchData();
    dataFetchingRef.current = setInterval(fetchData, 15 * 60 * 1000);

    return () => {
      if (dataFetchingRef.current) {
        clearInterval(dataFetchingRef.current);
      }
    };
  }, [selectedCrypto, resetChartData, fetchData]);

  const priceTrend = useMemo(() => {
    if (chartData.length < 2) return 0;
    
    const latest = chartData[chartData.length - 1].predicted;
    const previous = chartData[chartData.length - 2].predicted;
    
    if (!latest || !previous || previous === 0) return 0;
    
    return ((latest - previous) / previous) * 100;
  }, [chartData]);

  const handleZoom = useCallback((e) => {
    if (!e || zoomState.dragging) return;

    const { xDomain, yDomain } = e;
    if (!xDomain || !yDomain) return;

    setZoomState(prev => ({
      ...prev,
      xDomain,
      yDomain,
      scale: prev.scale + 1
    }));
  }, [zoomState.dragging]);

  const handleZoomOut = useCallback(() => {
    setZoomState({
      xDomain: ['dataMin', 'dataMax'],
      yDomain: [0, 'auto'],
      scale: 1,
      dragging: false
    });
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (!e) return;
    setZoomState(prev => ({ ...prev, dragging: true }));
    setMouseCoords({ x: e.activeLabel, y: e.chartY });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!e || !zoomState.dragging) return;
    setMouseCoords({ x: e.activeLabel, y: e.chartY });
  }, [zoomState.dragging]);

  const handleMouseUp = useCallback(() => {
    setZoomState(prev => ({ ...prev, dragging: false }));
    if (mouseCoords.x) handleZoom();
  }, [mouseCoords.x, handleZoom]);

  const renderPriceCard = useCallback((title, value, type = "normal") => (
    <div className="price-card">
      <h3>{title}</h3>
      {type === "price" ? (
        <p className="price-value">
          ${value?.toLocaleString(undefined, priceRange?.format)}
        </p>
      ) : type === "trend" ? (
        <p className={`trend-value ${value >= 0 ? 'positive' : 'negative'}`}>
          {value.toFixed(2)}%
        </p>
      ) : (
        <p className="price-value">{value}</p>
      )}
    </div>
  ), [priceRange]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="chart-container"
    >
      <div className="chart-header">
        <div className="crypto-info">
          <h2>{selectedCrypto.name} Price Predictions</h2>
          <div className="current-time">
            {format(currentTime, DATE_TIME_FORMAT)} UTC
          </div>
        
        </div>
        <div className="crypto-selector">
          {SUPPORTED_CRYPTOS.map((crypto) => (
            <motion.button
              key={crypto.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`crypto-button ${crypto.id === selectedCrypto.id ? 'active' : ''}`}
              onClick={() => setSelectedCrypto(crypto)}
            >
              {crypto.symbol}
            </motion.button>
          ))}
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
              {renderPriceCard("Live Price", livePrice, "price")}
              {renderPriceCard("Trend", priceTrend, "trend")}
              <div className="price-card">
                <h3>Zoom Level</h3>
                <button 
                  className="zoom-button"
                  onClick={handleZoomOut}
                  disabled={zoomState.scale === 1}
                >
                  Reset Zoom
                </button>
              </div>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={chartData}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
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
                    domain={zoomState.xDomain}
                    tickFormatter={time => time}
                  />
                  
                  <YAxis
                    stroke={theme.text}
                    domain={priceRange ? [priceRange.min, priceRange.max] : [0, 'auto']}
                    tickFormatter={(value) => 
                      `$${value.toLocaleString(undefined, priceRange?.format)}`
                    }
                    ticks={priceRange?.ticks}
                  />
                  
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: theme.background,
                      borderColor: "#374151"
                    }}
                    labelStyle={{ color: theme.text }}
                    labelFormatter={(time) => `Time: ${time} UTC`}
                    formatter={(value, name) => [
                      `$${value.toLocaleString(undefined, priceRange?.format)}`,
                      name
                    ]}
                  />
                  
                  <Legend />

                  {zoomState.dragging && (
                    <ReferenceArea
                      x1={mouseCoords.x}
                      x2={mouseCoords.x}
                      strokeOpacity={0.3}
                      fill={theme.gradientStart}
                    />
                  )}

                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke={theme.positive}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Predicted Price"
                    fill="url(#predicted)"
                    isAnimationActive={false}
                  />
                  
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke={theme.negative}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Actual Price"
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