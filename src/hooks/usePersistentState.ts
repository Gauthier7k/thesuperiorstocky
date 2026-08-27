import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

/** useState synced to localStorage (JSON), resilient to quota/parse failures. */
export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) return JSON.parse(raw) as T
    } catch {
      // fall through to initial
    }
    return initial
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // storage unavailable — state still works in-memory
    }
  }, [key, state])

  return [state, setState]
}
