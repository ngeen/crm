import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useRef();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'active',
    notes: ''
  });

  const statusOptions = [
    { label: 'Aktif', value: 'active' },
    { label: 'Pasif', value: 'inactive' },
    { label: 'Potansiyel', value: 'lead' }
  ];

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
      } else {
        showToast('error', 'Hata', 'Müşteri bilgileri getirilemedi');
        navigate('/dashboard/customers');
      }
    } catch (error) {
      showToast('error', 'Hata', 'Ağ hatası');
      navigate('/dashboard/customers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditMode ? `/api/customers/${id}` : '/api/customers';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(customer),
      });

      if (response.ok) {
        showToast('success', 'Başarılı', 
          isEditMode ? 'Müşteri başarıyla güncellendi' : 'Müşteri başarıyla oluşturuldu');
        navigate('/dashboard/customers');
      } else {
        const errorData = await response.json();
        showToast('error', 'Hata', errorData.error || 'Müşteri kaydedilemedi');
      }
    } catch (error) {
      showToast('error', 'Hata', 'Ağ hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setCustomer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail });
  };

  const handleCancel = () => {
    navigate('/dashboard/customers');
  };

  return (
    <div className="flex justify-content-center">
      <div className="w-full max-w-2xl">
        <Card>
          <div className="flex justify-content-between align-items-center mb-4">
            <h2 className="text-2xl font-bold m-0">
              {isEditMode ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}
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
              <div className="col-12 md:col-6">
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  İsim *
                </label>
                <InputText
                  id="name"
                  value={customer.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Müşteri adını girin"
                  required
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  E-posta
                </label>
                <InputText
                  id="email"
                  type="email"
                  value={customer.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="E-posta adresini girin"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Telefon
                </label>
                <InputText
                  id="phone"
                  value={customer.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Telefon numarasını girin"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="company" className="block text-sm font-medium mb-2">
                  Şirket
                </label>
                <InputText
                  id="company"
                  value={customer.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  placeholder="Şirket adını girin"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label htmlFor="status" className="block text-sm font-medium mb-2">
                  Durum
                </label>
                <Dropdown
                  id="status"
                  value={customer.status}
                  options={statusOptions}
                  onChange={(e) => handleChange('status', e.value)}
                  placeholder="Durum seçin"
                  className="w-full"
                />
              </div>

              <div className="col-12">
                <label htmlFor="notes" className="block text-sm font-medium mb-2">
                  Notlar
                </label>
                <InputTextarea
                  id="notes"
                  value={customer.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Ek notlar girin"
                  rows={4}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-content-end gap-3 mt-4">
              <Button
                type="button"
                label="İptal"
                className="p-button-outlined"
                onClick={handleCancel}
                disabled={loading}
              />
              <Button
                type="submit"
                label={isEditMode ? 'Müşteriyi Güncelle' : 'Müşteri Oluştur'}
                icon="pi pi-check"
                loading={loading}
              />
            </div>
          </form>
        </Card>
      </div>
      <Toast ref={toast} />
    </div>
  );
};

export default CustomerForm; 