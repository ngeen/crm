import React, { useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const menuItems = [
    {
      label: 'Kontrol Paneli',
      icon: 'pi pi-home',
      command: () => navigate('/dashboard')
    },
    {
      label: 'Müşteriler',
      icon: 'pi pi-users',
      command: () => navigate('/dashboard/customers')
    },
    {
      label: 'Araç Tamirleri',
      icon: 'pi pi-wrench',
      command: () => navigate('/dashboard/car-repairs')
    },
    {
      label: 'İşler',
      icon: 'pi pi-briefcase',
      command: () => navigate('/dashboard/deals')
    },
    {
      label: 'Raporlar',
      icon: 'pi pi-chart-bar',
      command: () => navigate('/dashboard/reports')
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex justify-content-between align-items-center px-4 py-3">
          <div className="flex align-items-center">
            <Button
              icon="pi pi-bars"
              className="p-button-text p-button-rounded mr-3"
              onClick={() => setSidebarVisible(true)}
            />
            <h1 className="text-xl font-semibold text-gray-800 m-0">Sanayi CRM</h1>
          </div>
          
          <div className="flex align-items-center">
            <div className="flex align-items-center mr-3">
              <Avatar
                label={user?.name?.charAt(0) || user?.username?.charAt(0)}
                size="normal"
                shape="circle"
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">{user?.name || user?.username}</span>
            </div>
            <Button
              icon="pi pi-sign-out"
              className="p-button-text p-button-rounded p-button-danger"
              onClick={handleLogout}
              tooltip="Çıkış Yap"
            />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        position="left"
        onHide={() => setSidebarVisible(false)}
        className="w-20rem"
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Navigasyon</h2>
          <Menu model={menuItems} className="w-full" />
        </div>
      </Sidebar>

      {/* Main Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default Layout; 