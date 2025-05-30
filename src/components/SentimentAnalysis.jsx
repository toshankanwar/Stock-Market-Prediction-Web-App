import React from "react";
import { motion } from "framer-motion";

const SentimentAnalysis = ({ score, symbol }) => {
  const getSentimentColor = (score) => {
    if (score > 0.3) return "#22c55e";
    if (score < -0.3) return "#ef4444";
    return "#eab308";
  };

  const getSentimentText = (score) => {
    if (score > 0.3) return "Bullish";
    if (score < -0.3) return "Bearish";
    return "Neutral";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "1.5rem",
        backgroundColor: "#1f2937",
        borderRadius: "0.5rem",
        color: "#f3f4f6",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h3 style={{ marginBottom: "1rem" }}>{symbol} Market Sentiment</h3>
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <motion.div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            backgroundColor: getSentimentColor(score),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem",
            fontWeight: "bold",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            transition: { duration: 2, repeat: Infinity },
          }}
        >
          {(score * 100).toFixed(0)}%
        </motion.div>
        <div>
          <p style={{ fontSize: "1.5rem", margin: 0, color: getSentimentColor(score) }}>
            {getSentimentText(score)}
          </p>
          <p style={{ margin: "0.5rem 0 0 0", color: "#9ca3af" }}>
            Based on recent news and market analysis
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SentimentAnalysis;