import { useEffect, useRef, useState } from 'react'

interface Ymaps3 {
  ready: Promise<void>
  YMap: new (el: HTMLElement, opts: object) => any
  YMapDefaultSchemeLayer: new (opts?: object) => any
  YMapDefaultFeaturesLayer: new (opts?: object) => any
  YMapMarker: new (props: object, element: HTMLElement) => any
  YMapFeature: new (props: object) => any
  YMapControls: new (opts?: object) => any
  YMapZoomControl: new (opts?: object) => any
}

declare global {
  interface Window {
    ymaps3?: Ymaps3
  }
}

export interface MapMarker {
  lat: number
  lon: number
  label?: string
  color?: string
  popup?: string
}

export interface MapPolyline {
  points: Array<{ lat: number; lon: number }>
  color?: string
}

export interface TripMapProps {
  center: [number, number]
  zoom?: number
  height?: number
  markers?: MapMarker[]
  polylines?: MapPolyline[]
}

function makePin(color: string, label?: string, popup?: string): HTMLElement {
  const wrap = document.createElement('div')
  wrap.style.cssText = 'position:relative;cursor:default'

  const pin = document.createElement('div')
  pin.style.cssText = [
    'width:28px;height:28px;border-radius:50% 50% 50% 0',
    'transform:rotate(-45deg)',
    `background:${color};border:2px solid #fff`,
    'box-shadow:0 2px 6px rgba(0,0,0,.35)',
    'display:flex;align-items:center;justify-content:center',
  ].join(';')

  const inner = document.createElement('span')
  inner.style.cssText = 'transform:rotate(45deg);color:#fff;font-size:10px;font-weight:700;line-height:1'
  inner.textContent = label ?? ''
  pin.appendChild(inner)
  wrap.appendChild(pin)

  if (popup) {
    const tip = document.createElement('div')
    tip.style.cssText = [
      'display:none;position:absolute;bottom:36px;left:50%',
      'transform:translateX(-50%);background:#1f2937;color:#fff',
      'font-size:11px;padding:4px 8px;border-radius:6px;white-space:nowrap',
      'box-shadow:0 2px 8px rgba(0,0,0,.3);z-index:10',
    ].join(';')
    tip.textContent = popup
    wrap.appendChild(tip)
    wrap.addEventListener('mouseenter', () => { tip.style.display = 'block' })
    wrap.addEventListener('mouseleave', () => { tip.style.display = 'none' })
  }
  return wrap
}

export function TripMap({
  center,
  zoom = 11,
  height = 320,
  markers = [],
  polylines = [],
}: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const overlaysRef = useRef<any[]>([])
  const [apiReady, setApiReady] = useState(false)
  const [mapInstance, setMapInstance] = useState<any>(null)

  useEffect(() => {
    window.ymaps3?.ready.then(() => setApiReady(true))
  }, [])

  useEffect(() => {
    if (!apiReady || !containerRef.current) return
    const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapControls, YMapZoomControl } = window.ymaps3!
    const map = new YMap(containerRef.current, {
      location: { center: [center[1], center[0]], zoom },
      mode: 'raster',
    })
    map.addChild(new YMapDefaultSchemeLayer({}))
    map.addChild(new YMapDefaultFeaturesLayer({}))
    const controls = new YMapControls({ position: 'right' })
    controls.addChild(new YMapZoomControl({}))
    map.addChild(controls)
    setMapInstance(map)
    return () => {
      setMapInstance(null)
      map.destroy()
    }
  }, [apiReady]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapInstance) return
    const ymaps3 = window.ymaps3!
    overlaysRef.current.forEach((c) => { try { mapInstance.removeChild(c) } catch { /* */ } })
    overlaysRef.current = []

    polylines.forEach((pl, i) => {
      const f = new ymaps3.YMapFeature({
        id: `pl-${i}`,
        geometry: { type: 'LineString', coordinates: pl.points.map((p) => [p.lon, p.lat]) },
        style: { stroke: [{ color: pl.color ?? '#2563eb', width: 4 }] },
      })
      mapInstance.addChild(f)
      overlaysRef.current.push(f)
    })

    markers.forEach((m, i) => {
      const el = makePin(m.color ?? '#2563eb', m.label, m.popup)
      const marker = new ymaps3.YMapMarker(
        { id: `m-${i}`, coordinates: [m.lon, m.lat], anchor: [0.5, 1] },
        el,
      )
      mapInstance.addChild(marker)
      overlaysRef.current.push(marker)
    })
  }, [mapInstance, markers, polylines])

  useEffect(() => {
    mapInstance?.setLocation({ center: [center[1], center[0]], zoom, duration: 300 })
  }, [mapInstance, center[0], center[1], zoom])

  if (!apiReady) {
    return (
      <div style={{ height }} className="rounded-xl bg-gray-100 flex items-center justify-center text-sm text-gray-400">
        Загрузка карты...
      </div>
    )
  }
  return <div ref={containerRef} style={{ height, width: '100%' }} className="rounded-xl overflow-hidden" />
}
