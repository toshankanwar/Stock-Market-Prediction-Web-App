import React from "react";
import CryptoPredictionChart from "./CryptoPredictionChart";
import { motion } from "framer-motion";
import "./CryptoDashboard.css";

const CryptoDashboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="dashboard-container"
    >
      <div className="dashboard-content">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="dashboard-title"
        >
          Crypto Prediction Dashboard
        </motion.h1>

        <motion.div 
          className="dashboard-grid"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="chart-section">
            <CryptoPredictionChart />
          </div>
          
        
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CryptoDashboard;