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
  const geoJsonUrl = `https://raw.githubusercontent.com/unitedstates/districts/gh-pages/cds/2022/${districtKey}/shape.geojson`

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      ensureLeafletCss()
      const L = (await import('leaflet')).default

      if (cancelled || !mapRef.current || mapInstance.current) return

      // Remove stale Leaflet container flag if the div was reused
      delete mapRef.current._leaflet_id

      const map = L.map(mapRef.current, { zoomControl: true })
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

        map.fitBounds(layer.getBounds(), { padding: [24, 24] })
        setStatus('ok')
      } catch (err) {
        console.error('[DistrictMap] GeoJSON load failed:', err.message)
        if (!cancelled) {
          map.setView([39.5, -98.35], 4)
          setStatus('error')
        }
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
