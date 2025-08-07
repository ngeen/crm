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

const CarRepairList = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const toast = useRef();
  const navigate = useNavigate();

  const statusOptions = [
    { label: 'Tümü', value: null },
    { label: 'Beklemede', value: 'pending' },
    { label: 'Devam Ediyor', value: 'in_progress' },
    { label: 'Tamamlandı', value: 'completed' },
    { label: 'İptal Edildi', value: 'cancelled' }
  ];

  const statusEditorOptions = [
    { label: 'Beklemede', value: 'pending' },
    { label: 'Devam Ediyor', value: 'in_progress' },
    { label: 'Tamamlandı', value: 'completed' },
    { label: 'İptal Edildi', value: 'cancelled' }
  ];

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      const response = await fetch('/api/car-repairs', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRepairs(data);
      } else {
        showToast('error', 'Hata', 'Araç tamirleri getirilemedi');
      }
    } catch (error) {
      showToast('error', 'Hata', 'Ağ hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchRepairs();
      return;
    }

    try {
      const response = await fetch(`/api/car-repairs/search/${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRepairs(data);
      } else {
        showToast('error', 'Hata', 'Arama başarısız');
      }
    } catch (error) {
      showToast('error', 'Hata', 'Arama hatası');
    }
  };

  const handleDelete = (repair) => {
    confirmDialog({
      message: `${repair.customer_name} için olan bu araç tamirini silmek istediğinizden emin misiniz?`,
      header: 'Silme Onayı',
      icon: 'pi pi-exclamation-triangle',
      accept: () => deleteRepair(repair.id),
      reject: () => {}
    });
  };

  const deleteRepair = async (repairId) => {
    try {
      const response = await fetch(`/api/car-repairs/${repairId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        showToast('success', 'Başarılı', 'Araç tamiri başarıyla silindi');
        fetchRepairs();
      } else {
        showToast('error', 'Hata', 'Araç tamiri silinemedi');
      }
    } catch (error) {
      showToast('error', 'Hata', 'Ağ hatası');
    }
  };

  const onRowEditComplete = async (e) => {
    let { newData, index } = e;
    try {
      const response = await fetch(`/api/car-repairs/${newData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newData.status }) // Only send the updated status
      });

      if (response.ok) {
        const updatedRecord = await response.json();
        const updatedRepairs = [...repairs];
        // The backend returns the full, updated record. Use it as the source of truth.
        updatedRepairs[index] = updatedRecord;
        setRepairs(updatedRepairs);
        showToast('success', 'Başarılı', 'Durum başarıyla güncellendi.');
      } else {
        // If the update fails, we don't want to leave the UI in the edited state.
        showToast('error', 'Hata', 'Durum güncellenemedi.');
      }
    } catch (error) {
      showToast('error', 'Hata', 'Ağ hatası.');
    }
  };

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail });
  };

  const actionTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          className="p-button-sm p-button-text p-button-info"
          onClick={() => navigate(`/dashboard/car-repairs/edit/${rowData.id}`)}
          tooltip="Detayları Görüntüle"
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
      'pending': 'warning',
      'in_progress': 'info',
      'completed': 'success',
      'cancelled': 'danger'
    };

    const statusTranslations = {
      'pending': 'Beklemede',
      'in_progress': 'Devam Ediyor',
      'completed': 'Tamamlandı',
      'cancelled': 'İptal Edildi'
    };
    
    return (
      <Tag 
        value={statusTranslations[rowData.status] || rowData.status} 
        severity={severity[rowData.status] || 'info'}
      />
    );
  };

  const customerTemplate = (rowData) => {
    return (
      <div>
        <div className="font-semibold">{rowData.customer_name}</div>
        {rowData.customer_phone && (
          <div className="text-sm text-gray-600">{rowData.customer_phone}</div>
        )}
      </div>
    );
  };

  const carInfoTemplate = (rowData) => {
    return (
      <div>
        <div className="font-semibold">{rowData.car_model}</div>
        {rowData.car_year && (
          <div className="text-sm text-gray-600">{rowData.car_year}</div>
        )}
        {rowData.license_plate && (
          <div className="text-sm text-gray-600">{rowData.license_plate}</div>
        )}
      </div>
    );
  };

  const amountTemplate = (rowData) => {
    return (
      <div className="text-right">
        <div className="font-semibold">₺{rowData.grand_total?.toFixed(2)}</div>
        <div className="text-sm text-gray-600">
          Ara Toplam: ₺{rowData.subtotal?.toFixed(2)}
        </div>
      </div>
    );
  };

  const filteredRepairs = repairs.filter(repair => {
    const matchesStatus = !statusFilter || repair.status === statusFilter;
    return matchesStatus;
  });

  const getStatusSeverity = (status) => {
    const severityMap = {
      'completed': 'success',
      'in_progress': 'info',
      'cancelled': 'danger',
      'pending': 'warning',
    };
    return severityMap[status] || 'info';
  };

  const statusEditor = (options) => {
    return (
        <Dropdown
            value={options.value}
            options={statusEditorOptions}
            onChange={(e) => options.editorCallback(e.value)}
            placeholder="Durum Seç"
            itemTemplate={(option) => {
                return <Tag value={option.label} severity={getStatusSeverity(option.value)}></Tag>;
            }}
        />
    );
  };

  return (
    <div className="card">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="flex justify-content-between align-items-center mb-4">
        <h2 className="text-2xl font-bold m-0">Araç Tamirleri</h2>
        <Button
          label="Araç Tamiri Ekle"
          icon="pi pi-plus"
          onClick={() => navigate('/dashboard/car-repairs/new')}
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
              placeholder="Tamirlerde ara..."
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
          onClick={fetchRepairs}
          className="p-button-outlined"
          tooltip="Yenile"
        />
      </div>

      <DataTable
        value={filteredRepairs}
        loading={loading}
        editMode="row"
        dataKey="id"
        onRowEditComplete={onRowEditComplete}
        paginator
        rows={10}
        rowsPerPageOptions={[10, 20, 50]}
        className="p-datatable-sm"
        emptyMessage="Araç tamiri bulunamadı"
      >
        <Column field="customer_name" header="Müşteri" body={customerTemplate} sortable />
        <Column field="car_model" header="Araç Bilgisi" body={carInfoTemplate} sortable />
        <Column field="repair_date" header="Tamir Tarihi" sortable 
          body={(rowData) => new Date(rowData.repair_date).toLocaleDateString()} />
        <Column field="description" header="Açıklama" 
          body={(rowData) => rowData.description?.substring(0, 50) + (rowData.description?.length > 50 ? '...' : '')} />
        <Column field="grand_total" header="Tutar" body={amountTemplate} sortable />
        <Column field="status" header="Durum" body={statusTemplate} editor={statusEditor} sortable />
        <Column field="created_at" header="Oluşturulma" sortable 
          body={(rowData) => new Date(rowData.created_at).toLocaleDateString()} />
        <Column rowEditor headerStyle={{ width: '10%' }} bodyStyle={{ textAlign: 'center' }}></Column>
        <Column header="İşlemler" body={actionTemplate} style={{ width: '120px' }} />
      </DataTable>
    </div>
  );
};

export default CarRepairList; 