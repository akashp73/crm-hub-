import React, { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { dashboardAPI } from '../services/api';
import { FiUsers, FiTrendingUp, FiCheckCircle, FiAward } from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [hotLeads, setHotLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, hotLeadsRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getHotLeads(5)
        ]);
        setStats(statsRes.data);
        setHotLeads(hotLeadsRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  const statusData = Object.entries(stats?.leadsByStatus || {}).map(([status, count]) => ({
    name: status,
    value: count
  }));

  const COLORS = ['#1B2B4B', '#2D3748', '#F6AD2B', '#4CAF50'];

  return (
    <div className="p-8 bg-[#F7F8FC] min-h-screen">
      <h1 className="text-3xl font-bold text-[#1B2B4B] mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<FiUsers />} label="Total Leads" value={stats?.totalLeads} color="bg-blue-500" />
        <StatCard icon={<FiTrendingUp />} label="Hot Leads" value={stats?.hotLeads} color="bg-red-500" />
        <StatCard icon={<FiCheckCircle />} label="Tasks Due Today" value={stats?.tasksDueToday} color="bg-yellow-500" />
        <StatCard icon={<FiAward />} label="Enrolled This Month" value={stats?.enrolledThisMonth} color="bg-green-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leads by Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-[#1B2B4B] mb-4">Leads by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={renderCustomLabel} outerRadius={80} fill="#8884d8" dataKey="value">
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Hot Leads Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-[#1B2B4B] mb-4">Top Hot Leads</h2>
          <div className="space-y-3">
            {hotLeads.map((lead) => (
              <div key={lead.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold text-[#1B2B4B]">{lead.name}</p>
                  <p className="text-sm text-gray-600">{lead.courseInterested}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold">
                    {lead.activityScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center">
    <div className={`${color} p-4 rounded-lg text-white text-2xl mr-4`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-3xl font-bold text-[#1B2B4B]">{value || 0}</p>
    </div>
  </div>
);

const renderCustomLabel = ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`;

export default Dashboard;
