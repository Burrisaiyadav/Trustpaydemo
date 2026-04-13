import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import '../Onboarding.css';

const PlatformVerification = ({ onComplete }) => {
  const [platform, setPlatform] = useState('Swiggy');
  const [workerId, setWorkerId] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !workerId) {
      setError('Please fill all fields and upload a screenshot');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('platform', platform);
      formData.append('workerID', workerId);
      formData.append('file', file);

      await api.submitProof(formData);
      onComplete();
    } catch (err) {
      setError('Failed to submit proof. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="onboarding-card platform-verify"
    >
      <h2>Platform Verification</h2>
      <p>Verify your gig worker status to unlock coverage</p>

      <form onSubmit={handleSubmit} className="verify-form">
        <div className="form-group">
          <label>Select Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="Swiggy">Swiggy</option>
            <option value="Zomato">Zomato</option>
            <option value="Zepto">Zepto</option>
          </select>
        </div>

        <div className="form-group">
          <label>Worker ID / Phone</label>
          <input 
            type="text" 
            placeholder="Enter your registered ID"
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Screenshot Proof</label>
          <div className="file-upload-zone">
            <input type="file" accept="image/*" onChange={handleFileChange} id="proof-file" />
            <label htmlFor="proof-file">
              {file ? file.name : 'Click to upload screenshot'}
            </label>
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Submitting...' : 'Submit for Verification'}
        </button>
      </form>
    </motion.div>
  );
};

export default PlatformVerification;
