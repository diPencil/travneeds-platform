'use client';

import { useState, useEffect } from 'react';
import {
  Boxes,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Server,
  Layers,
  Sparkles,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card, AdminStat, AdminStats, AdminText } from '@/components/admin/admin-ui';
import { PageHead } from '@/components/admin/admin-shell';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/lib/use-current-user';

export default function AddonsPage() {
  const { user } = useCurrentUser();
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') ?? false;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationResult, setActivationResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const loadState = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/addons');
      if (!res.ok) throw new Error('Failed to load Add-ons state');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput.trim() || activating) return;

    setActivating(true);
    setActivationResult(null);

    try {
      const res = await fetch('/api/admin/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseKeyInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setActivationResult({
          success: false,
          message: json.message || json.error || 'Activation failed',
        });
      } else {
        setActivationResult({
          success: true,
          message: json.message || 'License updated successfully',
        });
        loadState();
      }
    } catch (err: any) {
      setActivationResult({
        success: false,
        message: err.message || 'Connection error',
      });
    } finally {
      setActivating(false);
    }
  };

  const stats: AdminStat[] = [
    {
      label: <AdminText en="Installed Modules" ar="الوحدات المثبتة" />,
      value: data?.modules?.length ?? '—',
      note: <AdminText en="Registered in catalogue" ar="مسجلة في الكتالوج" />,
      icon: Boxes,
      tone: 'blue',
    },
    {
      label: <AdminText en="Active Core" ar="النظام الأساسي" />,
      value: data?.modules?.filter((m: any) => m.isCore).length ?? '—',
      note: <AdminText en="Essential platform services" ar="خدمات المنصة الحيوية" />,
      icon: ShieldCheck,
      tone: 'green',
    },
    {
      label: <AdminText en="Available Add-ons" ar="الإضافات المتاحة" />,
      value: data?.modules?.filter((m: any) => m.lifecycle === 'available_for_subscription').length ?? '—',
      note: <AdminText en="Ready for commercial license" ar="جاهزة للترخيص التجاري" />,
      icon: Sparkles,
      tone: 'orange',
    },
    {
      label: <AdminText en="License Status" ar="حالة الترخيص" />,
      value: data?.license?.status ? data.license.status.toUpperCase() : 'COMMERCIAL TRIAL',
      note: data?.serverStatus?.configured ? 'License Server Connected' : 'Central Server Not Configured',
      icon: KeyRound,
      tone: data?.license ? 'green' : 'violet',
    },
  ];

  return (
    <div className="sp-page-body">
      <PageHead
        eyebrow="System & Commercial"
        title="Add-ons & Modules"
        titleAr="الإضافات والوحدات"
        sub="Manage commercial software licenses, platform features, and modular Add-ons."
        subAr="إدارة التراخيص التجارية للبرنامج وميزات المنصة والإضافات المستقلة."
      />

      <AdminStats items={stats} />

      {/* License Status & Activation Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '20px', marginTop: '20px' }}>
        <Card
          title={<AdminText en="Commercial License & Identity" ar="الترخيص التجاري وهوية التثبيت" />}
          sub={<AdminText en="Cryptographically verified installation identity" ar="هوية التثبيت المعتمدة رقمياً" />}
        >
          {loading ? (
            <p style={{ padding: '16px', color: 'var(--muted)' }}>Loading license details...</p>
          ) : (
            <div style={{ display: 'grid', gap: '14px', padding: '6px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Installation ID:</span>
                <strong style={{ fontFamily: 'monospace', fontSize: '12.5px', color: 'var(--blue)' }}>
                  {data?.installation?.installationId}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Customer / Domain:</span>
                <span style={{ fontSize: '13px' }}>{data?.installation?.customerName} ({data?.installation?.domain})</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Active Edition:</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{data?.license?.edition || 'TravNeeds Standalone Community'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Verification Server:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: data?.serverStatus?.configured ? '#15803d' : '#b45309' }}>
                  <Server size={14} />
                  {data?.serverStatus?.endpoint}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* License Key Activation Card */}
        <Card
          title={<AdminText en="Activate License Key" ar="تفعيل مفتاح الترخيص" />}
          sub={<AdminText en="Submit digital serial key for activation" ar="إدخال المفتاح الرقمي للتفعيل" />}
        >
          {isSuperAdmin ? (
            <form onSubmit={handleActivate} style={{ display: 'grid', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                <span>License Serial Key:</span>
                <input
                  type="text"
                  placeholder="TRV-XXXX-XXXX-XXXX"
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value)}
                  disabled={activating}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                  }}
                />
              </label>

              <button
                type="submit"
                disabled={activating || !licenseKeyInput.trim()}
                className="sp-btn primary"
                style={{ justifySelf: 'start', minHeight: '36px', padding: '0 18px', fontSize: '13px' }}
              >
                {activating ? 'Verifying with Central Server...' : 'Activate License'}
              </button>

              {activationResult && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: activationResult.success ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${activationResult.success ? '#bbf7d0' : '#fecaca'}`,
                    color: activationResult.success ? '#166534' : '#991b1b',
                  }}
                >
                  {activationResult.success ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
                  <span>{activationResult.message}</span>
                </div>
              )}
            </form>
          ) : (
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', fontSize: '12.5px', color: 'var(--muted)' }}>
              <Info size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
              Only Super Administrators hold permission to manage license keys and activation.
            </div>
          )}
        </Card>
      </div>

      {/* Modules & Add-ons Grid */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px' }}>
          Platform Modules & Add-ons Catalogue
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {data?.modules?.map((mod: any) => {
            const isPlanned = mod.lifecycle === 'planned';
            const isAvailable = mod.lifecycle === 'available_for_subscription';

            return (
              <div
                key={mod.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: mod.isCore ? '#eff6ff' : isAvailable ? '#fff7ed' : '#f1f5f9',
                          color: mod.isCore ? '#1d4ed8' : isAvailable ? '#c2410c' : '#64748b',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Layers size={17} />
                      </span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                          {mod.displayName?.en || mod.name}
                        </h4>
                        <small style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {mod.category.replace('_', ' ')} · v{mod.version}
                        </small>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '999px',
                        background: mod.isCore ? '#dcfce7' : isAvailable ? '#dbeafe' : '#f1f5f9',
                        color: mod.isCore ? '#166534' : isAvailable ? '#1e40af' : '#475569',
                      }}
                    >
                      {mod.isCore ? 'CORE' : isAvailable ? 'AVAILABLE' : 'PLANNED'}
                    </span>
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: '1.5', margin: '10px 0 14px' }}>
                    {mod.description?.en}
                  </p>

                  {/* Feature Breakdown */}
                  {mod.features?.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                        Features Included:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {mod.features.map((f: any) => (
                          <span
                            key={f.key}
                            style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {f.name?.en}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Required Dependencies */}
                  {mod.requiredDependencies?.length > 0 && (
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '6px' }}>
                      Requires: <strong>{mod.requiredDependencies.join(', ')}</strong>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: mod.isLicensed ? '#15803d' : '#64748b' }}>
                    {mod.isLicensed ? '● Licensed & Active' : isPlanned ? '○ Development Planned' : '○ Not Licensed'}
                  </span>

                  {mod.isCore ? (
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Always Enabled</span>
                  ) : isAvailable ? (
                    <span style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 600 }}>Commercial Add-on</span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Coming in future update</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
