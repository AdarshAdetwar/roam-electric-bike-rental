import { useCallback, useState } from 'react';

function getErrorMessage(error) {
  return error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Something went wrong.';
}

export function useApi(request) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await request(...args);
      setData(result);
      return result;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [request]);

  return { data, loading, error, success, setSuccess, execute };
}
