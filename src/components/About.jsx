import React from 'react';
import { motion } from 'framer-motion';
import './About.css';

const About = () => {
  const technologies = [
    { name: 'React.js', icon: '⚛️', description: 'Modern UI Development', details: 'Building responsive and interactive user interfaces' },
    { name: 'TensorFlow', icon: '🧠', description: 'AI/ML Engine', details: 'Powering advanced price prediction algorithms' },
    { name: 'Node.js', icon: '🟢', description: 'Backend Runtime', details: 'High-performance server-side operations' },
    { name: 'WebSocket', icon: '🔄', description: 'Real-time Data', details: 'Millisecond latency market updates' },
    { name: 'AWS', icon: '☁️', description: 'Cloud Platform', details: 'Scalable and reliable infrastructure' },
    { name: 'MongoDB', icon: '🍃', description: 'Database', details: 'Fast and flexible data storage' }
  ];

  const statistics = [
    { number: '99.9%', label: 'Uptime', icon: '⚡' },
    { number: '<50ms', label: 'Latency', icon: '⚡' },
    { number: '50M+', label: 'Predictions', icon: '📊' },
    { number: '100K+', label: 'Active Users', icon: '👥' }
  ];

  const features = [
    {
      title: 'Advanced Analytics',
      items: [
        'Real-time price tracking with millisecond updates',
        'Machine learning-powered price predictions',
        'Advanced technical analysis indicators',
        'Sentiment analysis from multiple sources'
      ]
    },
    {
      title: 'Trading Tools',
      items: [
        'Customizable trading dashboard',
        'Multiple timeframe analysis',
        'Risk management calculator',
        'Portfolio tracking and analysis'
      ]
    },
    {
      title: 'Security & Reliability',
      items: [
        'Enterprise-grade security measures',
        'Multi-factor authentication',
        'Encrypted data transmission',
        'Automated backup systems'
      ]
    }
  ];

  const missionStatement = {
    title: "Empowering Crypto Traders Worldwide",
    description: "CryptoPredict is revolutionizing cryptocurrency trading through advanced artificial intelligence and real-time market analysis. Our mission is to democratize access to professional-grade trading tools and insights, enabling traders of all levels to make informed decisions in the dynamic crypto market.",
    highlights: [
      "Delivering institutional-grade trading tools to retail investors",
      "Advancing market transparency through AI-driven insights",
      "Building a more inclusive and educated trading community",
      "Setting new standards for cryptocurrency market analysis"
    ]
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="about-wrapper">
    <div className="about-container">
      <motion.div 
        className="about-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="hero-content">
          <h1>About CryptoPredict</h1>
          <p className="hero-subtitle">Next-Generation Cryptocurrency Analytics Platform</p>
        
        </div>
      </motion.div>

      <motion.div 
        className="about-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.section className="mission-section" variants={itemVariants}>
          <h2>{missionStatement.title}</h2>
          <p className="mission-description">{missionStatement.description}</p>
          <div className="mission-highlights">
            {missionStatement.highlights.map((highlight, index) => (
              <motion.div 
                key={index}
                className="highlight-item"
                whileHover={{ x: 10, color: '#22c55e' }}
              >
                <span className="highlight-icon">✦</span>
                {highlight}
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section className="technology-section" variants={itemVariants}>
          <h2>Technology Stack</h2>
          <div className="tech-grid">
            {technologies.map((tech, index) => (
              <motion.div 
                key={tech.name}
                className="tech-card"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 8px 30px rgba(34, 197, 94, 0.2)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="tech-header">
                  <span className="tech-icon">{tech.icon}</span>
                  <h3>{tech.name}</h3>
                </div>
                <p className="tech-description">{tech.description}</p>
                <p className="tech-details">{tech.details}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section className="features-section" variants={itemVariants}>
          <h2>Platform Features</h2>
          <div className="features-grid">
            {features.map((category, index) => (
              <motion.div 
                key={index}
                className="feature-category"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <h3>{category.title}</h3>
                <ul>
                  {category.items.map((item, i) => (
                    <motion.li 
                      key={i}
                      whileHover={{ x: 10 }}
                    >
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section className="contact-section" variants={itemVariants}>
          <h2>Connect With Us</h2>
          <div className="contact-grid">
            <motion.a 
              href="https://github.com/toshankanwar"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card github"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="fab fa-github"></i>
              <span>GitHub Repository</span>
              <p>Explore our open-source code</p>
            </motion.a>
            <motion.a 
              href="mailto:contact@cryptopredict.com"
              className="contact-card email"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="fas fa-envelope"></i>
              <span>Email Support</span>
              <p>Get in touch with our team</p>
            </motion.a>
            <motion.div 
              className="contact-card documentation"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="fas fa-book"></i>
              <span>Documentation</span>
              <p>Read our comprehensive guides</p>
            </motion.div>
          </div>
          
        </motion.section>
      </motion.div>
    </div>
    </div>
  );
};

export default About;