import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';

const Reports = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [period, setPeriod] = useState('daily');
  const [allRepairs, setAllRepairs] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customDateRange, setCustomDateRange] = useState([null, null]);

  // Effect to fetch all necessary data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [customersResponse, repairsResponse] = await Promise.all([
          fetch('/api/customers', { credentials: 'include' }),
          fetch('/api/car-repairs', { credentials: 'include' })
        ]);
 
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          setCustomers([{ id: 'all', name: 'Tüm Müşteriler' }, ...customersData]);
        } else {
          console.error('Failed to fetch customers:', await customersResponse.text());
        }
 
        if (repairsResponse.ok) {
          const repairsData = await repairsResponse.json();
          setAllRepairs(repairsData);
        } else {
          console.error('Failed to fetch car repairs:', await repairsResponse.text());
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        setLoading(false);
      }
    };
 
    fetchInitialData();
  }, []); // Empty dependency array means this runs once on mount
 
  // Effect to filter data when period or customer changes
  useEffect(() => {
    if (loading || !allRepairs.length) {
      setReportData([]);
      setTotal(0);
      return;
    }
 
    let startDate, endDate;
    const today = new Date();
 
    switch (period) {
      case 'daily':
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly': { // Last full week (Mon-Sun)
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const mondayThisWeek = new Date(today.setDate(diff));
        
        endDate = new Date(mondayThisWeek);
        endDate.setDate(mondayThisWeek.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);

        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case 'last-month': {
        const year = today.getFullYear();
        const month = today.getMonth();
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'yearly':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        [startDate, endDate] = customDateRange;
        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      default:
        return;
    }
 
    if (!startDate || !endDate) {
      setReportData([]);
      setTotal(0);
      return;
    }

    const filteredRepairs = allRepairs.filter(repair => {
      // The `repair_date` is a string like 'YYYY-MM-DD'. new Date() can parse this
      // as UTC midnight, causing timezone-related off-by-one-day errors.
      // Appending T00:00:00 ensures it's parsed as midnight in the user's local timezone.
      const repairDate = new Date(`${repair.repair_date}T00:00:00`);
      if (isNaN(repairDate.getTime())) return false;

      const customerMatch = selectedCustomer === 'all' || repair.customer_id === selectedCustomer;
      const dateMatch = repairDate >= startDate && repairDate <= endDate;
      return customerMatch && dateMatch;
    });
 
    setReportData(filteredRepairs);
    const newTotal = filteredRepairs.reduce((sum, row) => sum + (row.grand_total || 0), 0);
    setTotal(newTotal);
  }, [period, selectedCustomer, allRepairs, customDateRange, loading]);

  const handleDateRangeChange = (e) => {
    const newRange = e.value;
    setCustomDateRange(newRange);
    if (newRange && newRange[0] && newRange[1]) {
      setPeriod('custom');
    }
  };

  return (
    <div className="card">
      <Card>
        <h2 className="text-2xl font-bold mb-4">Raporlar</h2>
        <div className="flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div className="flex align-items-center flex-wrap gap-3">
            <Dropdown
              value={selectedCustomer}
              options={customers}
              onChange={(e) => setSelectedCustomer(e.value)}
              optionLabel="name"
              optionValue="id"
              placeholder="Müşteri Seç"
              className="w-full md:w-20rem"
            />
            <Calendar
              value={customDateRange}
              onChange={handleDateRangeChange}
              selectionMode="range"
              readOnlyInput
              placeholder="Özel Tarih Aralığı"
              dateFormat="dd/mm/yy"
              className="w-full md:w-20rem"
            />
          </div>
          <div className="flex align-items-center flex-wrap gap-2">
            <Button label="Bugün" className={`p-button-sm ${period === 'daily' ? 'p-button-success' : 'p-button-outlined'}`} onClick={() => setPeriod('daily')} />
            <Button label="Geçen Hafta" className={`p-button-sm ${period === 'weekly' ? 'p-button-success' : 'p-button-outlined'}`} onClick={() => setPeriod('weekly')} />
            <Button label="Geçen Ay" className={`p-button-sm ${period === 'last-month' ? 'p-button-success' : 'p-button-outlined'}`} onClick={() => setPeriod('last-month')} />
            <Button label="Bu Yıl" className={`p-button-sm ${period === 'yearly' ? 'p-button-success' : 'p-button-outlined'}`} onClick={() => setPeriod('yearly')} />
          </div>
        </div>
        <DataTable value={reportData} loading={loading} paginator rows={10} emptyMessage="Seçilen filtrelere uygun kayıt bulunamadı.">
          <Column field="customer_name" header="Müşteri" sortable />
          <Column field="grand_total" header="Tutar" body={row => `₺${row.grand_total?.toLocaleString() || 0}`} sortable />
          <Column field="repair_date" header="Tamir Tarihi" body={row => new Date(row.repair_date).toLocaleDateString()} sortable />
        </DataTable>
        <div className="text-right mt-4">
          <h3 className="text-xl font-bold">Toplam Gelir: ₺{total.toLocaleString()}</h3>
        </div>
      </Card>
    </div>
  );
};

export default Reports; 