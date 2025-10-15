// src/hooks/useApi.js
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { dependencies = [], immediate = true } = options;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(endpoint);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
};