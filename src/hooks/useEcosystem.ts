import { useState, useEffect } from 'react';
import odiApi, { type ODIEcosystem } from '@/lib/odiApi';

export function useEcosystem() {
  const [ecosystem, setEcosystem] = useState<ODIEcosystem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    odiApi.getEcosystem()
      .then(data => { setEcosystem(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  return { ecosystem, loading, error };
}
