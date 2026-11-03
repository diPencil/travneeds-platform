'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  HotelData,
  HotelPolicyData,
  HotelRoomTypeData,
  HotelRatePlanData,
} from './types';

export interface HotelListItem extends HotelData {
  id: string;
  roomTypeCount: number;
  bookingCount: number;
}

export interface HotelsListResponse {
  items: HotelListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
}

export interface HotelDetailResponse {
  id: string;
  slug: string;
  name: string;
  nameAr?: string;
  description: string;
  propertyType: string;
  starRating?: number;
  countryCode: string;
  city: string;
  address: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  checkInTime: string;
  checkOutTime: string;
  coverImage?: string;
  gallery: string[];
  amenities: string[];
  seoTitle?: string;
  seoDescription?: string;
  translations?: Record<string, Record<string, string>>;
  status: string;
  bookingCount: number;
  policy: HotelPolicyData | null;
  roomTypes: (HotelRoomTypeData & {
    id: string;
    inventoryCount: number;
    bookingCount: number;
    ratePlans: (HotelRatePlanData & { id: string })[];
  })[];
}

export function useHotelsList(initialParams: {
  query?: string;
  status?: string;
  propertyType?: string;
  starRating?: number;
  city?: string;
  page?: number;
  limit?: number;
} = {}) {
  const [params, setParams] = useState(initialParams);
  const [data, setData] = useState<HotelsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (params.query) q.set('query', params.query);
      if (params.status && params.status !== 'all') q.set('status', params.status);
      if (params.propertyType && params.propertyType !== 'all') q.set('propertyType', params.propertyType);
      if (params.starRating) q.set('starRating', String(params.starRating));
      if (params.city) q.set('city', params.city);
      if (params.page) q.set('page', String(params.page));
      if (params.limit) q.set('limit', String(params.limit));

      const res = await fetch(`/api/admin/hotels?${q.toString()}`, { credentials: 'same-origin' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to load hotels list.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return {
    data,
    loading,
    error,
    params,
    setParams,
    refresh: fetchList,
  };
}

export function useHotelDetail(id: string | null) {
  const [hotel, setHotel] = useState<HotelDetailResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id || id === 'new') {
      setHotel(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/hotels/${encodeURIComponent(id)}`, { credentials: 'same-origin' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }
      const json = await res.json();
      setHotel(json.hotel);
    } catch (err: any) {
      setError(err.message || 'Failed to load hotel detail.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    hotel,
    loading,
    error,
    refresh: fetchDetail,
  };
}

export interface PublicHotelListItem {
  id: string;
  slug: string;
  name: string;
  nameAr?: string;
  description: string;
  propertyType: string;
  starRating?: number;
  countryCode: string;
  city: string;
  address: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  checkInTime: string;
  checkOutTime: string;
  coverImage?: string;
  gallery: string[];
  amenities: string[];
  seoTitle?: string;
  seoDescription?: string;
  startingPrice?: number;
  currency?: string;
  translations?: Record<string, Record<string, string>>;
}

export interface PublicHotelsResponse {
  items: PublicHotelListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  destinations: string[];
  propertyTypes: string[];
}

export function usePublicHotelsList(initialParams: {
  q?: string;
  city?: string;
  propertyType?: string;
  stars?: number;
  page?: number;
  limit?: number;
} = {}) {
  const [params, setParams] = useState(initialParams);
  const [data, setData] = useState<PublicHotelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (params.q) q.set('q', params.q);
      if (params.city && params.city !== 'all') q.set('city', params.city);
      if (params.propertyType && params.propertyType !== 'all') q.set('propertyType', params.propertyType);
      if (params.stars) q.set('stars', String(params.stars));
      if (params.page) q.set('page', String(params.page));
      if (params.limit) q.set('limit', String(params.limit));

      const res = await fetch(`/api/hotels?${q.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to load hotels.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return {
    data,
    loading,
    error,
    params,
    setParams,
    refresh: fetchList,
  };
}

export function usePublicHotelDetail(slug: string | null) {
  const [hotel, setHotel] = useState<HotelDetailResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!slug) {
      setHotel(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hotels/${encodeURIComponent(slug)}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }
      const json = await res.json();
      setHotel(json.hotel);
    } catch (err: any) {
      setError(err.message || 'Failed to load hotel detail.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    hotel,
    loading,
    error,
    refresh: fetchDetail,
  };
}

export interface StayAvailabilityQuote {
  hotelId: string;
  hotelSlug: string;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adults: number;
  children: number;
  roomsRequested: number;
  lowestStayPrice?: number;
  currency: string;
  roomTypes: {
    roomType: HotelRoomTypeData & { id: string; amenities: string[]; gallery: string[] };
    isEligibleForOccupancy: boolean;
    occupancyError?: string;
    isAvailable: boolean;
    plans: {
      ratePlan: HotelRatePlanData & { id: string };
      calculation: {
        checkInDate: string;
        checkOutDate: string;
        nights: number;
        roomTypeId: string;
        ratePlanId: string;
        roomTypeName: string;
        ratePlanName: string;
        boardBasis: string;
        nightlyBreakdown: { date: string; basePrice: number; finalPrice: number; currency: string }[];
        subtotal: number;
        averageNightlyRate: number;
        currency: string;
        isAvailable: boolean;
        unavailableReason?: string;
      };
      isEligibleForOccupancy: boolean;
      occupancyError?: string;
    }[];
  }[];
}

export function useHotelAvailability(
  slug: string,
  stayParams: {
    checkInDate: string;
    checkOutDate: string;
    adults: number;
    children: number;
    roomsRequested: number;
  },
) {
  const [quote, setQuote] = useState<StayAvailabilityQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!slug || !stayParams.checkInDate || !stayParams.checkOutDate) {
      setQuote(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        checkIn: stayParams.checkInDate,
        checkOut: stayParams.checkOutDate,
        adults: String(stayParams.adults),
        children: String(stayParams.children),
        rooms: String(stayParams.roomsRequested),
      });

      const res = await fetch(`/api/hotels/${encodeURIComponent(slug)}/availability?${q.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to check stay availability.');
      }
      const data = await res.json();
      setQuote(data);
    } catch (err: any) {
      setError(err.message || 'Availability check failed.');
    } finally {
      setLoading(false);
    }
  }, [slug, stayParams.checkInDate, stayParams.checkOutDate, stayParams.adults, stayParams.children, stayParams.roomsRequested]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  return { quote, loading, error, refresh: fetchQuote };
}

