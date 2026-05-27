import { useEffect } from 'react'

export function usePageTitle(title: string) {
  useEffect(() => {
    const prev = document.title
    document.title = title ? `${title} — AgroHub` : 'AgroHub Logistic'
    return () => { document.title = prev }
  }, [title])
}
