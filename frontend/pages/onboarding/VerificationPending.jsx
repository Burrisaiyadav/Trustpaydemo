import React from 'react';
import { motion } from 'framer-motion';
import { FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const VerificationPending = ({ status }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="onboarding-card verification-status"
    >
      <div className="status-icon">
        <FaClock className="pulse" />
      </div>
      <h2>Verification Under Review</h2>
      <p>Our admins are checking your platform proof. This usually takes 15-30 minutes.</p>
      
      <div className="status-timeline">
        <div className="timeline-item complete">
          <FaCheckCircle />
          <span>Profile Created</span>
        </div>
        <div className="timeline-item active">
          <div className="spinner-small" />
          <span>Reviewing Proof</span>
        </div>
        <div className="timeline-item pending">
          <div className="dot" />
          <span>Plan Activation</span>
        </div>
      </div>

      <button className="secondary-btn" onClick={() => window.location.reload()}>
        Refresh Status
      </button>
    </motion.div>
  );
};

export default VerificationPending;
