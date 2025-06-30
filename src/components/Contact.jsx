import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './Contact.css';

const Contact = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    success: false,
    message: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatUTCDateTime = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_key: 'YOUR-WEB3FORMS-API-KEY', // Replace with your Web3Forms API key
          ...formData
        })
      });

      const data = await response.json();

      if (data.success) {
        setFormStatus({
          submitted: true,
          success: true,
          message: 'Thank you for your message! We will get back to you soon.'
        });
        setFormData({ name: '', email: '', subject: '', message: '' });
      }
    } catch (error) {
      setFormStatus({
        submitted: true,
        success: false,
        message: 'Oops! Something went wrong. Please try again later.'
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      title: 'Email',
      value: 'contact@cryptopredict.com',
      icon: '📧',
      link: 'mailto:contact@cryptopredict.com'
    },
    {
      title: 'Location',
      value: 'IIIT Naya Raipur Chhattisgarh',
      icon: '📍',
      link: "https://maps.app.goo.gl/bgpvozj3eyEJACqq6"
    },
    {
      title: 'Working Hours',
      value: '24/7 Support',
      icon: '⏰',
      link: null
    }
  ];

  return (
    <div className="contact-wrapper">
      <div className="contact-container">
        <motion.div 
          className="contact-hero"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="hero-content">
            <h1>Get in Touch</h1>
            <p className="hero-subtitle">Have questions? We would love to hear from you.</p>
          </div>
        </motion.div>

        <div className="contact-content">
          <div className="contact-main">
            <motion.div 
              className="contact-form-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2>Send us a Message</h2>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your Name"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Your Email"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Subject"
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Your Message"
                    required
                    rows="6"
                  ></textarea>
                </div>
                <motion.button
                  type="submit"
                  className="submit-button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Send Message
                </motion.button>
              </form>
              {formStatus.submitted && (
                <motion.div 
                  className={`form-message ${formStatus.success ? 'success' : 'error'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {formStatus.message}
                </motion.div>
              )}
            </motion.div>

            <motion.div 
              className="contact-info-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {contactInfo.map((info, index) => (
                <motion.div 
                  key={info.title}
                  className="contact-info-card"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="info-icon">{info.icon}</span>
                  <h3>{info.title}</h3>
                  {info.link ? (
                    <a href={info.link}>{info.value}</a>
                  ) : (
                    <p>{info.value}</p>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;