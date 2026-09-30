/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { departmentApi } from '../../api/departmentApi';
import { useMetrics } from '../../hooks/useMetrics';
import { METRICS_COLORS } from '../../constants';
import { SectionErrorBoundary } from '../../components/errors/SectionErrorBoundary';

interface Department {
  id: string;
  name: string;
}

export const MetricsDashboardPage: React.FC = () => {
  const { metrics, chartData, loading, error, filters, setFilter, refetch } = useMetrics({});
  const [departments, setDepartments] = useState<Department[]>([]);

  const fetchDepartments = async () => {
    try {
      const departmentsData = await departmentApi.getAllDepartments();
      if (Array.isArray(departmentsData)) {
        setDepartments(departmentsData);
      }
    } catch { /* noop */ 
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const renderSummaryCards = () => {
    if (!metrics) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Tickets</h3>
          <p className="text-3xl font-bold text-gray-800">{metrics.totalTickets}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Open Tickets</h3>
          <p className="text-3xl font-bold text-blue-600">{metrics.openTickets}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Closed Tickets</h3>
          <p className="text-3xl font-bold text-green-600">{metrics.closedTickets}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">SLA Breach Rate</h3>
          <p className={`text-3xl font-bold ${metrics.slaBreachRate > 10 ? 'text-red-600' : 'text-green-600'}`}>
            {metrics.slaBreachRate.toFixed(1)}%
          </p>
        </div>
      </div>
    );
  };

  const renderCharts = () => {
    if (!metrics || !chartData) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Trend Chart */}
        <SectionErrorBoundary sectionName="Ticket Volume Trend">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Ticket Volume Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="created" stroke="#0088FE" strokeWidth={2} dot={false} name="Created" />
                  <Line type="monotone" dataKey="closed" stroke="#00C49F" strokeWidth={2} dot={false} name="Closed" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SectionErrorBoundary>

        {/* Priority Breakdown */}
        <SectionErrorBoundary sectionName="Priority Distribution">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Priority Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.byPriority}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="priority"
                    label={(props: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ => `P${props.priority} ${((props.percent || 0) * 100).toFixed(0)}%`}
                  >
                    {metrics.byPriority.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={METRICS_COLORS[index % METRICS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SectionErrorBoundary>

        {/* Department Breakdown */}
        <SectionErrorBoundary sectionName="Volume by Department">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Volume by Department</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.byDepartment} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="departmentName" type="category" tick={{fontSize: 12}} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="Tickets" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SectionErrorBoundary>

        {/* SLA Compliance */}
        <SectionErrorBoundary sectionName="SLA Compliance">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-4">SLA Compliance</h3>
            <div className="h-72 flex flex-col justify-center items-center">
              {metrics.totalTickets > 0 ? (
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={chartData.slaData}
                      cx="50%"
                      cy="50%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      <Cell fill="#00C49F" />
                      <Cell fill="#FF8042" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-gray-400">No data available</div>
              )}
              {metrics.averageTatHours !== null && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">Average Turnaround Time</p>
                  <p className="text-xl font-semibold text-gray-800">{metrics.averageTatHours} hours</p>
                </div>
              )}
            </div>
          </div>
        </SectionErrorBoundary>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Performance Metrics</h1>
        
        <div className="flex flex-col md:flex-row gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <select
            className="border-gray-300 rounded-md text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            value={filters.departmentId || ''}
            onChange={(e) => setFilter('departmentId', e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          
          <input
            type="datetime-local"
            className="border-gray-300 rounded-md text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            value={filters.startDate || ''}
            onChange={(e) => setFilter('startDate', e.target.value)}
          />
          
          <span className="self-center text-gray-500">to</span>
          
          <input
            type="datetime-local"
            className="border-gray-300 rounded-md text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            value={filters.endDate || ''}
            onChange={(e) => setFilter('endDate', e.target.value)}
          />
          
          <button
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8 flex justify-between">
          <p>{error}</p>
          <button onClick={() => refetch()} className="font-semibold underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {renderSummaryCards()}
          {renderCharts()}
        </>
      )}
    </div>
  );
};

export default MetricsDashboardPage;
