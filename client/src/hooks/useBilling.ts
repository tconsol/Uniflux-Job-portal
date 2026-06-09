import { useQuery } from '@tanstack/react-query';
import { getPlans, getCurrentSubscription } from '../api/billing.api';
import { useAuth } from '../context/AuthContext';

export function usePlans() {
  return useQuery({ queryKey: ['plans'], queryFn: getPlans, staleTime: 300_000 });
}

export function useSubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['subscription', user?._id],
    queryFn: getCurrentSubscription,
    enabled: !!user,
    staleTime: 60_000,
  });
}
