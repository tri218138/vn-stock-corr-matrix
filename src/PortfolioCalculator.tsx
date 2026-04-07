import { useState, useMemo, useCallback } from 'react'
import type { CorrelationData } from './types'

interface Props {
  data: CorrelationData
}

interface PortfolioResult {
  variance: number
  volatility: number
  weightedAvgCorr: number
  pairContributions: { i: string; j: string; corr: number; wi: number; wj: number; contribution: number }[]
}

function computePortfolio(
  tickers: string[],
  matrix: number[][],
  weights: number[],
): PortfolioResult | null {
  const n = tickers.length
  const sumW = weights.reduce((a, b) => a + b, 0)
  if (sumW === 0) return null

  const w = weights.map((v) => v / sumW)

  // Var_p = wᵀ · Corr · w
  let variance = 0
  const pairContributions: PortfolioResult['pairContributions'] = []

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const contribution = w[i] * matrix[i][j] * w[j]
      variance += contribution
      if (i < j) {
        pairContributions.push({
          i: tickers[i],
          j: tickers[j],
          corr: matrix[i][j],
          wi: w[i],
          wj: w[j],
          contribution: 2 * contribution,
        })
      }
    }
  }

  pairContributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))

  const sumWiSq = w.reduce((s, wi) => s + wi * wi, 0)
  const weightedAvgCorr = sumWiSq > 0 ? variance / sumWiSq : 0

  return {
    variance,
    volatility: Math.sqrt(Math.max(0, variance)),
    weightedAvgCorr,
    pairContributions,
  }
}

