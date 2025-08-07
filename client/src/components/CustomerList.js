import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { useRef } from 'react';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const toast = useRef();
  const navigate = useNavigate();

  const statusOptions = [
    { label: 'Tümü', value: null },
    { label: 'Aktif', value: 'active' },
    { label: 'Pasif', value: 'inactive' },
    { label: 'Potansiyel', value: 'lead' }
  ];

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        showToast('error', 'Hata', 'Müşteriler getirilemedi');
      }
    } catch (error) {
      showToast('error', 'Hata', 'Ağ hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchCustomers();
      return;
    }

    try {
      const response = await fetch(`/api/customers/search/${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        showToast('error', 'Hata', 'Arama başarısız');
      }
    } catch (error) {
      showToast('error', 'Hata', 'Arama hatası');
    }
  };

  const handleDelete = (customer) => {
    confirmDialog({
      message: `${customer.name} isimli müşteriyi silmek istediğinizden emin misiniz?`,
      header: 'Silme Onayı',
      icon: 'pi pi-exclamation-triangle',
      accept: () => deleteCustomer(customer.id),
      reject: () => {}
    });
  };

  const deleteCustomer = async (customerId) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        showToast('success', 'Başarılı', 'Müşteri başarıyla silindi');
        fetchCustomers();
      } else {
        showToast('error', 'Hata', 'Müşteri silinemedi');
      }
    } catch (error) {
      showToast('error', 'Hata', 'Ağ hatası');
    }
  };

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail });
  };

  const actionTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-sm p-button-text"
          onClick={() => navigate(`/dashboard/customers/edit/${rowData.id}`)}
          tooltip="Düzenle"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-sm p-button-text p-button-danger"
          onClick={() => handleDelete(rowData)}
          tooltip="Sil"
        />
      </div>
    );
  };

  const statusTemplate = (rowData) => {
    const severity = {
      'active': 'success',
      'inactive': 'danger',
      'lead': 'warning'
    };
    
    return (
      <Tag 
        value={rowData.status} 
        severity={severity[rowData.status] || 'info'}
      />
    );
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesStatus = !statusFilter || customer.status === statusFilter;
    return matchesStatus;
  });

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="flex justify-content-between align-items-center mb-4">
        <h2 className="text-2xl font-bold m-0">Müşteriler</h2>
        <Button
          label="Müşteri Ekle"
          icon="pi pi-plus"
          onClick={() => navigate('/dashboard/customers/new')}
          className="p-button-success"
        />
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <span className="p-input-icon-left w-full">
            <i className="pi pi-search" />
            <InputText
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Müşteri ara..."
              className="w-full"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </span>
        </div>
        <Dropdown
          value={statusFilter}
          options={statusOptions}
          onChange={(e) => setStatusFilter(e.value)}
          placeholder="Duruma göre filtrele"
          className="w-10rem"
        />
        <Button
          icon="pi pi-refresh"
          onClick={fetchCustomers}
          className="p-button-outlined"
          tooltip="Yenile"
        />
      </div>

      <DataTable
        value={filteredCustomers}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[10, 20, 50]}
        className="p-datatable-sm"
        emptyMessage="Müşteri bulunamadı"
      >
        <Column field="name" header="İsim" sortable />
        <Column field="email" header="E-posta" sortable />
        <Column field="phone" header="Telefon" />
        <Column field="company" header="Şirket" sortable />
        <Column field="status" header="Durum" body={statusTemplate} sortable />
        <Column field="created_at" header="Oluşturulma" sortable 
          body={(rowData) => new Date(rowData.created_at).toLocaleDateString()} />
        <Column header="İşlemler" body={actionTemplate} style={{ width: '120px' }} />
      </DataTable>
    </div>
  );
};

export default CustomerList; 