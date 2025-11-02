import { useState, useEffect, useCallback } from 'react'
import api from '@/utils/api'
import { useToast } from '@/stores/notificationStore'

export interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export interface LocationUpdateResponse {
  updated: boolean
  saved_to_history: boolean
  distance_moved: number
  time_since_last: number
  message: string
  latitude: number
  longitude: number
  timestamp: string
}

interface UseGeolocationOptions {
  enableTracking?: boolean
  updateInterval?: number // in milliseconds
  onLocationUpdate?: (location: LocationData) => void
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { enableTracking = false, updateInterval = 30000 } = options
  const toast = useToast()

  const [location, setLocation] = useState<LocationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported] = useState(
    typeof navigator !== 'undefined' && 'geolocation' in navigator
  )

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (!isSupported) {
      const msg = 'Geolocation is not supported by your browser'
      setError(msg)
      toast.error(msg)
      return null
    }

    setIsLoading(true)
    setError(null)

    return new Promise<LocationData | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords
          const locationData = {
            latitude,
            longitude,
            accuracy,
            timestamp: Date.now(),
          }

          try {
            // Send to backend
            const response = await api.post<LocationUpdateResponse>(
              '/users/location/',
              {
                latitude,
                longitude,
                accuracy,
              }
            )

            setLocation(locationData)
            setIsLoading(false)

            toast.success(response.data.message)
            resolve(locationData)
          } catch (err: any) {
            const errorMsg =
              err.response?.data?.detail || 'Failed to update location'
            setError(errorMsg)
            setIsLoading(false)
            toast.error(errorMsg)
            resolve(null)
          }
        },
        (err) => {
          let errorMsg = 'Failed to get location'

          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = 'Location permission denied'
              break
            case err.POSITION_UNAVAILABLE:
              errorMsg = 'Location information unavailable'
              break
            case err.TIMEOUT:
              errorMsg = 'Location request timeout'
              break
          }

          setError(errorMsg)
          setIsLoading(false)
          toast.error(errorMsg)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      )
    })
  }, [isSupported, toast])

  // Get location history
  const getLocationHistory = useCallback(
    async (fromDate?: string, toDate?: string) => {
      try {
        const response = await api.get('/users/location/history/', {
          params: {
            from_date: fromDate,
            to_date: toDate,
          },
        })
        return response.data
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.detail || 'Failed to fetch location history'
        setError(errorMsg)
        toast.error(errorMsg)
        return null
      }
    },
    [toast]
  )

  // Get location statistics
  const getLocationStats = useCallback(async (days: number = 30) => {
    try {
      const response = await api.get('/users/location/stats/', {
        params: { days },
      })
      return response.data
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail || 'Failed to fetch location stats'
      setError(errorMsg)
      toast.error(errorMsg)
      return null
    }
  }, [toast])

  // Get current location from server
  const getCurrentLocationFromServer = useCallback(async () => {
    try {
      const response = await api.get('/users/location/current/')
      return response.data
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail || 'Failed to fetch current location'
      setError(errorMsg)
      return null
    }
  }, [])

  // Watch location for continuous tracking
  useEffect(() => {
    if (!enableTracking || !isSupported) return

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const locationData = {
          latitude,
          longitude,
          accuracy,
          timestamp: Date.now(),
        }

        try {
          await api.post('/users/location/', {
            latitude,
            longitude,
            accuracy,
          })

          setLocation(locationData)
          options.onLocationUpdate?.(locationData)
        } catch (err) {
          console.error('Failed to update location:', err)
        }
      },
      (err) => {
        console.error('Geolocation error:', err)
      },
      {
        enableHighAccuracy: true,
        maximumAge: updateInterval,
        timeout: 10000,
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [enableTracking, isSupported, updateInterval, options])

  return {
    location,
    isLoading,
    error,
    isSupported,
    getCurrentLocation,
    getLocationHistory,
    getLocationStats,
    getCurrentLocationFromServer,
  }
}
