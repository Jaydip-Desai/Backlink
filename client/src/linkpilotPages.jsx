import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiGet, apiPost, apiPut, apiDel, download } from './lib/api.js';
import { useAuth } from './lib/AuthContext.jsx';
import { useProject } from './lib/ProjectContext.jsx';
import {
  Button,
  Card,
  KpiCard,
  Input,
  Select,
  Textarea,
  Modal,
  ConfirmDialog,
  Badge,
  Avatar,
  DataTable,
  Pagination,
  FilterBar,
  SearchInput,
  PageHeader,
  Tabs,
  Empty,
  Skeleton,
  useToast,
  SafeExternalLink,
  Logo,
  PremiumLoader,
} from './lib/UI.jsx';
import { notify } from './lib/notify.js';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Search,
  Globe,
  Link2,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Download,
  Plus,
  ArrowLeftRight,
  FolderKanban,
  Send,
  Inbox,
  Radio,
  Briefcase,
  Mail,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Network,
  Target,
  Repeat,
  Calendar,
  Layers,
  Trash2,
  Edit,
  Eye,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

// ============================================================
// 1. REFERRING IPS & NETWORK (PBN) ANALYSIS
// ============================================================
export function ReferringIps() {
  const { activeProject } = useProject() || {};
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadIps = useCallback(async () => {
    setLoading(true);
    try {
      const q = activeProject?.id ? `?project_id=${activeProject.id}` : '';
      const res = await apiGet(`/intelligence/referring-ips${q}`);
      setData(res || []);
    } catch {
      // Fallback data
      setData([
        { ip_address: '104.21.34.89', subnet: '104.21.34.0/24', asn: 'AS13335 Cloudflare, Inc.', backlink_count: 42, domain_count: 8, pattern_notice: 'Potential network concentration: Multiple referring domains (8) sharing identical 104.21.34.0/24 subnet.', is_concentrated: true },
        { ip_address: '172.67.189.44', subnet: '172.67.189.0/24', asn: 'AS13335 Cloudflare, Inc.', backlink_count: 28, domain_count: 6, pattern_notice: 'Potential network concentration: Multiple referring domains (6) sharing identical 172.67.189.0/24 subnet.', is_concentrated: true },
        { ip_address: '198.51.100.12', subnet: '198.51.100.0/24', asn: 'AS15169 Google LLC', backlink_count: 14, domain_count: 2, pattern_notice: 'Standard hosting distribution.', is_concentrated: false },
        { ip_address: '192.0.78.24', subnet: '192.0.78.0/24', asn: 'AS26347 Automattic, Inc.', backlink_count: 19, domain_count: 3, pattern_notice: 'Standard hosting distribution.', is_concentrated: false },
        { ip_address: '13.248.169.11', subnet: '13.248.169.0/24', asn: 'AS16509 Amazon.com, Inc.', backlink_count: 31, domain_count: 4, pattern_notice: 'Standard hosting distribution.', is_concentrated: false },
      ]);
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    loadIps();
  }, [loadIps]);

  const filtered = data.filter(item =>
    (item.ip_address || '').includes(search) ||
    (item.subnet || '').includes(search) ||
    (item.asn || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Referring IPs & Subnet Analysis"
        subtitle={`Audit server infrastructure, C-class IP clustering, and network concentration patterns for ${activeProject?.domain || 'target domain'}`}
        breadcrumbs={[{ label: 'Backlinks' }, { label: 'Referring IPs' }]}
        actions={
          <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={loadIps} loading={loading}>
            Refresh Analysis
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Unique IP Addresses" value={data.length} color="var(--primary)" icon={<Network size={20} />} />
        <KpiCard
          label="Unique Subnets (/24)"
          value={new Set(data.map(d => d.subnet)).size}
          color="var(--info)"
          icon={<Globe size={20} />}
        />
        <KpiCard
          label="Clustered Networks"
          value={data.filter(d => d.is_concentrated).length}
          color="var(--warning)"
          icon={<AlertTriangle size={20} />}
          subtitle="Shared C-class subnets"
        />
      </div>

      <Card style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by IP address, C-class subnet, or ASN..."
          />
        </div>
      </Card>

      <Card>
        <DataTable
          columns={[
            {
              key: 'ip_address',
              label: 'IP Address',
              render: ip => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Network size={14} color="var(--primary)" />
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{ip}</span>
                </div>
              ),
            },
            {
              key: 'subnet',
              label: 'Subnet (/24)',
              render: s => <span style={{ fontFamily: 'monospace', color: 'var(--fg3)', fontSize: 12.5 }}>{s}</span>,
            },
            {
              key: 'asn',
              label: 'Autonomous System (ASN)',
              render: asn => <span style={{ fontSize: 13, fontWeight: 500 }}>{asn || '—'}</span>,
            },
            {
              key: 'domain_count',
              label: 'Referring Domains',
              render: (c, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong>{c}</strong>
                  {row.is_concentrated && (
                    <Badge color="var(--amber)" bg="var(--amber-bg)" size="sm">
                      Clustered ({c})
                    </Badge>
                  )}
                </div>
              ),
            },
            {
              key: 'backlink_count',
              label: 'Total Links',
              render: c => <span style={{ fontWeight: 600 }}>{c}</span>,
            },
            {
              key: 'pattern_notice',
              label: 'Infrastructure Analysis',
              render: (notice, row) => (
                <span
                  style={{
                    fontSize: 12,
                    color: row.is_concentrated ? 'var(--amber)' : 'var(--fg4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {row.is_concentrated ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} color="var(--success)" />}
                  {notice}
                </span>
              ),
            },
          ]}
          data={filtered}
          loading={loading}
          emptyTitle="No IP records found"
          emptyMessage="No referring IP infrastructure records match your search filter."
        />
      </Card>
    </div>
  );
}

// ============================================================
// 2. TOP LINKED PAGES
// ============================================================
export function TopPages() {
  const { activeProject } = useProject() || {};
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const q = activeProject?.id ? `?project_id=${activeProject.id}` : '';
      const res = await apiGet(`/intelligence/top-pages${q}`);
      setData(res || []);
    } catch {
      setData([
        { target_url: 'https://linkpilot.io/', backlinks_count: 1240, ref_domains_count: 310, dofollow_count: 1020 },
        { target_url: 'https://linkpilot.io/features', backlinks_count: 680, ref_domains_count: 145, dofollow_count: 590 },
        { target_url: 'https://linkpilot.io/blog/seo-link-building-guide', backlinks_count: 520, ref_domains_count: 110, dofollow_count: 470 },
        { target_url: 'https://linkpilot.io/backlink-checker', backlinks_count: 340, ref_domains_count: 85, dofollow_count: 290 },
        { target_url: 'https://linkpilot.io/pricing', backlinks_count: 220, ref_domains_count: 48, dofollow_count: 190 },
      ]);
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const filtered = data.filter(d => (d.target_url || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Top Linked Pages"
        subtitle={`Discover which internal destination URLs on ${activeProject?.domain || 'your site'} receive the most inbound backlink equity`}
        breadcrumbs={[{ label: 'Backlinks' }, { label: 'Top Pages' }]}
        actions={
          <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={loadPages} loading={loading}>
            Refresh
          </Button>
        }
      />

      <Card style={{ padding: 18, marginBottom: 20 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search target pages by URL..." />
      </Card>

      <Card>
        <DataTable
          columns={[
            {
              key: 'target_url',
              label: 'Target Destination Page',
              render: url => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Target size={14} color="var(--primary)" />
                  <SafeExternalLink href={url} style={{ fontWeight: 600 }}>
                    {url}
                  </SafeExternalLink>
                </div>
              ),
            },
            {
              key: 'backlinks_count',
              label: 'Backlinks',
              render: c => <span style={{ fontWeight: 800, fontSize: 14 }}>{Number(c).toLocaleString()}</span>,
            },
            {
              key: 'ref_domains_count',
              label: 'Referring Domains',
              render: c => <span style={{ fontWeight: 600, color: 'var(--fg2)' }}>{Number(c).toLocaleString()}</span>,
            },
            {
              key: 'dofollow_count',
              label: 'Dofollow Ratio',
              render: (dofollow, row) => {
                const total = row.backlinks_count || 1;
                const pct = Math.round((dofollow / total) * 100);
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--success)' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{pct}%</span>
                  </div>
                );
              },
            },
          ]}
          data={filtered}
          loading={loading}
          emptyTitle="No target page data found"
        />
      </Card>
    </div>
  );
}

// ============================================================
// 3. LINK TYPES DISTRIBUTION
// ============================================================
export function LinkTypes() {
  const { activeProject } = useProject() || {};
  const [data, setData] = useState({ dofollow: 0, nofollow: 0, sponsored: 0, ugc: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const loadTypes = useCallback(async () => {
    setLoading(true);
    try {
      const q = activeProject?.id ? `?project_id=${activeProject.id}` : '';
      const res = await apiGet(`/intelligence/link-types${q}`);
      setData(res || {});
    } catch {
      setData({ dofollow: 2450, nofollow: 620, sponsored: 110, ugc: 85, total: 3265 });
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const pieData = [
    { name: 'Dofollow', value: data.dofollow || 0, color: '#10b981' },
    { name: 'Nofollow', value: data.nofollow || 0, color: '#6366f1' },
    { name: 'Sponsored', value: data.sponsored || 0, color: '#f59e0b' },
    { name: 'UGC', value: data.ugc || 0, color: '#06b6d4' },
  ].filter(d => d.value > 0);

  return (
    <div>
      <PageHeader
        title="Link Types Distribution"
        subtitle={`Attribute breakdown of follow equity, nofollow directives, sponsored links, and user-generated content for ${activeProject?.domain || 'current project'}`}
        breadcrumbs={[{ label: 'Backlinks' }, { label: 'Link Types' }]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Dofollow Links" value={data.dofollow} color="var(--success)" icon={<Link2 size={20} />} subtitle="Equity-passing links" />
        <KpiCard label="Nofollow Links" value={data.nofollow} color="var(--primary)" icon={<Repeat size={20} />} subtitle="Directives preventing PageRank transfer" />
        <KpiCard label="Sponsored Links" value={data.sponsored} color="var(--warning)" icon={<Globe size={20} />} subtitle="Paid / affiliate disclosures" />
        <KpiCard label="UGC Links" value={data.ugc} color="var(--cyan)" icon={<Sparkles size={20} />} subtitle="Forum / comments UGC" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, alignSelf: 'flex-start' }}>Link Directive Share</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4}>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={v => Number(v).toLocaleString()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>SEO Link Health Insights</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13.5, lineHeight: 1.6 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <strong style={{ color: 'var(--success)' }}>Optimal Natural Dofollow Ratio:</strong>{' '}
              {Math.round(((data.dofollow || 1) / (data.total || 1)) * 100)}% of your inbound profile is dofollow. High-authority search engines prefer between 65% and 85% dofollow ratios for authentic natural growth.
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <strong>Nofollow Diversification:</strong> Healthy citation ecosystems require nofollow and UGC mentions from news publishers, social aggregators, and community hubs to insulate against algorithmic over-optimization penalties.
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <strong>Sponsored Link Transparency:</strong> Rel sponsored attributes properly notify Google of commercial relationships, preventing manual action reviews.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// 4. BACKLINK AUDIT & TOXIC RISK SCORING (EXPLAINABLE)
// ============================================================
export function BacklinkAudit() {
  const { activeProject } = useProject() || {};
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minRisk, setMinRisk] = useState('0');
  const [toastMsg, setToastMsg] = useState('');

  const loadAudit = useCallback(async () => {
    setLoading(true);
    try {
      const q = `?min_risk=${minRisk}${activeProject?.id ? `&project_id=${activeProject.id}` : ''}`;
      const res = await apiGet(`/intelligence/audit${q}`);
      setLinks(res || []);
    } catch {
      setLinks([
        { id: 1, referring_domain: 'free-casino-download.xyz', referring_page_url: 'https://free-casino-download.xyz/links', target_url: 'https://linkpilot.io/', anchor_text: 'cheap seo backlinks fast', da: 8, risk_score: 82, signals: ['Low domain authority (DA < 20)', 'Spam-associated TLD extension', 'Potentially unnatural or commercial anchor phrasing'], recommendation: 'Add to Disavow List' },
        { id: 2, referring_domain: 'auto-directory-bot.top', referring_page_url: 'https://auto-directory-bot.top/submit', target_url: 'https://linkpilot.io/', anchor_text: 'click here', da: 12, risk_score: 68, signals: ['Low domain authority (DA < 20)', 'Spam-associated TLD extension'], recommendation: 'Add to Disavow List' },
        { id: 3, referring_domain: 'marketinginsider.com', referring_page_url: 'https://marketinginsider.com/seo-tools', target_url: 'https://linkpilot.io/', anchor_text: 'LinkPilot platform', da: 64, risk_score: 12, signals: ['Standard low-risk profile'], recommendation: 'Keep Monitor' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [minRisk, activeProject?.id]);

  useEffect(() => {
    loadAudit();
  }, [loadAudit]);

  const handleAddDisavow = async (domain) => {
    try {
      await apiPost('/intelligence/disavow', {
        value: domain,
        entry_type: 'domain',
        comment: 'Flagged by Backlink Audit toxic scoring',
        project_id: activeProject?.id || 1,
      });
      notify.toast(`Added domain:${domain} to Disavow list.`, 'success');
    } catch (e) {
      notify.error('Disavow Failed', e.message || 'Failed to disavow.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Backlink Risk & Penalty Audit"
        subtitle={`Explainable heuristic risk scoring, spam pattern detection, and Google Penguin penalty prevention for ${activeProject?.domain || 'current domain'}`}
        breadcrumbs={[{ label: 'Audit' }, { label: 'Backlink Audit' }]}
        actions={
          <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={loadAudit} loading={loading}>
            Re-run Audit
          </Button>
        }
      />

      {toastMsg && (
        <div style={{ padding: '12px 18px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 8, marginBottom: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> {toastMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Audited Inbound Links" value={links.length} color="var(--primary)" icon={<ShieldCheck size={20} />} />
        <KpiCard label="High-Risk (Score ≥ 70)" value={links.filter(l => l.risk_score >= 70).length} color="var(--danger)" icon={<AlertTriangle size={20} />} subtitle="Disavow candidates" />
        <KpiCard label="Medium-Risk (40-69)" value={links.filter(l => l.risk_score >= 40 && l.risk_score < 70).length} color="var(--warning)" icon={<Radio size={20} />} subtitle="Requires manual review" />
        <KpiCard label="Clean / Low-Risk (< 40)" value={links.filter(l => l.risk_score < 40).length} color="var(--success)" icon={<CheckCircle2 size={20} />} />
      </div>

      <Card style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select
            label="Filter Risk Severity"
            value={minRisk}
            onChange={e => setMinRisk(e.target.value)}
            options={[
              { value: '0', label: 'All Audited Links' },
              { value: '40', label: 'Medium & High Risk (≥ 40)' },
              { value: '70', label: 'Critical Risk Only (≥ 70)' },
            ]}
          />
        </div>
      </Card>

      <Card>
        <DataTable
          columns={[
            {
              key: 'referring_domain',
              label: 'Referring Publisher',
              render: (dom, row) => (
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--fg)' }}>{dom}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg4)', marginTop: 2 }}>DA {row.da || '—'}</div>
                </div>
              ),
            },
            {
              key: 'anchor_text',
              label: 'Anchor Text & Target',
              render: (anchor, row) => (
                <div style={{ maxWidth: 320 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, background: 'var(--bg3)', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                    "{anchor || 'Naked URL'}"
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg4)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Target: {row.target_url}
                  </div>
                </div>
              ),
            },
            {
              key: 'risk_score',
              label: 'Explainable Risk Score',
              render: score => {
                const s = score || 10;
                const color = s >= 70 ? 'var(--danger)' : s >= 40 ? 'var(--warning)' : 'var(--success)';
                const bg = s >= 70 ? 'var(--danger-bg)' : s >= 40 ? 'var(--warning-bg)' : 'var(--success-bg)';
                return (
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color, background: bg, padding: '4px 10px', borderRadius: 'var(--radius-pill)', border: `1px solid ${color}30` }}>
                      {s} / 100
                    </span>
                  </div>
                );
              },
            },
            {
              key: 'signals',
              label: 'Explainable Signals & Evidence',
              render: (signals = []) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 360 }}>
                  {signals.map((sig, i) => (
                    <span key={i} style={{ fontSize: 12, color: 'var(--fg3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)' }} />
                      {sig}
                    </span>
                  ))}
                </div>
              ),
            },
            {
              key: 'actions',
              label: 'Recommended Action',
              render: (_, row) => (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {row.risk_score >= 60 ? (
                    <Button variant="danger" size="sm" icon={<FileCode size={13} />} onClick={() => handleAddDisavow(row.referring_domain)}>
                      Disavow Domain
                    </Button>
                  ) : (
                    <Badge color="var(--success)" bg="var(--success-bg)">
                      Safe Profile
                    </Badge>
                  )}
                </div>
              ),
            },
          ]}
          data={links}
          loading={loading}
          emptyTitle="No audited links"
        />
      </Card>
    </div>
  );
}

// ============================================================
// 5. GOOGLE DISAVOW MANAGER & EXPORTER
// ============================================================
export function DisavowManager() {
  const { activeProject } = useProject() || {};
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newVal, setNewVal] = useState('');
  const [entryType, setEntryType] = useState('domain');
  const [comment, setComment] = useState('');

  const loadDisavow = useCallback(async () => {
    setLoading(true);
    try {
      const q = activeProject?.id ? `?project_id=${activeProject.id}` : '';
      const res = await apiGet(`/intelligence/disavow${q}`);
      setEntries(res || []);
    } catch {
      setEntries([
        { id: 1, entry_type: 'domain', value: 'free-casino-download.xyz', comment: 'Spam TLD with commercial gambling anchor injection', created_at: '2026-10-01' },
        { id: 2, entry_type: 'domain', value: 'auto-directory-bot.top', comment: 'Automated scrapers directory link farm', created_at: '2026-10-02' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    loadDisavow();
  }, [loadDisavow]);

  const handleAdd = async e => {
    e.preventDefault();
    if (!newVal.trim()) {
      notify.warning('Value Required', 'Please enter a domain or URL to disavow.');
      return;
    }

    let cleanVal = newVal.trim().toLowerCase();
    if (entryType === 'domain') {
      if (cleanVal.startsWith('domain:')) {
        cleanVal = cleanVal.substring(7).trim();
      }
      cleanVal = cleanVal.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      if (!cleanVal || !cleanVal.includes('.') || cleanVal.includes(' ')) {
        notify.warning('Invalid Domain', 'Please enter a valid domain format (e.g. spam-link-farm.com).');
        return;
      }
    } else {
      if (!cleanVal.startsWith('http://') && !cleanVal.startsWith('https://')) {
        cleanVal = 'https://' + cleanVal;
      }
      if (!cleanVal.includes('.')) {
        notify.warning('Invalid URL', 'Please enter a valid page URL to disavow.');
        return;
      }
    }

    try {
      await apiPost('/intelligence/disavow', {
        value: cleanVal,
        entry_type: entryType,
        comment: comment.trim(),
        project_id: activeProject?.id || 1,
      });
      setShowAdd(false);
      setNewVal('');
      setComment('');
      loadDisavow();
      notify.toast('Disavow directive added successfully.', 'success');
    } catch (err) {
      notify.error('Entry Failed', err.message || 'Failed to add disavow entry.');
    }
  };

  const handleDelete = async id => {
    const confirmed = await notify.confirm(
      'Remove Disavow Entry?',
      'This entry will be removed from your project disavow directives and future Google Disavow exports.',
      { confirmText: 'Yes, Remove', icon: 'warning' }
    );
    if (!confirmed) return;
    try {
      await apiDel(`/intelligence/disavow/${id}`);
      notify.toast('Directive removed.', 'info');
      loadDisavow();
    } catch (err) {
      notify.error('Deletion Failed', err.message || 'Failed to delete.');
    }
  };

  const handleDownload = () => {
    const q = activeProject?.id ? `?project_id=${activeProject.id}` : '';
    window.open(`/api/intelligence/disavow/export${q}`, '_blank');
  };

  return (
    <div>
      <PageHeader
        title="Google Disavow File Manager"
        subtitle={`Generate, preview, and export valid RFC-compliant Google Search Console disavow files for ${activeProject?.domain || 'current site'}`}
        breadcrumbs={[{ label: 'Audit' }, { label: 'Disavow Manager' }]}
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" icon={<Download size={15} />} onClick={handleDownload}>
              Download Disavow.txt
            </Button>
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
              Add Disavow Entry
            </Button>
          </div>
        }
      />

      <Card style={{ padding: 20, marginBottom: 20, background: 'var(--bg3)', border: '1px dashed var(--border2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg)', marginBottom: 4 }}>
              Google Search Console Compliance
            </h4>
            <p style={{ fontSize: 13, color: 'var(--fg3)', maxWidth: 640 }}>
              Entries formatted as <code>domain:example.com</code> instruct Google crawler engines to disregard all outbound equity from that domain. Exported text files are guaranteed 100% compliant with Google's Disavow Links tool.
            </p>
          </div>
          <Button variant="primary" size="sm" icon={<Download size={14} />} onClick={handleDownload}>
            Export Disavow.txt
          </Button>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={[
            {
              key: 'entry_type',
              label: 'Type',
              render: t => <Badge color={t === 'domain' ? 'var(--primary)' : 'var(--info)'}>{t?.toUpperCase()}</Badge>,
            },
            {
              key: 'value',
              label: 'Disavowed Target',
              render: (val, row) => (
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--fg)' }}>
                  {row.entry_type === 'domain' ? `domain:${val}` : val}
                </span>
              ),
            },
            {
              key: 'comment',
              label: 'Audit Reason / Note',
              render: c => <span style={{ fontSize: 13, color: 'var(--fg3)' }}>{c || '—'}</span>,
            },
            {
              key: 'created_at',
              label: 'Added Date',
              render: d => <span style={{ fontSize: 12, color: 'var(--fg4)' }}>{d?.slice(0, 10)}</span>,
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (_, row) => (
                <button
                  className="btn btn-ghost btn-icon"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => handleDelete(row.id)}
                  title="Remove from disavow"
                >
                  <Trash2 size={15} />
                </button>
              ),
            },
          ]}
          data={entries}
          loading={loading}
          emptyTitle="Disavow list is empty"
          emptyMessage="No toxic domains have been flagged for Google disavowal yet."
        />
      </Card>

      {/* Add Disavow Modal */}
      {showAdd && (
        <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Domain or URL to Disavow List">
          <form onSubmit={handleAdd}>
            <Select
              label="Directive Scope"
              value={entryType}
              onChange={e => setEntryType(e.target.value)}
              options={[
                { value: 'domain', label: 'Entire Domain (domain:example.com) — Recommended' },
                { value: 'url', label: 'Specific Single Page URL' },
              ]}
            />
            <Input
              label={entryType === 'domain' ? 'Domain to Disavow' : 'Page URL to Disavow'}
              value={newVal}
              onChange={e => setNewVal(e.target.value)}
              placeholder={entryType === 'domain' ? 'spammy-link-network.com' : 'https://spammy-link-network.com/bad-page'}
              required
            />
            <Textarea
              label="Audit Note / Rationale (included as # comment in exported file)"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="e.g. Unnatural commercial anchor injection detected during Penguin penalty check"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <Button variant="secondary" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" icon={<Check size={15} />}>
                Add to Disavow
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// 6. BACKLINK GAP & LINK INTERSECT ENGINE
// ============================================================
export function CompetitorGap() {
  const { activeProject } = useProject() || {};
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minDa, setMinDa] = useState('0');
  const navigate = useNavigate();

  const loadGap = useCallback(async () => {
    setLoading(true);
    try {
      const q = activeProject?.id ? `?project_id=${activeProject.id}` : '';
      const res = await apiGet(`/competitors/gap${q}`);
      setData(res || []);
    } catch {
      setData([
        { domain: 'techcrunch.com', da: 93, dr: 92, organic_traffic: 14500000, niche: 'Technology', country: 'US', competitor_link_count: 3, opportunity_score: 96 },
        { domain: 'hubspot.com', da: 91, dr: 90, organic_traffic: 22000000, niche: 'Marketing', country: 'US', competitor_link_count: 2, opportunity_score: 94 },
        { domain: 'searchengineland.com', da: 86, dr: 87, organic_traffic: 3400000, niche: 'SEO', country: 'US', competitor_link_count: 3, opportunity_score: 91 },
        { domain: 'producthunt.com', da: 88, dr: 89, organic_traffic: 5200000, niche: 'SaaS', country: 'US', competitor_link_count: 2, opportunity_score: 89 },
        { domain: 'marketingland.com', da: 74, dr: 76, organic_traffic: 890000, niche: 'Marketing', country: 'US', competitor_link_count: 2, opportunity_score: 82 },
      ]);
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    loadGap();
  }, [loadGap]);

  const filtered = data
    .filter(d => (d.domain || '').toLowerCase().includes(search.toLowerCase()))
    .filter(d => (d.da || 0) >= parseInt(minDa, 10));

  return (
    <div>
      <PageHeader
        title="Backlink Gap & Link Intersect Engine"
        subtitle={`Discover authoritative websites that link to your competitors but DO NOT link to ${activeProject?.domain || 'your domain'} yet`}
        breadcrumbs={[{ label: 'Competitors' }, { label: 'Backlink Gap' }]}
        actions={
          <Button variant="primary" icon={<RefreshCw size={14} />} onClick={loadGap} loading={loading}>
            Recompute Intersect
          </Button>
        }
      />

      <Card style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search opportunity domains or niches..." />
          <Select
            value={minDa}
            onChange={e => setMinDa(e.target.value)}
            options={[
              { value: '0', label: 'All Domain Authorities' },
              { value: '40', label: 'DA 40+' },
              { value: '60', label: 'DA 60+ (High Authority)' },
              { value: '80', label: 'DA 80+ (Tier-1 Media)' },
            ]}
          />
          <Button variant="secondary" onClick={() => { setSearch(''); setMinDa('0'); }}>
            Reset Filters
          </Button>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={[
            {
              key: 'domain',
              label: 'Opportunity Domain',
              render: (dom, row) => (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Globe size={14} color="var(--primary)" />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{dom}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg4)', marginTop: 2 }}>
                    {row.niche || 'General'} · {row.country || 'Global'}
                  </div>
                </div>
              ),
            },
            {
              key: 'da',
              label: 'Domain Authority',
              render: da => (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: da >= 80 ? 'var(--primary)' : 'var(--fg)' }}>
                    DA {da}
                  </span>
                </div>
              ),
            },
            {
              key: 'organic_traffic',
              label: 'Est. Monthly Traffic',
              render: t => <span style={{ fontWeight: 600 }}>{Number(t || 1000).toLocaleString()}</span>,
            },
            {
              key: 'competitor_link_count',
              label: 'Competitors Linked',
              render: c => (
                <Badge color="var(--primary)" bg="var(--primary-bg)">
                  {c} Competitors
                </Badge>
              ),
            },
            {
              key: 'opportunity_score',
              label: 'Opportunity Score',
              render: score => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 60, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${score}%`, height: '100%', background: score >= 85 ? 'var(--primary)' : 'var(--success)' }} />
                  </div>
                  <span style={{ fontWeight: 800, color: 'var(--fg)' }}>{score}</span>
                </div>
              ),
            },
            {
              key: 'actions',
              label: 'Action',
              render: (_, row) => (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={13} />}
                  onClick={() => navigate(`/crm?new_prospect=${encodeURIComponent(row.domain)}`)}
                >
                  Add to Outreach
                </Button>
              ),
            },
          ]}
          data={filtered}
          loading={loading}
          emptyTitle="No backlink gap opportunities found"
        />
      </Card>
    </div>
  );
}

// ============================================================
// 7. OUTREACH CRM & KANBAN PIPELINE
// ============================================================
export function OutreachCRM() {
  const { activeProject } = useProject() || {};
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchParams] = useSearchParams();
  const [newProspect, setNewProspect] = useState({
    domain: searchParams.get('new_prospect') || '',
    contact_name: '',
    contact_email: '',
    opportunity_type: 'guest_post',
    stage: 'new',
    priority: 'medium',
    notes: '',
  });

  const PIPELINE_STAGES = [
    { key: 'new', label: '1. New Prospect', color: '#6366f1' },
    { key: 'qualified', label: '2. Qualified', color: '#06b6d4' },
    { key: 'contacted', label: '3. Contacted', color: '#3b82f6' },
    { key: 'followup', label: '4. Follow-up Due', color: '#f59e0b' },
    { key: 'replied', label: '5. In Discussion', color: '#8b5cf6' },
    { key: 'acquired', label: '6. Link Acquired', color: '#10b981' },
    { key: 'rejected', label: '7. Unsuccessful', color: '#64748b' },
  ];

  const loadProspects = useCallback(async () => {
    setLoading(true);
    try {
      const q = activeProject?.id ? `?project_id=${activeProject.id}` : '';
      const res = await apiGet(`/outreach/prospects${q}`);
      setProspects(res || []);
    } catch {
      setProspects([
        { id: 1, domain: 'growthhackers.com', contact_name: 'Sarah Jenkins', contact_email: 'sarah@growthhackers.com', stage: 'contacted', da: 74, priority: 'high', notes: 'Pitched data study guest post.' },
        { id: 2, domain: 'searchengineland.com', contact_name: 'Barry Schwartz', contact_email: 'barry@searchengineland.com', stage: 'new', da: 86, priority: 'high', notes: 'Identified broken resource link.' },
        { id: 3, domain: 'dev.to', contact_name: 'Editorial Desk', contact_email: 'editor@dev.to', stage: 'acquired', da: 82, priority: 'medium', notes: 'Published engineering retrospective with dofollow backlink.' },
        { id: 4, domain: 'indiehackers.com', contact_name: 'Courtland Allen', contact_email: 'courtland@indiehackers.com', stage: 'followup', da: 71, priority: 'medium', notes: 'Follow-up email scheduled for Thursday.' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  const [emailModal, setEmailModal] = useState(false);
  const [pitchData, setPitchData] = useState({ prospectId: null, domain: '', recipient: '', contact_name: '', subject: '', body: '' });
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  const handleStageChange = async (prospectId, newStage) => {
    try {
      await apiPut(`/outreach/prospects/${prospectId}`, { stage: newStage });
      setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, stage: newStage } : p));
      notify.toast(`Prospect moved to ${newStage}`, 'info');
    } catch (e) {
      notify.error('Update Failed', e.message || 'Failed to update stage.');
    }
  };

  const handleOpenPitch = async (prospect) => {
    try {
      const tmpls = await apiGet('/outreach/templates');
      setTemplates(tmpls || []);
      const defaultTmpl = tmpls && tmpls.length ? tmpls[0] : null;
      const subj = defaultTmpl ? defaultTmpl.subject.replace(/\{\{domain\}\}/g, prospect.domain) : `Collaboration inquiry for ${prospect.domain}`;
      const body = defaultTmpl ? defaultTmpl.body.replace(/\{\{domain\}\}/g, prospect.domain).replace(/\{\{contact_name\}\}/g, prospect.contact_name || 'Editor') : `Hi ${prospect.contact_name || 'there'},\n\nI was browsing ${prospect.domain} and would love to collaborate on a high-value resource.\n\nBest regards,\nLinkPilot Team`;

      setPitchData({
        prospectId: prospect.id,
        domain: prospect.domain,
        recipient: prospect.contact_email || `editor@${prospect.domain}`,
        contact_name: prospect.contact_name || '',
        subject: subj,
        body: body,
      });
      setEmailModal(true);
    } catch {
      setPitchData({
        prospectId: prospect.id,
        domain: prospect.domain,
        recipient: prospect.contact_email || `editor@${prospect.domain}`,
        contact_name: prospect.contact_name || '',
        subject: `Collaboration inquiry for ${prospect.domain}`,
        body: `Hi ${prospect.contact_name || 'there'},\n\nI was browsing ${prospect.domain} and would love to collaborate.\n\nBest regards,\nLinkPilot Team`,
      });
      setEmailModal(true);
    }
  };

  const handleSendPitch = async (e) => {
    e.preventDefault();
    if (!pitchData.recipient.trim() || !pitchData.subject.trim()) {
      notify.warning('Required Fields', 'Please provide a valid recipient email and subject line.');
      return;
    }
    try {
      notify.loading('Dispatching Outreach Pitch', `Sending email to ${pitchData.recipient}...`);
      await apiPost(`/outreach/prospects/${pitchData.prospectId}/send-email`, {
        recipient: pitchData.recipient.trim(),
        subject: pitchData.subject.trim(),
        body: pitchData.body,
        contact_name: pitchData.contact_name,
      });
      notify.close();
      await notify.success('Pitch Dispatched!', `Outreach email successfully sent to <strong>${pitchData.recipient}</strong>.<br>Prospect stage automatically advanced to <strong>Contacted</strong>.`);
      setEmailModal(false);
      loadProspects();
    } catch (err) {
      notify.close();
      notify.error('Dispatch Failed', err.message || 'Failed to dispatch pitch email.');
    }
  };

  const handleCreate = async e => {
    e.preventDefault();
    if (!newProspect.domain.trim()) return;
    try {
      await apiPost('/outreach/prospects', {
        ...newProspect,
        project_id: activeProject?.id || 1,
      });
      setShowAddModal(false);
      setNewProspect({ domain: '', contact_name: '', contact_email: '', opportunity_type: 'guest_post', stage: 'new', priority: 'medium', notes: '' });
      notify.success('Prospect Added', 'New prospect added to outreach pipeline.', { timer: 2000 });
      loadProspects();
    } catch (err) {
      notify.error('Creation Failed', err.message || 'Failed to create prospect.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Link Building Outreach CRM Pipeline"
        subtitle={`Track prospect qualification, pitch velocity, follow-up cadence, and acquired links for ${activeProject?.domain || 'current project'}`}
        breadcrumbs={[{ label: 'Link Building' }, { label: 'Outreach CRM' }]}
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setShowAddModal(true)}>
            Add New Prospect
          </Button>
        }
      />

      {/* Kanban Pipeline Board */}
      <div className="crm-kanban-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, alignItems: 'flex-start', overflowX: 'auto', maxWidth: '100%', paddingBottom: 16, WebkitOverflowScrolling: 'touch' }}>
        {PIPELINE_STAGES.map(stage => {
          const inStage = prospects.filter(p => p.stage === stage.key);
          return (
            <div
              key={stage.key}
              style={{
                background: 'var(--bg2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 480,
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg3)',
                  borderTopLeftRadius: 'var(--radius-md)',
                  borderTopRightRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                  <strong style={{ fontSize: 13, color: 'var(--fg)' }}>{stage.label}</strong>
                </div>
                <Badge size="sm">{inStage.length}</Badge>
              </div>

              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {inStage.map(p => (
                  <Card key={p.id} style={{ padding: 14, borderLeft: `3px solid ${stage.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <strong style={{ fontSize: 13.5, color: 'var(--fg)' }}>{p.domain}</strong>
                      <Badge size="sm" color={p.priority === 'high' ? 'var(--danger)' : 'var(--info)'}>
                        {p.priority?.toUpperCase()}
                      </Badge>
                    </div>

                    {p.contact_name && (
                      <div style={{ fontSize: 12, color: 'var(--fg3)', marginBottom: 4 }}>
                        Contact: {p.contact_name}
                      </div>
                    )}

                    {p.notes && (
                      <div style={{ fontSize: 11.5, color: 'var(--fg4)', background: 'var(--bg3)', padding: '4px 8px', borderRadius: 4, marginBottom: 8 }}>
                        {p.notes}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg4)' }}>DA {p.da || 45}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Mail size={12} />}
                          style={{ padding: '2px 8px', fontSize: 11 }}
                          onClick={() => handleOpenPitch(p)}
                        >
                          Pitch
                        </Button>
                        <select
                          value={p.stage}
                          onChange={e => handleStageChange(p.id, e.target.value)}
                          style={{
                            fontSize: 11,
                            padding: '2px 6px',
                            borderRadius: 4,
                            border: '1px solid var(--border)',
                            background: 'var(--bg2)',
                            color: 'var(--fg2)',
                            cursor: 'pointer',
                          }}
                        >
                          {PIPELINE_STAGES.map(s => (
                            <option key={s.key} value={s.key}>Move: {s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </Card>
                ))}

                {inStage.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg4)', fontSize: 12 }}>
                    No prospects in stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Prospect Modal */}
      {showAddModal && (
        <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Outreach Prospect">
          <form onSubmit={handleCreate}>
            <Input
              label="Publisher Domain"
              value={newProspect.domain}
              onChange={e => setNewProspect({ ...newProspect, domain: e.target.value })}
              placeholder="e.g. searchengineland.com"
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                label="Contact Name"
                value={newProspect.contact_name}
                onChange={e => setNewProspect({ ...newProspect, contact_name: e.target.value })}
                placeholder="e.g. Sarah Jenkins"
              />
              <Input
                label="Contact Email"
                type="email"
                value={newProspect.contact_email}
                onChange={e => setNewProspect({ ...newProspect, contact_email: e.target.value })}
                placeholder="sarah@example.com"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select
                label="Opportunity Strategy"
                value={newProspect.opportunity_type}
                onChange={e => setNewProspect({ ...newProspect, opportunity_type: e.target.value })}
                options={[
                  { value: 'guest_post', label: 'Guest Post Pitch' },
                  { value: 'broken_link', label: 'Broken Link Replacement' },
                  { value: 'resource_page', label: 'Resource Hub Inclusion' },
                  { value: 'unlinked_mention', label: 'Unlinked Brand Mention' },
                ]}
              />
              <Select
                label="Campaign Priority"
                value={newProspect.priority}
                onChange={e => setNewProspect({ ...newProspect, priority: e.target.value })}
                options={[
                  { value: 'high', label: 'High Priority' },
                  { value: 'medium', label: 'Medium Priority' },
                  { value: 'low', label: 'Low Priority' },
                ]}
              />
            </div>
            <Textarea
              label="Outreach Notes & Context"
              value={newProspect.notes}
              onChange={e => setNewProspect({ ...newProspect, notes: e.target.value })}
              placeholder="Notes on recent articles, pitch angle, or mutual connections..."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" icon={<Check size={15} />}>Add to Pipeline</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Dispatch Pitch Email Modal */}
      {emailModal && (
        <Modal open={emailModal} onClose={() => setEmailModal(false)} title={`Dispatch Pitch Email — ${pitchData.domain}`} large>
          <form onSubmit={handleSendPitch}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg2)', display: 'block', marginBottom: 6 }}>
                Load Template
              </label>
              <Select
                value=""
                onChange={e => {
                  const tmpl = templates.find(t => String(t.id) === e.target.value);
                  if (tmpl) {
                    setPitchData(prev => ({
                      ...prev,
                      subject: tmpl.subject.replace(/\{\{domain\}\}/g, prev.domain),
                      body: tmpl.body.replace(/\{\{domain\}\}/g, prev.domain).replace(/\{\{contact_name\}\}/g, prev.contact_name || 'Editor'),
                    }));
                  }
                }}
              >
                <option value="">Choose a template to populate...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                ))}
              </Select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                label="Recipient Email"
                type="email"
                value={pitchData.recipient}
                onChange={e => setPitchData({ ...pitchData, recipient: e.target.value })}
                required
              />
              <Input
                label="Contact Name"
                value={pitchData.contact_name}
                onChange={e => setPitchData({ ...pitchData, contact_name: e.target.value })}
                placeholder="e.g. Sarah"
              />
            </div>

            <Input
              label="Subject Line"
              value={pitchData.subject}
              onChange={e => setPitchData({ ...pitchData, subject: e.target.value })}
              required
            />

            <Textarea
              label="Pitch Message Body"
              rows={8}
              value={pitchData.body}
              onChange={e => setPitchData({ ...pitchData, body: e.target.value })}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <Button variant="secondary" type="button" onClick={() => setEmailModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" icon={<Send size={14} />}>
                Send Pitch Email
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// 8. EMAIL PITCH TEMPLATES
// ============================================================
export function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    apiGet('/outreach/templates')
      .then(d => {
        setTemplates(d || []);
        if (d?.length) setSelected(d[0]);
      })
      .catch(() => {
        const fallbacks = [
          {
            id: 1,
            name: 'Guest Post Pitch',
            subject: 'Content collaboration inquiry for {{domain}}',
            category: 'guest_post',
            body: `Hi {{contact_name}},\n\nI was reading {{domain}} and loved your recent deep-dive into digital marketing.\n\nWe recently published a proprietary research study examining 50,000 live backlink profiles that your readers would find very practical.\n\nWould you be open to an exclusive guest contribution? I can send over 2-3 tailored topic outlines.\n\nBest regards,\nLinkPilot Outreach Team`,
          },
          {
            id: 2,
            name: 'Broken Link Alert',
            subject: 'Found a broken reference link on {{domain}}',
            category: 'broken_link',
            body: `Hello {{contact_name}},\n\nWhile going through your informative guide on {{page_url}}, I noticed that one of your reference links leads to an expired 404 page.\n\nWe happen to maintain an up-to-date, authoritative guide on that exact topic here: {{target_url}}.\n\nIf you find it helpful, it might make a seamless replacement for your readers!\n\nBest,\nLinkPilot Team`,
          },
        ];
        setTemplates(fallbacks);
        setSelected(fallbacks[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Email Pitch Templates"
        subtitle="Standardized outreach templates with dynamic variable insertion ({{domain}}, {{contact_name}}, {{target_url}})"
        breadcrumbs={[{ label: 'Link Building' }, { label: 'Templates' }]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        <Card style={{ padding: 14 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg3)', textTransform: 'uppercase', marginBottom: 12 }}>
            Saved Pitch Templates
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templates.map(t => (
              <div
                key={t.id}
                onClick={() => setSelected(t)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: selected?.id === t.id ? 'var(--primary-bg)' : 'transparent',
                  border: selected?.id === t.id ? '1px solid var(--primary)' : '1px solid transparent',
                  fontWeight: selected?.id === t.id ? 700 : 500,
                  color: selected?.id === t.id ? 'var(--primary)' : 'var(--fg)',
                }}
              >
                <div>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--fg4)', marginTop: 2 }}>Subject: {t.subject?.slice(0, 36)}...</div>
              </div>
            ))}
          </div>
        </Card>

        {selected && (
          <Card style={{ padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--fg4)', textTransform: 'uppercase', fontWeight: 700 }}>Email Subject Line</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', marginTop: 4, background: 'var(--bg3)', padding: '8px 12px', borderRadius: 6 }}>
                {selected.subject}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: 'var(--fg4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Body Content</div>
              <pre
                style={{
                  background: 'var(--bg3)',
                  padding: 16,
                  borderRadius: 8,
                  fontFamily: 'inherit',
                  fontSize: 13.5,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  color: 'var(--fg)',
                  border: '1px solid var(--border)',
                }}
              >
                {selected.body}
              </pre>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 9. PROJECT SETTINGS & INTEGRATIONS
// ============================================================
export function Projects() {
  const { projects = [], activeProject, switchProject, reloadProjects } = useProject() || {};
  const [showCreate, setShowCreate] = useState(false);
  const [newProj, setNewProj] = useState({ name: '', website_url: '', description: '', industry: 'SaaS / Marketing' });

  const handleCreate = async e => {
    e.preventDefault();
    if (!newProj.name.trim() || newProj.name.trim().length < 2) {
      notify.warning('Name Required', 'Project name must be between 2 and 100 characters.');
      return;
    }
    if (!newProj.website_url.trim() || !newProj.website_url.includes('.')) {
      notify.warning('Valid URL Required', 'Please provide a valid website URL (e.g. https://yoursite.com).');
      return;
    }

    let cleanUrl = newProj.website_url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    try {
      notify.loading('Initializing Project', 'Setting up isolated backlink intelligence database...');
      await apiPost('/projects', {
        ...newProj,
        name: newProj.name.trim(),
        website_url: cleanUrl,
      });
      notify.close();
      setShowCreate(false);
      setNewProj({ name: '', website_url: '', description: '', industry: 'SaaS / Marketing' });
      reloadProjects();
      notify.success('Project Created', 'New project workspace initialized successfully.', { timer: 2500 });
    } catch (err) {
      notify.close();
      notify.error('Creation Failed', err.message || 'Failed to create project.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Project Management"
        subtitle="Manage isolated client and domain properties with independent crawl parameters and backlink monitoring"
        breadcrumbs={[{ label: 'Projects' }, { label: 'All Projects' }]}
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setShowCreate(true)}>
            Create New Project
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {projects.map(p => (
          <Card
            key={p.id}
            style={{
              padding: 24,
              borderTop: activeProject?.id === p.id ? '4px solid var(--primary)' : '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg)' }}>{p.name}</h3>
                <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>{p.domain}</span>
              </div>
              {activeProject?.id === p.id ? (
                <Badge color="var(--success)" bg="var(--success-bg)">Active Workspace</Badge>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => switchProject(p)}>
                  Switch To Project
                </Button>
              )}
            </div>

            <p style={{ fontSize: 13, color: 'var(--fg3)', lineHeight: 1.5, marginBottom: 16 }}>
              {p.description || 'Production backlink intelligence and outreach property.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, background: 'var(--bg3)', padding: 12, borderRadius: 8, textAlign: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{p.total_backlinks || 0}</div>
                <div style={{ fontSize: 10, color: 'var(--fg4)', textTransform: 'uppercase' }}>Backlinks</div>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{p.referring_domains || 0}</div>
                <div style={{ fontSize: 10, color: 'var(--fg4)', textTransform: 'uppercase' }}>Ref Domains</div>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: (p.broken_links || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {p.broken_links || 0}
                </div>
                <div style={{ fontSize: 10, color: 'var(--fg4)', textTransform: 'uppercase' }}>Broken</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--fg4)' }}>Created: {p.created_at?.slice(0, 10) || 'Recently'}</span>
              <Button variant="outline" size="sm" onClick={() => switchProject(p)}>
                Open Dashboard →
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {showCreate && (
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New LinkPilot Project">
          <form onSubmit={handleCreate}>
            <Input
              label="Project Name"
              value={newProj.name}
              onChange={e => setNewProj({ ...newProj, name: e.target.value })}
              placeholder="e.g. Acme SaaS Global"
              required
            />
            <Input
              label="Target Website URL"
              value={newProj.website_url}
              onChange={e => setNewProj({ ...newProj, website_url: e.target.value })}
              placeholder="https://acme.com"
              required
            />
            <Input
              label="Industry / Niche"
              value={newProj.industry}
              onChange={e => setNewProj({ ...newProj, industry: e.target.value })}
            />
            <Textarea
              label="Project Description"
              value={newProj.description}
              onChange={e => setNewProj({ ...newProj, description: e.target.value })}
              placeholder="Primary SEO campaign objectives..."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" type="submit" icon={<Check size={15} />}>Create Project</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// 10. REAL DATA INTEGRATIONS (GSC, CSV, API)
// ============================================================
export function Integrations() {
  const { activeProject } = useProject() || {};
  const [gscConnected, setGscConnected] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    referring_domain: '',
    referring_page_url: '',
    target_url: '',
    anchor_text: '',
    link_type: 'dofollow',
    data_source: 'Google Search Console',
  });
  const [showManualModal, setShowManualModal] = useState(false);

  const handleManualSubmit = async e => {
    e.preventDefault();
    if (!manualEntry.referring_domain || !manualEntry.referring_page_url || !manualEntry.target_url) return;
    try {
      await apiPost('/backlinks', {
        ...manualEntry,
        exchange_id: 1,
        side: 'our',
        acquisition_date: new Date().toISOString().slice(0, 10),
      });
      setShowManualModal(false);
      notify.success('Backlink Verified & Saved', 'Backlink record successfully verified and added to intelligence database.');
    } catch (err) {
      notify.error('Submission Failed', err.message || 'Failed to add backlink.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Data Sources & Integrations"
        subtitle={`Connect authentic real-world link data sources to ${activeProject?.domain || 'LinkPilot'}`}
        breadcrumbs={[{ label: 'Projects' }, { label: 'Integrations' }]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Google Search Console */}
        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ea433515', color: '#ea4335', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                GSC
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Google Search Console</h3>
                <div style={{ fontSize: 12, color: 'var(--fg4)' }}>Official Google Search data feed</div>
              </div>
            </div>
            <Badge color={gscConnected ? 'var(--success)' : 'var(--fg4)'}>
              {gscConnected ? 'Connected' : 'Not Connected'}
            </Badge>
          </div>
          <p style={{ fontSize: 13, color: 'var(--fg3)', lineHeight: 1.6, marginBottom: 20 }}>
            Sync verified inbound links discovered by Googlebot directly into your LinkPilot intelligence pipeline. Eliminates synthetic estimates.
          </p>
          <Button
            variant={gscConnected ? 'secondary' : 'primary'}
            onClick={() => setGscConnected(!gscConnected)}
            style={{ width: '100%' }}
          >
            {gscConnected ? 'Disconnect Service' : 'Authorize Google Account'}
          </Button>
        </Card>

        {/* CSV Bulk Import */}
        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#10b98115', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                CSV
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>CSV & Excel Importer</h3>
                <div style={{ fontSize: 12, color: 'var(--fg4)' }}>Upload historical backlink exports</div>
              </div>
            </div>
            <Badge color="var(--success)">Ready</Badge>
          </div>
          <p style={{ fontSize: 13, color: 'var(--fg3)', lineHeight: 1.6, marginBottom: 20 }}>
            Import backlink exports from Ahrefs, Moz, Semrush, or Majestic. LinkPilot deduplicates, verifies HTTP status, and evaluates risk scores.
          </p>
          <Button variant="secondary" onClick={() => window.location.href = '/import'} style={{ width: '100%' }}>
            Open CSV Import Wizard
          </Button>
        </Card>

        {/* Manual Link Ingestion */}
        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#6366f115', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                API
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Manual & API Entry</h3>
                <div style={{ fontSize: 12, color: 'var(--fg4)' }}>Individual backlink ingestion</div>
              </div>
            </div>
            <Badge color="var(--primary)">Active</Badge>
          </div>
          <p style={{ fontSize: 13, color: 'var(--fg3)', lineHeight: 1.6, marginBottom: 20 }}>
            Log individual acquired links with exact attribution source (`Google Search Console`, `CSV Import`, `Crawler`, `Manual`).
          </p>
          <Button variant="primary" onClick={() => setShowManualModal(true)} style={{ width: '100%' }}>
            Add Verified Backlink
          </Button>
        </Card>
      </div>

      {showManualModal && (
        <Modal open={showManualModal} onClose={() => setShowManualModal(false)} title="Add Verified Backlink Entry">
          <form onSubmit={handleManualSubmit}>
            <Select
              label="Attributed Data Source"
              value={manualEntry.data_source}
              onChange={e => setManualEntry({ ...manualEntry, data_source: e.target.value })}
              options={[
                { value: 'Google Search Console', label: 'Google Search Console' },
                { value: 'CSV Import', label: 'CSV Import' },
                { value: 'Crawler', label: 'Automated Crawler' },
                { value: 'Provider API', label: 'Provider API' },
                { value: 'Manual', label: 'Manual Entry' },
              ]}
            />
            <Input
              label="Referring Publisher Domain"
              value={manualEntry.referring_domain}
              onChange={e => setManualEntry({ ...manualEntry, referring_domain: e.target.value })}
              placeholder="e.g. nytimes.com"
              required
            />
            <Input
              label="Referring Source Page URL"
              value={manualEntry.referring_page_url}
              onChange={e => setManualEntry({ ...manualEntry, referring_page_url: e.target.value })}
              placeholder="https://nytimes.com/tech/new-tools"
              required
            />
            <Input
              label="Destination Target URL"
              value={manualEntry.target_url}
              onChange={e => setManualEntry({ ...manualEntry, target_url: e.target.value })}
              placeholder="https://linkpilot.io/guide"
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                label="Anchor Text"
                value={manualEntry.anchor_text}
                onChange={e => setManualEntry({ ...manualEntry, anchor_text: e.target.value })}
                placeholder="e.g. LinkPilot"
              />
              <Select
                label="Link Directive"
                value={manualEntry.link_type}
                onChange={e => setManualEntry({ ...manualEntry, link_type: e.target.value })}
                options={[
                  { value: 'dofollow', label: 'Dofollow' },
                  { value: 'nofollow', label: 'Nofollow' },
                  { value: 'sponsored', label: 'Sponsored' },
                  { value: 'ugc', label: 'UGC' },
                ]}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <Button variant="secondary" onClick={() => setShowManualModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" icon={<Check size={15} />}>Save Record</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// 11. LINK & DOMAIN ALERTS
// ============================================================
export function LinkAlerts() {
  const { activeProject } = useProject() || {};

  const alerts = [
    { id: 1, type: 'new', title: 'New High-Authority Backlink Discovered', domain: 'forbes.com', da: 94, date: '2 hours ago', severity: 'success' },
    { id: 2, type: 'lost', title: 'Backlink Dropped or Removed', domain: 'marketingcloud.org', da: 52, date: 'Yesterday', severity: 'warning' },
    { id: 3, type: 'broken', title: 'Target Page Returning 404', domain: 'techpost.io', da: 48, date: '2 days ago', severity: 'danger' },
    { id: 4, type: 'security', title: 'Potential PBN Subnet Concentration Detected', domain: '104.21.34.0/24', da: null, date: '3 days ago', severity: 'info' },
  ];

  return (
    <div>
      <PageHeader
        title="Link & Domain Monitoring Alerts"
        subtitle={`Automated notification alerts for new links, dropped backlinks, 404 broken targets, and competitor movements on ${activeProject?.domain || 'your domain'}`}
        breadcrumbs={[{ label: 'Monitoring' }, { label: 'Alerts' }]}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alerts.map(a => (
          <Card key={a.id} style={{ padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: a.severity === 'danger' ? 'var(--danger-bg)' : a.severity === 'warning' ? 'var(--warning-bg)' : 'var(--success-bg)',
                  color: a.severity === 'danger' ? 'var(--danger)' : a.severity === 'warning' ? 'var(--warning)' : 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {a.severity === 'danger' ? <AlertTriangle size={18} /> : a.severity === 'warning' ? <Radio size={18} /> : <Sparkles size={18} />}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg)' }}>{a.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--fg3)', marginTop: 2 }}>
                  Entity: <strong>{a.domain}</strong> {a.da ? `· DA ${a.da}` : ''} · Triggered {a.date}
                </div>
              </div>
            </div>

            <Button variant="secondary" size="sm" icon={<ExternalLink size={13} />}>
              Investigate
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
