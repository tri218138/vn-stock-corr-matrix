import { useState, useCallback, useRef, useEffect } from 'react'
import { useCorrelationData, filterCorrelation } from './useCorrelationData'
import Heatmap from './Heatmap'
import type { CorrelationData } from './types'
import './App.css'

export default function App() {
  const { data, loading, error } = useCorrelationData()
  const [query, setQuery] = useState('')
  const [filtered, setFiltered] = useState<CorrelationData | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const handleSearch = useCallback(() => {
    if (!data || !query.trim()) return
    const tickers = query
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)
    if (tickers.length < 2) return
    const result = filterCorrelation(data, tickers)
    if (result.tickers.length >= 2) {
      setFiltered(result)
      setShowSuggestions(false)
    }
  }, [data, query])

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (!data) return

      const parts = value.split(',')
      const currentToken = parts[parts.length - 1].trim().toUpperCase()

      if (currentToken.length > 0) {
        const alreadySelected = parts.slice(0, -1).map((p) => p.trim().toUpperCase())
        const matches = data.tickers
          .filter(
            (t) => t.startsWith(currentToken) && !alreadySelected.includes(t),
          )
          .slice(0, 8)
        setSuggestions(matches)
        setShowSuggestions(matches.length > 0)
      } else {
        setShowSuggestions(false)
      }
    },
    [data],
  )

  const handleSelectSuggestion = useCallback(
    (ticker: string) => {
      const parts = query.split(',')
      parts[parts.length - 1] = ` ${ticker}`
      const newQuery = parts.join(',') + ', '
      setQuery(newQuery)
      setShowSuggestions(false)
      inputRef.current?.focus()
    },
    [query],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSearch()
      }
    },
    [handleSearch],
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const invalidTickers =
    data && query.trim()
      ? query
          .split(',')
          .map((t) => t.trim().toUpperCase())
          .filter((t) => t && !data.tickers.includes(t))
      : []

  return (
    <div className={`app ${filtered ? 'has-results' : ''}`}>
      <div className="search-section">
        <h1 className="logo">
          <span className="logo-v">V</span>
          <span className="logo-n">N</span>
          <span className="logo-space"> </span>
          <span className="logo-s">S</span>
          <span className="logo-t">t</span>
          <span className="logo-o">o</span>
          <span className="logo-c">c</span>
          <span className="logo-k">k</span>
          <span className="logo-space"> </span>
          <span className="logo-co">C</span>
          <span className="logo-or">o</span>
          <span className="logo-rr">r</span>
          <span className="logo-r2">r</span>
        </h1>
        <p className="subtitle">Correlation matrix for Vietnam top 100 stocks</p>

        <div className="search-box-wrapper">
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#9aa0a6"
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true)
              }}
              placeholder="Nhập mã CK cách nhau bởi dấu phẩy, vd: HPG, FPT, VNM, MWG"
              spellCheck={false}
              autoComplete="off"
            />
            {query && (
              <button
                className="clear-btn"
                onClick={() => {
                  setQuery('')
                  setFiltered(null)
                  setSuggestions([])
                  inputRef.current?.focus()
                }}
                aria-label="Clear"
              >
                ×
              </button>
            )}
          </div>

          {showSuggestions && (
            <div className="suggestions" ref={suggestionsRef}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="suggestion-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectSuggestion(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {invalidTickers.length > 0 && filtered && (
          <p className="warning">
            Không tìm thấy: {invalidTickers.join(', ')}
          </p>
        )}

        <div className="actions">
          <button className="search-btn" onClick={handleSearch} disabled={loading}>
            {loading ? 'Đang tải dữ liệu...' : 'Xem Correlation'}
          </button>
          {filtered && (
            <button
              className="search-btn secondary"
              onClick={() => {
                if (!data) return
                setQuery(data.tickers.join(', '))
                setFiltered(data)
              }}
            >
              Xem tất cả ({data?.tickers.length} mã)
            </button>
          )}
        </div>

        {!filtered && data && (
          <div className="ticker-chips">
            <span className="chips-label">Tất cả mã:</span>
            <div className="chips">
              {data.tickers.map((t) => (
                <button
                  key={t}
                  className="chip"
                  onClick={() => {
                    const current = query
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                    if (!current.map((c) => c.toUpperCase()).includes(t)) {
                      const newQuery = [...current, t].join(', ')
                      setQuery(newQuery)
                    }
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <p className="error">Lỗi: {error}</p>}

      {filtered && filtered.tickers.length >= 2 && (
        <div className="results-section">
          <div className="results-header">
            <h2>
              Correlation Heatmap — {filtered.tickers.length} mã chứng khoán
            </h2>
            <p className="results-tickers">{filtered.tickers.join(' · ')}</p>
          </div>
          <Heatmap data={filtered} />
        </div>
      )}

      <footer className="footer">
        <span>Data: Vietnam top 100 stocks correlation matrix</span>
      </footer>
    </div>
  )
}
