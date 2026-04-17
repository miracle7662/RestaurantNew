import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppConfig, ConfigTestResult } from '../../types/config';
import type { SubmitHandler } from 'react-hook-form';

/// <reference path="../../global.d.ts" />

const ConfigScreen: React.FC = () => {
  const navigate = useNavigate();
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<ConfigTestResult | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [initialConfig, setInitialConfig] = useState<AppConfig | null>(null);


  const { register, handleSubmit, formState: { errors }, setValue } = useForm<AppConfig>({
    defaultValues: {
      serverIP: 'localhost',
      port: 3001,
      dbHost: 'localhost',
      dbPort: 3306,
      dbName: 'restaurant_db',
      dbUser: 'root',
      dbPass: '',
    },
  });

  // Load existing config on mount
  React.useEffect(() => {
    if ((window as any).electronAPI?.loadConfig) {
      (window as any).electronAPI.loadConfig()
        .then((config: AppConfig) => {
          if (config) {
            setInitialConfig(config);
            // Set form values
            Object.entries(config).forEach(([key, value]) => {
              (setValue as any)(key as keyof AppConfig, value);
            });
          }
        })
        .catch(console.error);
    }
  }, [setValue]);

  const onTestConnection: SubmitHandler<AppConfig> = async (data) => {
    setTesting(true);
    setConnectionStatus('idle');
    try {
      const result = await (window as any).electronAPI.testConfig(data);
      setTestResult(result);
      if (result.success) {
        setConnectionStatus('success');
        toast.success(`Connected to ${result.apiUrl}`);
      } else {
        setConnectionStatus('error');
        toast.error(result.error || 'Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Test failed');
    } finally {
      setTesting(false);
    }
  };

  const onSaveConfig: SubmitHandler<AppConfig> = async (data) => {
    if (connectionStatus !== 'success') {
      toast.error('Please test connection first');
      return;
    }
    setSaving(true);
    try {
      const saveResult = await (window as any).electronAPI.saveConfig(data);
      if (saveResult.success) {
        localStorage.setItem('configDone', 'true');
        toast.success('Config saved! Redirecting to login...');
        setTimeout(() => navigate('/auth/minimal/login'), 1500);
      } else {
        toast.error(saveResult.error || 'Save failed');
      }
    } catch (error) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="account-pages pt-2 pt-sm-5 pb-4 pb-sm-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xxl-4 col-lg-5">
            <div className="card overflow-hidden">
              <div className="position-relative bg-primary bg-soft">
                <div className="d-flex flex-column align-items-center">
                  <div className="avatar-md py-5">
                    <div className="avatar-title bg-light rounded-circle text-primary h1 mb-0">
                      <i className="bx bxs-cog"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                <h4 className="text-center py-2">Server Configuration</h4>
                <p className="text-muted text-center mb-4">Configure your backend server and database</p>

                <form onSubmit={handleSubmit(connectionStatus === 'success' ? onSaveConfig : onTestConnection)}>
                  
                  <div className="mb-3">
                    <label className="form-label">Server IP/Hostname <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className={`form-control ${errors.serverIP ? 'is-invalid' : ''}`}
                      placeholder="localhost or 192.168.1.100"
                      {...register('serverIP', { required: 'Server IP required' })}
                    />
                    {errors.serverIP && <div className="invalid-feedback">{errors.serverIP.message}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Server Port <span className="text-danger">*</span></label>
                    <input 
                      type="number" 
                      className={`form-control ${errors.port ? 'is-invalid' : ''}`}
                      {...register('port', { required: 'Port required', valueAsNumber: true, min: 1, max: 65535 })}
                    />
                    {errors.port && <div className="invalid-feedback">{errors.port.message}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Database Host</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="localhost or remote DB IP"
                      {...register('dbHost')}
                    />
                  </div>

                  <div className="row">
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">DB Port</label>
                        <input 
                          type="number" 
                          className="form-control"
                          defaultValue={3306}
                          {...register('dbPort', { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Database Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          defaultValue="restaurant_db"
                          {...register('dbName')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">DB Username</label>
                    <input 
                      type="text" 
                      className="form-control"
                      {...register('dbUser')}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">DB Password</label>
                    <input 
                      type="password" 
                      className="form-control"
                      {...register('dbPass')}
                    />
                  </div>

                  {testResult && (
                    <div className={`alert ${connectionStatus === 'success' ? 'alert-success' : 'alert-danger'} mb-4`}>
                      <strong>{connectionStatus === 'success' ? '✅ Connected!' : '❌ Failed'}</strong>
                      {testResult.apiUrl && <div>API: {testResult.apiUrl}</div>}
                      {testResult.error && <div>{testResult.error}</div>}
                    </div>
                  )}

                  <div className="d-grid">
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={testing || saving}
                    >
                      {testing ? 'Testing...' : (connectionStatus === 'success' ? 'Save & Continue' : 'Test Connection')}
                    </button>
                  </div>
                </form>

                <div className="mt-4 text-center">
                  <p className="mb-0">
                    Already configured? <a href="#!" onClick={() => navigate('/auth/minimal/login')}>Go to Login</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigScreen;

