import { useState, useEffect, useCallback } from 'react';

interface HealthData {
  status: string;
  service: string;
}

interface SyntheticSampleApplicant {
  id: string;
  ref: string;
  name: string;
  country: string;
  riskScore: number;
  kycStatus: string;
}

const SAMPLE_SYNTHETIC_DATA: SyntheticSampleApplicant[] = [
  {
    id: 'syn-app-001',
    ref: 'APP-1001-SYNTH',
    name: 'Alex Sample River',
    country: 'Country-X',
    riskScore: 12,
    kycStatus: 'VERIFIED',
  },
  {
    id: 'syn-app-002',
    ref: 'APP-1002-SYNTH',
    name: 'Jordan Demo Taylor',
    country: 'Country-Y',
    riskScore: 78,
    kycStatus: 'FLAGGED',
  },
];

export function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: HealthData = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setHealth(data);
      setLatency(elapsed);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to backend');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <div className="app-container">
      {/* Navigation / Header */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-icon">🛡️</div>
          <div>
            <h1 className="brand-title">Multi-Agent Onboarding Case Reviewer</h1>
            <p className="brand-subtitle">Banking Domain Case Intelligence & Automated Verification</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="badge badge-synth">
            <span className="status-dot"></span>
            Synthetic Data Only
          </span>
          <span className={`badge ${health ? 'badge-healthy' : error ? 'badge-error' : 'badge-pending'}`}>
            <span className={`status-dot ${loading ? 'pulse' : ''}`}></span>
            {loading ? 'Checking...' : health ? 'Backend Online' : 'Backend Offline'}
          </span>
        </div>
      </header>

      {/* Health Monitoring Card */}
      <section className="health-monitor">
        <div className="card">
          <div className="health-banner-header">
            <div className="health-banner-title">
              <span>🔌 Backend Connectivity</span>
              <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GET /api/health</code>
            </div>
            <button
              id="refresh-health-btn"
              className="button-primary"
              onClick={checkHealth}
              disabled={loading}
            >
              {loading ? 'Pinging...' : 'Ping Health API'}
            </button>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Vite development proxy connects <code>/api/*</code> on port 5173 to the Node.js Express service on port 5000.
          </p>

          <div className="response-box">
            {loading && !health ? (
              <span>Connecting to backend service...</span>
            ) : error ? (
              <span style={{ color: 'var(--accent-rose)' }}>Error: {error}</span>
            ) : (
              <pre>{JSON.stringify(health, null, 2)}</pre>
            )}
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Service Telemetry</h2>
          <div className="stats-grid">
            <div className="stat-tile">
              <div className="stat-label">Response Status</div>
              <div className="stat-value" style={{ color: health ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {health?.status ? health.status.toUpperCase() : 'N/A'}
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Latency</div>
              <div className="stat-value">
                {latency !== null ? `${latency}ms` : '--'}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Last checked: {lastChecked || 'Not yet checked'}
          </div>
        </div>
      </section>

      {/* Multi-Agent Architecture Overview */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 className="section-title">
          <span>🤖 Multi-Agent Review Architecture</span>
        </h2>
        <div className="agents-grid">
          <div className="card agent-card">
            <div className="agent-card-header">
              <div className="agent-card-icon">🪪</div>
              <div className="agent-card-name">Identity Verification Agent</div>
            </div>
            <p className="agent-card-desc">
              Performs synthetic KYC parsing, applicant identity verification, and synthetic credential validation.
            </p>
            <div className="agent-status-label">
              <span>Status</span>
              <span className="badge badge-pending">Scaffolded</span>
            </div>
          </div>

          <div className="card agent-card">
            <div className="agent-card-header">
              <div className="agent-card-icon">📊</div>
              <div className="agent-card-name">Risk Assessment Agent</div>
            </div>
            <p className="agent-card-desc">
              Evaluates credit score signals, synthetic income verification, and deterministic rule-based risk profiling.
            </p>
            <div className="agent-status-label">
              <span>Status</span>
              <span className="badge badge-pending">Scaffolded</span>
            </div>
          </div>

          <div className="card agent-card">
            <div className="agent-card-header">
              <div className="agent-card-icon">⚖️</div>
              <div className="agent-card-name">Compliance Screening Agent</div>
            </div>
            <p className="agent-card-desc">
              Screens synthetic applicant profiles against simulated sanctions and synthetic PEP restriction lists.
            </p>
            <div className="agent-status-label">
              <span>Status</span>
              <span className="badge badge-pending">Scaffolded</span>
            </div>
          </div>

          <div className="card agent-card">
            <div className="agent-card-header">
              <div className="agent-card-icon">🧠</div>
              <div className="agent-card-name">Orchestrator Engine</div>
            </div>
            <p className="agent-card-desc">
              Coordinates multi-agent consensus, logs deterministic audit trails, and stores case outcomes in SQLite.
            </p>
            <div className="agent-status-label">
              <span>Status</span>
              <span className="badge badge-pending">Scaffolded</span>
            </div>
          </div>
        </div>
      </section>

      {/* Synthetic Cases Preview */}
      <section>
        <h2 className="section-title">
          <span>📋 Synthetic Onboarding Cases (Seed Preview)</span>
        </h2>
        <div className="card" style={{ padding: '0.5rem 1rem 1rem' }}>
          <table className="cases-table">
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Synthetic Name</th>
                <th>Jurisdiction</th>
                <th>Risk Score</th>
                <th>Synthetic KYC</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_SYNTHETIC_DATA.map((item) => (
                <tr key={item.id}>
                  <td><code>{item.ref}</code></td>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>{item.country}</td>
                  <td>
                    <span style={{
                      fontWeight: 600,
                      color: item.riskScore > 50 ? 'var(--accent-rose)' : 'var(--accent-emerald)'
                    }}>
                      {item.riskScore} / 100
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${item.kycStatus === 'VERIFIED' ? 'badge-healthy' : 'badge-synth'}`}>
                      {item.kycStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="app-footer">
        Multi-Agent Onboarding Case Reviewer • React + Vite + Express + SQLite (better-sqlite3) • Technical Assessment Scaffold
      </footer>
    </div>
  );
}

export default App;
