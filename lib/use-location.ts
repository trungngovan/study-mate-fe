import { useState, useCallback } from 'react';
import { apiClient } from './api-client';
import type { LocationUpdate } from '@/types/api';

export interface UseLocationResult {
    location: LocationUpdate | null;
    loading: boolean;
    error: string | null;
    updateLocation: (forceRefresh?: boolean) => Promise<LocationUpdate | null>;
}

const LOCATION_FRESHNESS_MINUTES = 15; // Location is considered fresh if < 15 minutes old

/**
 * Custom hook to manage user location
 * - Fetches cached location from API first
 * - Only requests new location if cached is stale (> 15 minutes) or doesn't exist
 * - Can force refresh location when needed
 */
export function useLocation(): UseLocationResult {
    const [location, setLocation] = useState<LocationUpdate | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Check if a location timestamp is still fresh (< 15 minutes old)
     */
    const isLocationFresh = (lastUpdated: string): boolean => {
        const lastUpdateTime = new Date(lastUpdated).getTime();
        const now = Date.now();
        const diffMinutes = (now - lastUpdateTime) / (1000 * 60);
        return diffMinutes < LOCATION_FRESHNESS_MINUTES;
    };

    /**
     * Request new location from browser
     */
    const requestBrowserLocation = useCallback(
        (): Promise<LocationUpdate | null> => {
            return new Promise((resolve) => {
                if (!navigator.geolocation) {
                    console.warn('Geolocation is not supported by this browser');
                    setError('Geolocation is not supported by this browser');
                    resolve(null);
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            const locationData: LocationUpdate = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy,
                            };

                            // Update location on server
                            await apiClient.updateLocation(locationData);

                            setLocation(locationData);
                            setError(null);
                            resolve(locationData);
                        } catch (err) {
                            console.error('Failed to update location on server:', err);
                            setError('Failed to update location on server');
                            resolve(null);
                        }
                    },
                    (err) => {
                        console.error('Browser location error:', err);
                        let errorMessage = 'Failed to get location';

                        switch (err.code) {
                            case err.PERMISSION_DENIED:
                                errorMessage = 'Location permission denied';
                                break;
                            case err.POSITION_UNAVAILABLE:
                                errorMessage = 'Location unavailable';
                                break;
                            case err.TIMEOUT:
                                errorMessage = 'Location request timed out';
                                break;
                        }

                        setError(errorMessage);
                        resolve(null);
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 10000,
                        maximumAge: 0,
                    }
                );
            });
        },
        []
    );

    /**
     * Update location
     * @param forceRefresh - If true, always request new location from browser
     */
    const updateLocation = useCallback(
        async (forceRefresh: boolean = false): Promise<LocationUpdate | null> => {
            setLoading(true);
            setError(null);

            try {
                // If forcing refresh, skip cache and get new location
                if (forceRefresh) {
                    console.log('Force refreshing location from browser...');
                    const newLocation = await requestBrowserLocation();
                    return newLocation;
                }

                // Try to get cached location from API
                try {
                    const currentLocation = await apiClient.getCurrentLocation();

                    if (currentLocation && currentLocation.last_updated) {
                        // Check if cached location is still fresh
                        if (isLocationFresh(currentLocation.last_updated)) {
                            console.log('Using cached location (fresh, < 15 minutes old)');
                            const locationData: LocationUpdate = {
                                latitude: currentLocation.latitude,
                                longitude: currentLocation.longitude,
                                last_updated: currentLocation.last_updated,
                            };
                            setLocation(locationData);
                            return locationData;
                        } else {
                            console.log('Cached location is stale (> 15 minutes old), requesting new location...');
                        }
                    } else {
                        console.log('No cached location found, requesting new location...');
                    }
                } catch (err) {
                    console.log('Failed to fetch cached location, requesting new location...', err);
                    // Continue to request new location
                }

                // If we reach here, we need a fresh location
                const newLocation = await requestBrowserLocation();
                return newLocation;
            } catch (err) {
                console.error('Error updating location:', err);
                setError('Failed to update location');
                return null;
            } finally {
                setLoading(false);
            }
        },
        [requestBrowserLocation]
    );

    return {
        location,
        loading,
        error,
        updateLocation,
    };
}

