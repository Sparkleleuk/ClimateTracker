import { useEffect, useRef, useState } from 'react'

const STATE_ABBR = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR',
  California: 'CA', Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE',
  Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID',
  Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS',
  Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS',
  Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT',
  Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV',
  Wisconsin: 'WI', Wyoming: 'WY',
}

// [lat, lng, zoom] — state-level starting view before district GeoJSON loads
const STATE_CENTERS = {
  Alabama: [32.8, -86.8, 7], Alaska: [64.2, -153.0, 4], Arizona: [34.3, -111.1, 7],
  Arkansas: [34.8, -92.2, 7], California: [37.2, -119.4, 6], Colorado: [39.0, -105.5, 7],
  Connecticut: [41.6, -72.7, 9], Delaware: [39.0, -75.5, 9], Florida: [28.5, -81.8, 7],
  Georgia: [32.7, -83.4, 7], Hawaii: [20.3, -156.4, 7], Idaho: [44.4, -114.6, 7],
  Illinois: [40.0, -89.2, 7], Indiana: [39.9, -86.3, 7], Iowa: [42.0, -93.5, 7],
  Kansas: [38.5, -98.4, 7], Kentucky: [37.5, -85.3, 7], Louisiana: [31.0, -91.8, 7],
  Maine: [45.3, -69.2, 7], Maryland: [39.0, -76.8, 8], Massachusetts: [42.3, -71.8, 8],
  Michigan: [44.3, -85.4, 7], Minnesota: [46.4, -93.1, 7], Mississippi: [32.7, -89.7, 7],
  Missouri: [38.4, -92.5, 7], Montana: [47.0, -110.0, 7], Nebraska: [41.5, -99.9, 7],
  Nevada: [39.3, -116.6, 7], 'New Hampshire': [43.7, -71.6, 8], 'New Jersey': [40.1, -74.5, 8],
  'New Mexico': [34.5, -106.1, 7], 'New York': [42.9, -75.5, 7], 'North Carolina': [35.5, -79.4, 7],
  'North Dakota': [47.5, -100.5, 7], Ohio: [40.4, -82.8, 7], Oklahoma: [35.6, -96.9, 7],
  Oregon: [44.1, -120.5, 7], Pennsylvania: [40.9, -77.8, 7], 'Rhode Island': [41.7, -71.5, 10],
  'South Carolina': [33.9, -80.9, 7], 'South Dakota': [44.4, -100.2, 7], Tennessee: [35.9, -86.4, 7],
  Texas: [31.5, -99.3, 6], Utah: [39.3, -111.1, 7], Vermont: [44.0, -72.7, 8],
  Virginia: [37.8, -78.7, 7], Washington: [47.4, -120.5, 7], 'West Virginia': [38.9, -80.5, 8],
  Wisconsin: [44.6, -90.0, 7], Wyoming: [43.0, -107.6, 7],
}

function ensureLeafletCss() {
  if (document.getElementById('leaflet-css')) return
  const link = document.createElement('link')
  link.id = 'leaflet-css'
  link.rel = 'stylesheet'
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
  document.head.appendChild(link)
}

export default function DistrictMap({ candidate, onClose }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const [status, setStatus] = useState('loading') // loading | ok | error

  const abbr = STATE_ABBR[candidate.state] ?? ''
  const district = candidate.district ?? ''
  const districtKey = `${abbr}-${district}`
  const geoJsonUrl = `https://raw.githubusercontent.com/unitedstates/districts/gh-pages/cds/2012/${districtKey}/shape.geojson`

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      ensureLeafletCss()
      const L = (await import('leaflet')).default

      if (cancelled || !mapRef.current || mapInstance.current) return

      // Remove stale Leaflet container flag if the div was reused
      delete mapRef.current._leaflet_id

      const [lat, lng, zoom] = STATE_CENTERS[candidate.state] ?? [39.5, -98.35, 4]
      const map = L.map(mapRef.current, { zoomControl: true, center: [lat, lng], zoom })
      mapInstance.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      try {
        const res = await fetch(geoJsonUrl)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const geojson = await res.json()

        if (cancelled) return

        const layer = L.geoJSON(geojson, {
          style: {
            color: '#27ae60',
            weight: 2.5,
            fillColor: '#27ae60',
            fillOpacity: 0.12,
          },
        }).addTo(map)

        map.invalidateSize()
        map.fitBounds(layer.getBounds(), { padding: [24, 24] })
        setStatus('ok')
      } catch (err) {
        console.error('[DistrictMap] GeoJSON load failed:', err.message)
        if (!cancelled) setStatus('error')
      }
    }

    init()

    return () => {
      cancelled = true
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [geoJsonUrl])

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', borderRadius: 12,
          border: '1px solid var(--border-strong)',
          width: '100%', maxWidth: 720,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--border-mid)',
        }}>
          <div>
            <div style={{ color: 'var(--text-1)', fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700 }}>
              {candidate.name}
            </div>
            <div style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 12, marginTop: 2 }}>
              {districtKey} · {candidate.office}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 6,
              color: 'var(--text-dim)', cursor: 'pointer', fontSize: 18,
              padding: '2px 10px', lineHeight: 1.4,
            }}
          >
            ×
          </button>
        </div>

        {/* Map */}
        <div style={{ position: 'relative', height: 460 }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {status === 'loading' && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-card)', zIndex: 10,
              color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 13,
            }}>
              Loading district boundary…
            </div>
          )}

          {status === 'error' && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '6px 14px', zIndex: 10,
              color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 12,
            }}>
              District boundary unavailable — showing US overview
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px', borderTop: '1px solid var(--border-mid)',
          display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <div style={{ color: 'var(--text-dim)', fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
            County boundaries visible at closer zoom · Green shading = district area
          </div>
          {candidate.ballotpediaUrl && (
            <a
              href={candidate.ballotpediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)', fontSize: 11, fontFamily: "'DM Mono', monospace", textDecoration: 'none', marginLeft: 'auto' }}
            >
              Ballotpedia ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
