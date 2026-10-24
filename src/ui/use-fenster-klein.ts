import { useEffect, useState } from 'react'

const SCHWELLE_BREITE = 1000
const SCHWELLE_HOEHE = 700

function ermittleKlein(): boolean {
  return window.innerWidth < SCHWELLE_BREITE || window.innerHeight < SCHWELLE_HOEHE
}

export function useFensterKlein(): boolean {
  const [klein, setKlein] = useState(ermittleKlein)

  useEffect(() => {
    function aufGroessenaenderung() {
      setKlein(ermittleKlein())
    }
    window.addEventListener('resize', aufGroessenaenderung)
    return () => window.removeEventListener('resize', aufGroessenaenderung)
  }, [])

  return klein
}
