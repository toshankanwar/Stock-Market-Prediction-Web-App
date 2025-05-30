import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="gradient-text"
          >
            CryptoPredict
          </motion.h3>
          <p>Real-time cryptocurrency predictions powered by AI</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <motion.div className="footer-links">
            {[
              { name: 'Home', path: '/' },
              { name: 'About', path: '/about' },
              { name: 'Contact', path: '/contact' }
            ].map((item, index) => (
              <motion.div key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `footer-link ${isActive ? 'active' : ''}`
                  }
                >
                  <motion.span
                    whileHover={{ 
                      scale: 1.05,
                      color: '#22c55e',
                      textShadow: "0 0 8px rgba(34, 197, 94, 0.5)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.name}
                  </motion.span>
                </NavLink>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="footer-section">
          <h4>Connect</h4>
          <div className="social-links">
            {[
              { name: 'GitHub', url: 'https://github.com/toshankanwar' },
              { name: 'LinkedIn', url: 'https://linkedin.com/in/toshankanwar' },
              { name: 'Twitter', url: 'https://twitter.com/toshankanwar' }
            ].map((social) => (
              <motion.a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ 
                  scale: 1.1,
                  color: '#22c55e'
                }}
                whileTap={{ scale: 0.95 }}
              >
                {social.name}
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      <motion.div 
        className="footer-bottom"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p>
          © {currentYear} CryptoPredict. All rights reserved.
        </p>
        <motion.a
          href="https://toshankanwar.website/"
          target="_blank"
          rel="noopener noreferrer"
          className="creator-link"
          whileHover={{ 
            scale: 1.05,
            color: '#22c55e',
            textShadow: "0 0 8px rgba(34, 197, 94, 0.5)"
          }}
          whileTap={{ scale: 0.95 }}
        >
          Designed & Developed with ❤️ by Toshan Kanwar
        </motion.a>
      </motion.div>
    </footer>
  );
};

export default Footer;