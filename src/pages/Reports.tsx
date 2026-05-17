import { useState, useEffect } from "react";
import { format, parseISO, startOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Activity, Thermometer, UserMinus, CalendarOff } from "lucide-react";

type PeriodType = 'today' | 'this_week' | 'this_month' | 'prev_month' | 'last_7_days';

export default function Reports() {
  const [data, setData] = useState<any[]>([]);
  const [teamData, setTeamData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('last_7_days');

  // Stats over the selected window (computed from data)
  const [totals, setTotals] = useState({ work: 0, sick: 0, leave: 0, off: 0 });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const today = new Date();
        let start, end;
        switch (period) {
          case 'today':
            start = startOfToday();
            end = startOfToday();
            break;
          case 'this_week':
            // start week on monday
            start = startOfWeek(today, { weekStartsOn: 1 });
            end = endOfWeek(today, { weekStartsOn: 1 });
            break;
          case 'this_month':
            start = startOfMonth(today);
            end = endOfMonth(today);
            break;
          case 'prev_month':
            start = startOfMonth(subMonths(today, 1));
            end = endOfMonth(subMonths(today, 1));
            break;
          case 'last_7_days':
          default:
            start = subDays(today, 6);
            end = today;
        }

        const startDate = format(start, 'yyyy-MM-dd');
        const endDate = format(end, 'yyyy-MM-dd');

        const [res, teamRes] = await Promise.all([
          fetch(`/api/analytics?startDate=${startDate}&endDate=${endDate}`),
          fetch(`/api/analytics/team?startDate=${startDate}&endDate=${endDate}`)
        ]);
        
        const rawData = await res.json();
        const rawTeamData = await teamRes.json();
        
        // Transform dates to readable format for charts
        const formattedData = rawData.map((day: any) => ({
          ...day,
          displayDate: format(parseISO(day.date), "MMM dd")
        }));
        
        setData(formattedData);
        setTeamData(rawTeamData);

        // Compute totals
        const sums = rawData.reduce((acc: any, curr: any) => ({
          work: acc.work + (curr.Work || 0),
          sick: acc.sick + (curr.Sick || 0),
          leave: acc.leave + (curr.Leave || 0),
          off: acc.off + (curr["Off Day"] || 0),
        }), { work: 0, sick: 0, leave: 0, off: 0 });

        setTotals(sums);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  const totalEntries = totals.work + totals.sick + totals.leave + totals.off;

  const statCards = [
    { title: "Working", value: totals.work, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Sick", value: totals.sick, icon: Thermometer, color: "text-rose-600", bg: "bg-rose-50" },
    { title: "On Leave", value: totals.leave, icon: UserMinus, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Off Days", value: totals.off, icon: CalendarOff, color: "text-gray-600", bg: "bg-gray-50" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Analytics & Reports</h1>
          <p className="text-sm text-gray-500">Summary of recent team availability.</p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodType)}
          className="bg-white border border-gray-100 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
        >
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="this_month">This Month</option>
          <option value="prev_month">Previous Month</option>
        </select>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-500">Loading analytics...</div>
      ) : (
        <>
          {totalEntries === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
              No status data recorded for the selected period.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
                      <Icon size={24} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {data.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Availability Trend</h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="displayDate" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip 
                      cursor={{fill: '#F3F4F6'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                    <Bar dataKey="Work" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Sick" stackId="a" fill="#F43F5E" />
                    <Bar dataKey="Leave" stackId="a" fill="#F59E0B" />
                    <Bar dataKey="Off Day" stackId="a" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {teamData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Summary by Team Member</h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip 
                      cursor={{fill: '#F3F4F6'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                    <Bar dataKey="Work" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Sick" stackId="a" fill="#F43F5E" />
                    <Bar dataKey="Leave" stackId="a" fill="#F59E0B" />
                    <Bar dataKey="Off Day" stackId="a" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