export default function PortfolioCalculator({ data }: Props) {
  const { tickers, matrix } = data
  const [weights, setWeights] = useState<number[]>(() => tickers.map(() => 0))
  const [expanded, setExpanded] = useState(false)

  const handleWeightChange = useCallback((idx: number, val: string) => {
    setWeights((prev) => {
      const next = [...prev]
      next[idx] = parseFloat(val) || 0
      return next
    })
  }, [])

  const handleEqualWeight = useCallback(() => {
    const eq = 100 / tickers.length
    setWeights(tickers.map(() => parseFloat(eq.toFixed(2))))
  }, [tickers])

  const handleClear = useCallback(() => {
    setWeights(tickers.map(() => 0))
  }, [tickers])

  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const result = useMemo(() => computePortfolio(tickers, matrix, weights), [tickers, matrix, weights])

  const normalizedWeights = useMemo(() => {
    if (totalWeight === 0) return weights
    return weights.map((w) => w / totalWeight)
  }, [weights, totalWeight])

  return (
    <div className="portfolio-calc">
      <h2 className="portfolio-title">Portfolio Risk Calculator</h2>
      <p className="portfolio-desc">
        Nhập tỷ trọng (%) cho mỗi mã, hệ thống sẽ tính <code>Var<sub>p</sub> = w<sup>T</sup> · Corr · w</code>
      </p>

      <div className="portfolio-actions">
        <button className="portfolio-btn" onClick={handleEqualWeight}>Equal Weight</button>
        <button className="portfolio-btn secondary" onClick={handleClear}>Reset</button>
      </div>

      <div className="weights-grid">
        {tickers.map((ticker, idx) => (
          <div key={ticker} className="weight-item">
            <label className="weight-label">{ticker}</label>
            <div className="weight-input-wrapper">
              <input
                type="number"
                className="weight-input"
                value={weights[idx] || ''}
                onChange={(e) => handleWeightChange(idx, e.target.value)}
                placeholder="0"
                min={0}
                step={1}
              />
              <span className="weight-unit">%</span>
            </div>
            {totalWeight > 0 && (
              <span className="weight-normalized">
                w = {normalizedWeights[idx].toFixed(4)}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="weight-total">
        <span>Total: <strong>{totalWeight.toFixed(2)}%</strong></span>
        {totalWeight > 0 && totalWeight !== 100 && (
          <span className="weight-note">(sẽ tự chuẩn hóa về tổng = 1)</span>
        )}
      </div>

      {result && totalWeight > 0 && (
        <div className="portfolio-results">
          <div className="formula-section">
            <h3>Công thức</h3>
            <div className="formula-box">
              <div className="formula-line">
                <span className="formula-label">w</span>
                <span className="formula-eq">=</span>
                <span className="formula-value">
                  [{normalizedWeights.map((w) => w.toFixed(4)).join(', ')}]
                </span>
              </div>
              <div className="formula-line main-formula">
                <span className="formula-label">Var<sub>p</sub></span>
                <span className="formula-eq">=</span>
                <span className="formula-value">
                  w<sup>T</sup> · Corr · w = <strong>{result.variance.toFixed(6)}</strong>
                </span>
              </div>
              <div className="formula-line">
                <span className="formula-label">σ<sub>p</sub></span>
                <span className="formula-eq">=</span>
                <span className="formula-value">
                  √Var<sub>p</sub> = <strong>{result.volatility.toFixed(6)}</strong>
                </span>
              </div>
              <div className="formula-line">
                <span className="formula-label">ρ<sub>avg</sub></span>
                <span className="formula-eq">=</span>
                <span className="formula-value">
                  Var<sub>p</sub> / Σw<sub>i</sub>² = <strong>{result.weightedAvgCorr.toFixed(4)}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="result-cards">
            <div className="result-card">
              <div className="result-card-value">{result.variance.toFixed(6)}</div>
              <div className="result-card-label">Portfolio Variance</div>
              <div className="result-card-note">Var<sub>p</sub> = w<sup>T</sup> · Corr · w</div>
            </div>
            <div className="result-card">
              <div className="result-card-value">{result.volatility.toFixed(6)}</div>
              <div className="result-card-label">Portfolio Volatility</div>
              <div className="result-card-note">σ<sub>p</sub> = √Var<sub>p</sub></div>
            </div>
            <div className={`result-card ${result.weightedAvgCorr > 0.5 ? 'high' : result.weightedAvgCorr < 0.3 ? 'low' : 'mid'}`}>
              <div className="result-card-value">{result.weightedAvgCorr.toFixed(4)}</div>
              <div className="result-card-label">Weighted Avg Corr</div>
              <div className="result-card-note">
                {result.weightedAvgCorr > 0.5
                  ? 'Tập trung cao — ít đa dạng hóa'
                  : result.weightedAvgCorr < 0.3
                    ? 'Đa dạng hóa tốt'
                    : 'Mức trung bình'}
              </div>
            </div>
          </div>

          {result.pairContributions.length > 0 && (
            <div className="pair-breakdown">
              <button
                className="pair-toggle"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? '▾' : '▸'} Chi tiết đóng góp từng cặp ({result.pairContributions.length} cặp)
              </button>
              {expanded && (
                <table className="pair-table">
                  <thead>
                    <tr>
                      <th>Cặp</th>
                      <th>ρ<sub>ij</sub></th>
                      <th>w<sub>i</sub></th>
                      <th>w<sub>j</sub></th>
                      <th>2·w<sub>i</sub>·ρ<sub>ij</sub>·w<sub>j</sub></th>
                      <th>% Var<sub>p</sub></th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.pairContributions.map((p) => (
                      <tr key={`${p.i}-${p.j}`}>
                        <td className="pair-name">{p.i} – {p.j}</td>
                        <td>{p.corr.toFixed(4)}</td>
                        <td>{p.wi.toFixed(4)}</td>
                        <td>{p.wj.toFixed(4)}</td>
                        <td className={p.contribution >= 0 ? 'pos' : 'neg'}>
                          {p.contribution.toFixed(6)}
                        </td>
                        <td>
                          {result.variance !== 0
                            ? ((p.contribution / result.variance) * 100).toFixed(1) + '%'
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
