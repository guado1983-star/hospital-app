import { useState, useEffect, useCallback } from 'react'

let _addToast = null

export function toast(message, type = 'success') {
  _addToast?.(message, type)
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const add = useCallback((message, type) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  useEffect(() => {
    _addToast = add
    return () => { _addToast = null }
  }, [add])

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
      ))}
    </div>
  )
}
