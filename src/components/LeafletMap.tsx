import { useEffect, useRef } from 'react'
import L, { Map as LeafletMapInstance } from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface MapMarker {
  id: number
  latitude: number
  longitude: number
  name: string
  distance: number
  avatar?: string
}

interface LeafletMapProps {
  userLocation?: { lat: number; lng: number }
  learners: MapMarker[]
  onMarkerClick?: (learnerId: number) => void
  zoom?: number
}

// Fix for missing marker images in Leaflet (using data URIs for custom icons)

const UserIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iIzAwMCIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjE0IiBmaWxsPSIjZmZmIi8+PC9zdmc+',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
})

const LearnerIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cGF0aCBkPSJNMjAgMEM4IDAgMCA4IDAgMjBjMCA5IDEyIDIwIDIwIDIwczIwLTExIDIwLTIwYzAtMTItOC0yMC0yMC0yMHptMCAyM2MtMS42IDAtMy0xLjQtMy0zcy4xLTMgMy0zcjMgMS40IDMgMy0xLjQgMy0zIDN6Ii8+PC9zdmc+',
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40],
})

export function LeafletMap({
  userLocation,
  learners,
  onMarkerClick,
  zoom = 15,
}: LeafletMapProps) {
  const mapRef = useRef<LeafletMapInstance | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only initialize if we have a container and user location
    if (!mapContainerRef.current || !userLocation) {
      return
    }

    // Initialize map
    const map = L.map(mapContainerRef.current).setView(
      [userLocation.lat, userLocation.lng],
      zoom
    )

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Add user marker
    L.marker([userLocation.lat, userLocation.lng], { icon: UserIcon })
      .addTo(map)
      .bindPopup('<b>Your Location</b>')

    // Add learner markers
    learners.forEach((learner) => {
      const marker = L.marker([learner.latitude, learner.longitude], {
        icon: LearnerIcon,
      })
        .addTo(map)
        .bindPopup(
          `<div class="p-2">
            <b>${learner.name}</b><br/>
            Distance: ${learner.distance.toFixed(2)} km
          </div>`,
          { maxWidth: 200 }
        )

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(learner.id))
      }
    })

    // Auto-fit bounds to show all markers
    if (learners.length > 0) {
      const allPoints = [
        [userLocation.lat, userLocation.lng],
        ...learners.map((l) => [l.latitude, l.longitude]),
      ] as L.LatLngExpression[]

      const group = new L.FeatureGroup()
      allPoints.forEach((point) => {
        group.addLayer(L.marker(point as L.LatLngExpression))
      })
      map.fitBounds(group.getBounds(), { padding: [50, 50] })
    }

    mapRef.current = map

    // Cleanup
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [userLocation, learners, onMarkerClick, zoom])

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden border border-gray-200">
      <div
        ref={mapContainerRef}
        className="flex-1 bg-gray-100"
        style={{ minHeight: '400px' }}
      />
    </div>
  )
}
