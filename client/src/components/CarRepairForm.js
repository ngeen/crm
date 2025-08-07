import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const CarRepairForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useRef();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [repair, setRepair] = useState({
    customer_id: null,
    car_model: '',
    car_year: '',
    license_plate: '',
    repair_date: new Date(),
    description: '',
    subtotal: 0,
    tax_rate: 0,
    tax_amount: 0,
    grand_total: 0,
    status: 'pending',
    notes: '',
    items: []
  });

  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0
  });

  const statusOptions = [
    { label: 'Beklemede', value: 'pending' },
    { label: 'Devam Ediyor', value: 'in_progress' },
    { label: 'Tamamlandı', value: 'completed' },
    { label: 'İptal Edildi', value: 'cancelled' }
  ];

  const isEditMode = !!id;

  useEffect(() => {
    fetchCustomers();
    if (isEditMode) {
      fetchRepair();
    }
  }, [id]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.map(customer => ({
          label: `${customer.name}${customer.phone ? ` (${customer.phone})` : ''}`,
          value: customer.id
        })));
      }
    } catch (error) {
      showToast('error', 'Hata', 'Müşteriler getirilemedi');
    }
  };

  const fetchRepair = async () => {
    try {
      const response = await fetch(`/api/car-repairs/${id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRepair({
          ...data,
          repair_date: new Date(data.repair_date)
        });
      } else {
        showToast('error', 'Hata', 'Araç tamiri getirilemedi');
        navigate('/dashboard/car-repairs');
      }
    } catch (error) {
      showToast('error', 'Hata', 'Ağ hatası');
      navigate('/dashboard/car-repairs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditMode ? `/api/car-repairs/${id}` : '/api/car-repairs';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const repairData = {
        ...repair,
        repair_date: repair.repair_date.toISOString().split('T')[0],
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(repairData),
      });

      if (response.ok) {
        showToast('success', 'Başarılı', 
          isEditMode ? 'Araç tamiri başarıyla güncellendi' : 'Araç tamiri başarıyla oluşturuldu');
        navigate('/dashboard/car-repairs');
      } else {
        const errorData = await response.json();
        showToast('error', 'Hata', errorData.error || 'Araç tamiri kaydedilemedi');
      }
    } catch (error) {
      showToast('error', 'Hata', 'Ağ hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setRepair(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addItem = () => {
    if (!newItem.description.trim()) {
      showToast('warn', 'Uyarı', 'Lütfen kalem için bir açıklama girin');
      return;
    }

    const item = {
      ...newItem,
      total_price: newItem.quantity * newItem.unit_price
    };

    setNewItem({
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    });

    setRepair(prev => {
      const updatedItems = [...prev.items, item];
      const subtotal = updatedItems.reduce((sum, i) => sum + (i.total_price || 0), 0);
      const taxAmount = subtotal * (prev.tax_rate / 100);
      const grandTotal = subtotal + taxAmount;
      return {
        ...prev,
        items: updatedItems,
        subtotal,
        tax_amount: taxAmount,
        grand_total: grandTotal,
      };
    });
  };

  const removeItem = (index) => {
    setRepair(prev => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      const subtotal = updatedItems.reduce((sum, i) => sum + (i.total_price || 0), 0);
      const taxAmount = subtotal * (prev.tax_rate / 100);
      const grandTotal = subtotal + taxAmount;
      return {
        ...prev,
        items: updatedItems,
        subtotal,
        tax_amount: taxAmount,
        grand_total: grandTotal,
      };
    });
  };

  const handleItemChange = (field, value) => {
    setNewItem(prev => ({
      ...prev,
      [field]: value,
      total_price: field === 'quantity' || field === 'unit_price' 
        ? (field === 'quantity' ? value : prev.quantity) * (field === 'unit_price' ? value : prev.unit_price)
        : prev.total_price
    }));
  };

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail });
  };

  const handleCancel = () => {
    navigate('/dashboard/car-repairs');
  };

  const itemActionTemplate = (rowData, index) => {
    return (
      <Button
        icon="pi pi-trash"
        className="p-button-sm p-button-text p-button-danger"
        onClick={() => removeItem(index)}
        tooltip="Kalemi Kaldır"
      />
    );
  };

  return (
    <div className="flex justify-content-center">
      <div className="w-full max-w-4xl">
        <Card>
          <div className="flex justify-content-between align-items-center mb-4">
            <h2 className="text-2xl font-bold m-0">
              {isEditMode ? 'Araç Tamirini Düzenle' : 'Yeni Araç Tamiri Ekle'}
            </h2>
            <Button
              icon="pi pi-times"
              className="p-button-text"
              onClick={handleCancel}
              tooltip="İptal"
            />
          </div>

          <form onSubmit={handleSubmit} className="p-fluid">
            <div className="grid">
              {/* Customer Selection */}
              <div className="col-12 md:col-6">
                <label htmlFor="customer_id" className="block text-sm font-medium mb-2">
                  Müşteri *
                </label>
                <Dropdown
                  id="customer_id"
                  value={repair.customer_id}
                  options={customers}
                  onChange={(e) => handleChange('customer_id', e.value)}
                  placeholder="Müşteri seçin"
                  required
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="repair_date" className="block text-sm font-medium mb-2">
                  Tamir Tarihi *
                </label>
                <Calendar
                  id="repair_date"
                  value={repair.repair_date}
                  onChange={(e) => handleChange('repair_date', e.value)}
                  dateFormat="yy-mm-dd"
                  className="w-full"
                />
              </div>

              {/* Car Information */}
              <div className="col-12 md:col-4">
                <label htmlFor="car_model" className="block text-sm font-medium mb-2">
                  Araç Modeli
                </label>
                <InputText
                  id="car_model"
                  value={repair.car_model}
                  onChange={(e) => handleChange('car_model', e.target.value)}
                  placeholder="Araç modelini girin"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="car_year" className="block text-sm font-medium mb-2">
                  Araç Yılı
                </label>
                <InputText
                  id="car_year"
                  value={repair.car_year}
                  onChange={(e) => handleChange('car_year', e.target.value)}
                  placeholder="Araç yılını girin"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="license_plate" className="block text-sm font-medium mb-2">
                  Plaka
                </label>
                <InputText
                  id="license_plate"
                  value={repair.license_plate}
                  onChange={(e) => handleChange('license_plate', e.target.value)}
                  placeholder="Plakayı girin"
                  className="w-full"
                />
              </div>

              {/* Description and Status */}
              <div className="col-12 md:col-8">
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Açıklama
                </label>
                <InputTextarea
                  id="description"
                  value={repair.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Tamir açıklamasını girin"
                  rows={3}
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-4">
                <label htmlFor="status" className="block text-sm font-medium mb-2">
                  Durum
                </label>
                <Dropdown
                  id="status"
                  value={repair.status}
                  options={statusOptions}
                  onChange={(e) => handleChange('status', e.value)}
                  placeholder="Durum seçin"
                  className="w-full"
                />
              </div>

              {/* Repair Items */}
              <div className="col-12">
                <h3 className="text-lg font-semibold mb-3">Tamir Kalemleri</h3>
                
                <div className="grid mb-3">
                  <div className="col-12 md:col-4">
                    <label htmlFor="item_description" className="block text-sm font-medium mb-2">
                      Açıklama
                    </label>
                    <InputText
                      id="item_description"
                      value={newItem.description}
                      onChange={(e) => handleItemChange('description', e.target.value)}
                      placeholder="Kalem açıklamasını girin"
                      className="w-full"
                    />
                  </div>

                  <div className="col-12 md:col-2">
                    <label htmlFor="item_quantity" className="block text-sm font-medium mb-2">
                      Miktar
                    </label>
                    <InputNumber
                      id="item_quantity"
                      value={newItem.quantity}
                      onValueChange={(e) => handleItemChange('quantity', e.value)}
                      min={1}
                      className="w-full"
                    />
                  </div>

                  <div className="col-12 md:col-2">
                    <label htmlFor="item_unit_price" className="block text-sm font-medium mb-2">
                      Birim Fiyat
                    </label>
                    <InputNumber
                      id="item_unit_price"
                      value={newItem.unit_price}
                      onValueChange={(e) => handleItemChange('unit_price', e.value)}
                      mode="decimal"
                      minFractionDigits={2}
                      min={0}
                      className="w-full"
                    />
                  </div>

                  <div className="col-12 md:col-2">
                    <label htmlFor="item_total" className="block text-sm font-medium mb-2">
                      Toplam
                    </label>
                    <InputNumber
                      id="item_total"
                      value={newItem.total_price}
                      mode="decimal"
                      minFractionDigits={2}
                      disabled
                      className="w-full"
                    />
                  </div>

                  <div className="col-12 md:col-2 flex align-items-end">
                    <Button
                      type="button"
                      label="Kalem Ekle"
                      icon="pi pi-plus"
                      onClick={addItem}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Items Table */}
                {repair.items.length > 0 && (
                  <DataTable value={repair.items} className="mb-4">
                    <Column field="description" header="Açıklama" />
                    <Column field="quantity" header="Mkt" style={{ width: '80px' }} />
                    <Column field="unit_price" header="Birim Fiyat" 
                      body={(rowData) => `₺${rowData.unit_price?.toFixed(2)}`} />
                    <Column field="total_price" header="Toplam" 
                      body={(rowData) => `₺${rowData.total_price?.toFixed(2)}`} />
                    <Column header="İşlemler" body={(rowData, index) => itemActionTemplate(rowData, index)} 
                      style={{ width: '100px' }} />
                  </DataTable>
                )}
              </div>

              {/* Billing Summary */}
              <div className="col-12 md:col-6">
                <label htmlFor="tax_rate" className="block text-sm font-medium mb-2">
                  Vergi Oranı (%)
                </label>
                <InputNumber
                  id="tax_rate"
                  value={repair.tax_rate}
                  onValueChange={(e) =>
                    setRepair((prev) => {
                      const newTaxRate = e.value || 0;
                      const subtotal = prev.subtotal;
                      const taxAmount = subtotal * (newTaxRate / 100);
                      const grandTotal = subtotal + taxAmount;
                      return {
                        ...prev,
                        tax_rate: newTaxRate,
                        tax_amount: taxAmount,
                        grand_total: grandTotal,
                      };
                    })}
                  min={0}
                  max={100}
                  suffix="%"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="notes" className="block text-sm font-medium mb-2">
                  Notlar
                </label>
                <InputTextarea
                  id="notes"
                  value={repair.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Ek notlar girin"
                  rows={2}
                  className="w-full"
                />
              </div>

              {/* Totals */}
              <div className="col-12">
                <Card className="bg-gray-50">
                  <div className="grid">
                    <div className="col-12 md:col-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Ara Toplam:</div>
                        <div className="text-lg font-semibold">₺{repair.subtotal?.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="col-12 md:col-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Vergi (%{repair.tax_rate}):</div>
                        <div className="text-lg font-semibold">₺{repair.tax_amount?.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="col-12 md:col-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Genel Toplam:</div>
                        <div className="text-xl font-bold text-green-600">₺{repair.grand_total?.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="col-12 md:col-3 flex align-items-end justify-content-end">
                      <Button
                        type="submit"
                        label={isEditMode ? 'Tamiri Güncelle' : 'Tamir Oluştur'}
                        icon="pi pi-check"
                        loading={loading}
                        className="p-button-success"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </form>
        </Card>
      </div>
      <Toast ref={toast} />
    </div>
  );
};

export default CarRepairForm; 