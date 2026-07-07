'use client';
import { useState } from 'react';

interface MutationState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
  mutate: (payload: any) => Promise<T | null>;
}

export function useMutation<T>(mutator: (payload: any) => Promise<{ data: any }>): MutationState<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = async (payload: any): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await mutator(payload);
      const result = res.data?.data ?? res.data;
      setData(result);
      return result;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, data, mutate };
}
