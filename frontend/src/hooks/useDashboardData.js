import { useEffect, useState } from 'react';
import { listServiceRequests } from '../utils/serviceRequestsApi';
import { listBikes } from '../utils/bikesApi';

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ bikes: [], serviceRequests: [] });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const [bikes, requests] = await Promise.all([
          listBikes().catch(()=>[]),
          listServiceRequests().catch(()=>[])
        ]);
        if (!cancelled) setData({ bikes, serviceRequests: requests });
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Derived metrics
  const totalCompleted = data.serviceRequests.filter(r => r.status === 'completed').length;
  const totalThisYear = data.serviceRequests.filter(r => {
    if (r.status !== 'completed') return false; const d = new Date(r.updatedAt || r.createdAt); return d.getFullYear() === new Date().getFullYear();
  }).length;
  return {
    loading,
    error,
    bikes: data.bikes,
    serviceRequests: data.serviceRequests,
    stats: {
      loyaltyPoints: 1250, // placeholder – real API TBD
      nextServiceKm: 153, // placeholder
      completedServices: totalCompleted,
      completedThisYear: totalThisYear
    }
  };
}
