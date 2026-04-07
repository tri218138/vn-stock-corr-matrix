import { useRef, useEffect } from 'react'
import Plotly from 'plotly.js-cartesian-dist-min'
import type { CorrelationData } from './types'

interface HeatmapProps {
  data: CorrelationData
}

export default function Heatmap({ data }: HeatmapProps) {
  const { tickers, matrix } = data
  const plotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!plotRef.current) return

    const annotations: Partial<Plotly.Annotations>[] = []
    if (tickers.length <= 25) {
      for (let i = 0; i < tickers.length; i++) {
        for (let j = 0; j < tickers.length; j++) {
          const val = matrix[i][j]
          annotations.push({
            x: tickers[j],
            y: tickers[i],
            text: val.toFixed(2),
            showarrow: false,
            font: {
              size: tickers.length > 15 ? 8 : 10,
              color: Math.abs(val) > 0.6 ? '#fff' : '#333',
            },
          })
        }
      }
    }

    const size = Math.max(500, tickers.length * 42)

    Plotly.newPlot(
      plotRef.current,
      [
        {
          z: matrix,
          x: tickers,
          y: tickers,
          type: 'heatmap',
          colorscale: [
            [0, '#b71c1c'],
            [0.25, '#ef5350'],
            [0.5, '#ffffff'],
            [0.75, '#42a5f5'],
            [1, '#0d47a1'],
          ],
          zmin: -1,
          zmax: 1,
          hoverongaps: false,
          hovertemplate:
            '<b>%{x}</b> vs <b>%{y}</b><br>Correlation: %{z:.4f}<extra></extra>',
          colorbar: {
            title: { text: 'Correlation', side: 'right' },
            thickness: 15,
            len: 0.9,
          },
        },
      ],
      {
        width: size,
        height: size,
        margin: { l: 70, r: 40, t: 30, b: 70 },
        xaxis: {
          tickangle: -45,
          tickfont: { size: tickers.length > 30 ? 8 : 11 },
          side: 'bottom' as const,
        },
        yaxis: {
          tickfont: { size: tickers.length > 30 ? 8 : 11 },
          autorange: 'reversed',
        },
        annotations,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
      },
      {
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        responsive: true,
      },
    )

    return () => {
      if (plotRef.current) Plotly.purge(plotRef.current)
    }
  }, [tickers, matrix])

  return (
    <div className="heatmap-container">
      <div ref={plotRef} />
    </div>
  )
}
