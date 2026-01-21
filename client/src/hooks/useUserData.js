/**
 * Custom hooks con React Query para optimizar peticiones al backend
 * Elimina la necesidad de useEffect, useState y setInterval
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { walletAPI, benefitsAPI, pointsAPI, missionsAPI, adminAPI, merchantAPI } from '../services/api';

/**
 * Hook para obtener el balance y datos del usuario
 * staleTime: 5 minutos - Los datos del balance cambian con frecuencia
 */
export function useUserBalance() {
  return useQuery({
    queryKey: ['user', 'balance'],
    queryFn: async () => {
      const response = await walletAPI.getBalance();
      return response.data?.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  });
}

/**
 * Hook para obtener las transacciones recientes
 * staleTime: 2 minutos - Las transacciones son dinámicas
 */
export function useRecentTransactions(limit = 5) {
  return useQuery({
    queryKey: ['transactions', 'recent', limit],
    queryFn: async () => {
      const response = await pointsAPI.getTransactions(limit, 0);
      return response.data?.data || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 2,
  });
}

/**
 * Hook para obtener todas las transacciones (para historial completo)
 * DEPRECATED: Usar useInfiniteTransactions para paginación
 * staleTime: 2 minutos - Las transacciones son dinámicas
 */
export function useAllTransactions(limit = 100) {
  return useQuery({
    queryKey: ['transactions', 'all', limit],
    queryFn: async () => {
      const response = await pointsAPI.getTransactions(limit, 0);
      return response.data?.data || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 2,
  });
}

/**
 * Hook para paginación infinita de transacciones
 * Carga 20 transacciones por página, ideal para FlatList con onEndReached
 * staleTime: 2 minutos - Las transacciones son dinámicas
 */
export function useInfiniteTransactions(pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ['transactions', 'infinite', pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await pointsAPI.getTransactions(pageSize, pageParam);
      return {
        data: response.data?.data || [],
        nextOffset: pageParam + pageSize,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      // Si la última página tiene menos datos que pageSize, no hay más páginas
      if (lastPage.data.length < pageSize) {
        return undefined;
      }
      return lastPage.nextOffset;
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 2,
  });
}

/**
 * Hook para obtener misiones disponibles
 * staleTime: 10 minutos - Las misiones no cambian tan seguido
 */
export function useAvailableMissions(limit = null) {
  return useQuery({
    queryKey: ['missions', 'available', limit],
    queryFn: async () => {
      const response = await missionsAPI.getAvailable();
      const missions = response.data?.missions || response.data?.data || [];
      return limit ? missions.slice(0, limit) : missions;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: 2,
  });
}

/**
 * Hook para obtener detalles de una misión específica
 * staleTime: 5 minutos - Los detalles de una misión son estáticos
 */
export function useMissionDetails(missionId) {
  return useQuery({
    queryKey: ['missions', 'details', missionId],
    queryFn: async () => {
      const response = await missionsAPI.getMissionById(missionId);
      return response.data?.mission || response.data?.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!missionId, // Solo ejecutar si hay missionId
    retry: 2,
  });
}

/**
 * Hook para obtener beneficios disponibles
 * staleTime: 30 minutos - Los beneficios cambian poco frecuentemente
 */
export function useAvailableBenefits(limit = null) {
  return useQuery({
    queryKey: ['benefits', 'available', limit],
    queryFn: async () => {
      const response = await benefitsAPI.getAll();
      const benefits = response.data?.data || [];
      return limit ? benefits.slice(0, limit) : benefits;
    },
    staleTime: 1000 * 60 * 30, // 30 minutos - Los beneficios raramente cambian
    cacheTime: 1000 * 60 * 60, // 1 hora en caché
    retry: 2,
  });
}

/**
 * Hook para obtener una misión específica
 */
export function useMission(missionId) {
  return useQuery({
    queryKey: ['mission', missionId],
    queryFn: async () => {
      const response = await missionsAPI.getById(missionId);
      return response.data?.data;
    },
    enabled: !!missionId, // Solo ejecutar si hay ID
    staleTime: 1000 * 60 * 10,
    retry: 2,
  });
}

/**
 * Hook para obtener un beneficio específico
 */
export function useBenefit(benefitId) {
  return useQuery({
    queryKey: ['benefit', benefitId],
    queryFn: async () => {
      const response = await benefitsAPI.getById(benefitId);
      return response.data?.data;
    },
    enabled: !!benefitId,
    staleTime: 1000 * 60 * 30,
    retry: 2,
  });
}

/**
 * Hook para paginación infinita de usuarios (Admin)
 * Carga 20 usuarios por página
 * staleTime: 1 minuto - Los usuarios pueden cambiar con frecuencia
 */
export function useInfiniteUsers(role = null, status = null, pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ['admin', 'users', 'infinite', role, status, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await adminAPI.getUsers(role, status, pageSize, pageParam);
      return {
        data: response.data?.data?.users || [],
        total: response.data?.data?.total || 0,
        nextOffset: pageParam + pageSize,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length < pageSize) {
        return undefined;
      }
      return lastPage.nextOffset;
    },
    staleTime: 1000 * 60, // 1 minuto
    retry: 2,
  });
}

/**
 * Hook para paginación infinita de envíos de misiones (Admin)
 * Carga 20 envíos por página
 * staleTime: 30 segundos - Los envíos pendientes deben actualizarse frecuentemente
 */
export function useInfiniteSubmissions(status = 'PENDING', pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ['admin', 'submissions', 'infinite', status, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await adminAPI.getSubmissions(status, pageSize, pageParam);
      return {
        data: response.data?.data?.submissions || [],
        nextOffset: pageParam + pageSize,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length < pageSize) {
        return undefined;
      }
      return lastPage.nextOffset;
    },
    staleTime: 1000 * 30, // 30 segundos
    retry: 2,
  });
}

/**
 * Hook para paginación infinita de historial de comerciante
 * Carga 20 validaciones por página
 * staleTime: 2 minutos - El historial cambia con menos frecuencia
 */
export function useInfiniteMerchantHistory(pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ['merchant', 'history', 'infinite', pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await merchantAPI.getHistory(pageSize, pageParam);
      return {
        data: response.data?.data?.redemptions || [],
        nextOffset: pageParam + pageSize,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length < pageSize) {
        return undefined;
      }
      return lastPage.nextOffset;
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 2,
  });
}

/**
 * Hook para obtener comercios asociados (público)
 * staleTime: 1 hora - La lista de comercios no cambia frecuentemente
 */
export function useAssociates() {
  return useQuery({
    queryKey: ['associates', 'list'],
    queryFn: async () => {
      const response = await merchantAPI.getAssociates(); 
      return response.data?.data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    retry: (failureCount, error) => {
      // No reintentar si el endpoint no existe (404)
      if (error.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
}
