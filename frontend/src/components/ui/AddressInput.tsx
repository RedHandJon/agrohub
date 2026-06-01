import { useState, useEffect, useRef } from 'react'
import { Loader2, MapPin } from 'lucide-react'

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export async function searchNominatim(query: string): Promise<NominatimResult[]> {
  const resp = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=0`,
    { headers: { 'Accept-Language': 'ru' } }
  )
  return resp.json()
}

export interface AddressInputProps {
  value: string
  onChange: (address: string, coords?: { lat: number; lon: number }) => void
  placeholder?: string
  required?: boolean
  inputClassName?: string
}

export function AddressInput({
  value,
  onChange,
  placeholder,
  required,
  inputClassName,
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const handleChange = (val: string) => {
    onChange(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (val.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await searchNominatim(val)
        setSuggestions(results)
        setOpen(results.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  const handleSelect = (item: NominatimResult) => {
    onChange(item.display_name, {
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    })
    setSuggestions([])
    setOpen(false)
  }

  const cls =
    inputClassName ??
    'w-full rounded-md border border-gray-300 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className={cls}
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg text-sm max-h-60 overflow-y-auto">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              onMouseDown={() => handleSelect(s)}
              className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-brand-50 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-brand-500 shrink-0 mt-0.5" />
              <span className="leading-snug">{s.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
