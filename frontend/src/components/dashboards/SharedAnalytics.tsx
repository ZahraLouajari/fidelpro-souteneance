import { weeklyVisitsData, monthlyGrowthData, categoryDistribution } from '@/lib/mock-data';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SharedAnalytics() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-foreground">Analytics</h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-elegant">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Weekly Visits</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyVisitsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
              <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card-elegant">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
              <Legend />
              <Line type="monotone" dataKey="clients" stroke="hsl(var(--primary))" strokeWidth={2.5} />
              <Line type="monotone" dataKey="visits" stroke="hsl(var(--warm-gold))" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card-elegant lg:col-span-2">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Restaurant Categories</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={categoryDistribution} dataKey="value" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {categoryDistribution.map((_, i) => (
                  <Cell key={i} fill={categoryDistribution[i].fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
