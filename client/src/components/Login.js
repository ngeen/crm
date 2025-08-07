import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { useAuth } from '../contexts/AuthContext';
import { useRef } from 'react';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(credentials);
      if (result.success) {
        navigate('/dashboard');
      } else {
        showToast('error', 'Login Failed', result.error);
      }
    } catch (error) {
      showToast('error', 'Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail });
  };

  return (
    <div className="flex justify-content-center align-items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <Card>
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Sanayi CRM</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="p-fluid">
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <InputText
                id="username"
                value={credentials.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="Enter your username"
                required
                className="w-full"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <Password
                id="password"
                value={credentials.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full"
                feedback={false}
                toggleMask
              />
            </div>

            <Button
              type="submit"
              label="Sign In"
              icon="pi pi-sign-in"
              loading={loading}
              className="w-full"
            />
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Demo credentials: admin / admin123
            </p>
          </div>
        </Card>
      </div>
      <Toast ref={toast} />
    </div>
  );
};

export default Login; 