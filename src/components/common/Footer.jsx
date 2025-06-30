import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Footer.css';

const socialLinks = [
  {
    name: 'GitHub',
    url: 'https://github.com/cryptopredict',
    icon: (
      <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 .3C5.4.3 0 5.9 0 12.5c0 5.4 3.4 9.9 8.2 11.5.6.1.8-.3.8-.6v-2c-3.4.7-4.2-1.6-4.2-1.6-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1.9 1.6 2.3 1.1 2.8.8.1-.6.3-1.1.5-1.4-2.7-.3-5.5-1.4-5.5-6a4.8 4.8 0 0 1 1.3-3.4 4.3 4.3 0 0 1 .1-3.3s1-.3 3.4 1.2a11.4 11.4 0 0 1 6.3 0c2.4-1.5 3.4-1.2 3.4-1.2a4.3 4.3 0 0 1 .1 3.3 4.8 4.8 0 0 1 1.3 3.4c0 4.6-2.8 5.7-5.5 6 .3.2.5.6.5 1.3v2c0 .3.2.7.8.6C20.6 22.4 24 17.8 24 12.5 24 5.9 18.6.3 12 .3z"/>
      </svg>
    )
  }
];

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
  { name: 'History', path: '/history' }
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer pro-footer">
      <div className="footer-main-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="footer-logo-gradient">CryptoPredict</span>
          </div>
          <p className="footer-tagline">
            Real-time cryptocurrency predictions powered by <span className="footer-ai">AI</span>.
          </p>
        </div>

        <div className="footer-nav">
          <h4>Quick Links</h4>
          <nav>
            <ul className="footer-link-list">
              {navLinks.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `footer-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="footer-social">
          <h4>Connect</h4>
          <div className="footer-social-list">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`footer-social-icon-link footer-${social.name.toLowerCase()}`}
                aria-label={social.name}
              >
                {social.icon}
                <span className="footer-social-label">{social.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom-pro">
        <p>
          &copy; {currentYear} <span className="footer-logo-gradient">CryptoPredict</span> &mdash; All rights reserved.
        </p>
        <a
          href="https://toshankanwar.website/"
          target="_blank"
          rel="noopener noreferrer"
          className="creator-link-pro"
        >
          Designed & Developed with <span style={{ color: '#ef4444' }}>♥</span> by Crypto Predict 
        </a>
      </div>
    </footer>
  );
};

export default Footer;