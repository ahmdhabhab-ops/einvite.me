// The Dashboard's responses pie chart. Lives in its own file so recharts
// (a large library) is only downloaded when the Dashboard is opened, not by
// every guest and home-page visitor.
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ResponsesPieChart({ data, tooltipStyle, legendStyle }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
          {data.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={legendStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
