import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import type { CorrelationData } from './types'

export function useCorrelationData() {
  const [data, setData] = useState<CorrelationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    fetch(`${base}data/correlation_matrix.csv`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load correlation data')
        return res.text()
      })
      .then((csv) => {
        const parsed = Papa.parse<string[]>(csv, { header: false, skipEmptyLines: true })
        const rows = parsed.data
        const headerRow = rows[0]
        const tickers = headerRow.slice(1)

        const matrix: number[][] = []
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].slice(1).map(Number)
          matrix.push(row)
        }

        setData({ tickers, matrix })
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return { data, loading, error }
}

export function filterCorrelation(
  data: CorrelationData,
  selectedTickers: string[],
): CorrelationData {
  const upperSelected = selectedTickers.map((t) => t.trim().toUpperCase())
  const indices = upperSelected
    .map((t) => data.tickers.indexOf(t))
    .filter((i) => i !== -1)

  const tickers = indices.map((i) => data.tickers[i])
  const matrix = indices.map((i) => indices.map((j) => data.matrix[i][j]))

  return { tickers, matrix }
}
