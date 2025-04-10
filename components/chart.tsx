export const Area = ({ children, ...props }) => {
  return (
    <div className="recharts-area" {...props}>
      {children}
    </div>
  )
}

export const AreaChart = ({ children, ...props }) => {
  return (
    <div className="recharts-area-chart" {...props}>
      {children}
    </div>
  )
}

export const CartesianGrid = ({ children, ...props }) => {
  return (
    <div className="recharts-cartesian-grid" {...props}>
      {children}
    </div>
  )
}

export const Legend = ({ children, ...props }) => {
  return (
    <div className="recharts-legend" {...props}>
      {children}
    </div>
  )
}

export const Line = ({ children, ...props }) => {
  return (
    <div className="recharts-line" {...props}>
      {children}
    </div>
  )
}

export const LineChart = ({ children, ...props }) => {
  return (
    <div className="recharts-line-chart" {...props}>
      {children}
    </div>
  )
}

export const ResponsiveContainer = ({ children, ...props }) => {
  return (
    <div className="recharts-responsive-container" style={{ width: "100%", height: "100%" }} {...props}>
      {children}
    </div>
  )
}

export const Tooltip = ({ children, ...props }) => {
  return (
    <div className="recharts-tooltip" {...props}>
      {children}
    </div>
  )
}

export const XAxis = ({ children, ...props }) => {
  return (
    <div className="recharts-xaxis" {...props}>
      {children}
    </div>
  )
}

export const YAxis = ({ children, ...props }) => {
  return (
    <div className="recharts-yaxis" {...props}>
      {children}
    </div>
  )
}

export const ReferenceLine = ({ children, ...props }) => {
  return (
    <div className="recharts-reference-line" {...props}>
      {children}
    </div>
  )
}
