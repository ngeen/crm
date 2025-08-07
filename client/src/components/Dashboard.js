import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalDeals: 0,
    closedDeals: 0,
    totalRevenue: 0,
    todaysRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [customersResponse, repairsResponse] = await Promise.all([
          fetch('/api/customers', { credentials: 'include' }),
          fetch('/api/car-repairs', { credentials: 'include' }),
        ]);

        const customersData = customersResponse.ok ? await customersResponse.json() : [];
        const repairsData = repairsResponse.ok ? await repairsResponse.json() : [];

        // --- Calculate all stats from the fetched data ---
        const totalCustomers = customersData.length;
        const totalDeals = repairsData.length;
        const closedDeals = repairsData.filter(r => r.status === 'completed').length;
        const totalRevenue = repairsData.reduce((sum, repair) => sum + (repair.grand_total || 0), 0);

        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        const todaysRevenue = repairsData
          .filter(repair => {
            const repairDate = new Date(`${repair.repair_date}T00:00:00`);
            return repairDate >= todayStart && repairDate <= todayEnd;
          })
          .reduce((sum, repair) => sum + (repair.grand_total || 0), 0);

        setStats({
          totalCustomers,
          totalDeals,
          closedDeals,
          totalRevenue,
          todaysRevenue,
        });

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartData = {
    labels: ['Aktif Müşteriler', 'Pasif Müşteriler', 'Potansiyel Müşteriler'],
    datasets: [
      {
        data: [
          stats.totalCustomers * 0.7,
          stats.totalCustomers * 0.2,
          stats.totalCustomers * 0.1,
        ],
        backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    plugins: {
      legend: {
        display: false
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  return (
    <div className="grid">
      <div className="col-12">
        <h1 className="text-3xl font-bold mb-4">Kontrol Paneli</h1>
      </div>

      {/* Stats Cards */}
      <div className="col-12 md:col-6 lg:col-3">
        <Card className="text-center">
          <div className="flex align-items-center justify-content-center mb-3">
            <i className="pi pi-users text-3xl text-blue-500 mr-3"></i>
            <div>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalCustomers}</div>
              <div className="text-sm text-gray-600">Toplam Müşteri</div>
            </div>
          </div>
          <Button
            label="Müşterileri Görüntüle"
            icon="pi pi-arrow-right"
            className="p-button-text"
            onClick={() => navigate('/dashboard/customers')}
          />
        </Card>
      </div>

      <div className="col-12 md:col-6 lg:col-3">
        <Card className="text-center">
          <div className="flex align-items-center justify-content-center mb-3">
            <i className="pi pi-briefcase text-3xl text-indigo-500 mr-3"></i>
            <div>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalDeals}</div>
              <div className="text-sm text-gray-600">Toplam İş</div>
            </div>
          </div>
           <Button
            label="Tamirleri Görüntüle"
            icon="pi pi-arrow-right"
            className="p-button-text"
            onClick={() => navigate('/dashboard/car-repairs')}
          />
        </Card>
      </div>

      <div className="col-12 md:col-6 lg:col-3">
        <Card className="text-center">
          <div className="flex align-items-center justify-content-center mb-3">
            <i className="pi pi-check-circle text-3xl text-purple-500 mr-3"></i>
            <div>
              <div className="text-2xl font-bold">{loading ? '...' : stats.closedDeals}</div>
              <div className="text-sm text-gray-600">Tamamlanan İşler</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="col-12 md:col-6 lg:col-3">
        <Card className="text-center">
          <div className="flex align-items-center justify-content-center mb-3">
            <i className="pi pi-dollar text-3xl text-orange-500 mr-3"></i>
            <div>
              <div className="text-2xl font-bold">₺{loading ? '...' : (stats.totalRevenue?.toLocaleString() || 0)}</div>
              <div className="text-sm text-gray-600">Toplam Gelir</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="col-12 md:col-6 lg:col-3">
        <Card className="text-center">
          <div className="flex align-items-center justify-content-center mb-3">
            <i className="pi pi-dollar text-3xl text-green-500 mr-3"></i>
            <div>
              <div className="text-2xl font-bold">₺{loading ? '...' : (stats.todaysRevenue?.toLocaleString() || 0)}</div>
              <div className="text-sm text-gray-600">Bugünkü Gelir</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="col-12 md:col-6">
        <Card title="Müşteri Dağılımı">
          <div style={{ height: '300px' }}>
            <Chart type="doughnut" data={chartData} options={chartOptions} />
          </div>
        </Card>
      </div>

      <div className="col-12 md:col-6">
        <Card title="Hızlı İşlemler">
          <div className="grid">
            <div className="col-12 md:col-6">
              <Button
                label="Müşteri Ekle"
                icon="pi pi-plus"
                className="p-button-success w-full mb-3"
                onClick={() => navigate('/dashboard/customers/new')}
              />
            </div>
            <div className="col-12 md:col-6">
              <Button
                label="Araç Tamiri Ekle"
                icon="pi pi-wrench"
                className="p-button-primary w-full mb-3"
                onClick={() => navigate('/dashboard/car-repairs/new')}
              />
            </div>
            <div className="col-12 md:col-6">
              <Button
                label="Raporları Görüntüle"
                icon="pi pi-chart-bar"
                className="p-button-outlined w-full"
                onClick={() => navigate('/dashboard/reports')}
              />
            </div>
            <div className="col-12 md:col-6">
              <Button
                label="Manage Customers"
                icon="pi pi-users"
                className="p-button-outlined w-full"
                onClick={() => navigate('/dashboard/customers')}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard; 