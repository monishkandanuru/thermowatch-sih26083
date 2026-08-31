'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Building2,
  Check,
  ChevronRight,
  CloudSun,
  Download,
  ExternalLink,
  FileText,
  History,
  LayoutDashboard,
  Map,
  Menu,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from 'recharts';
import indiaMap from '@svg-maps/india';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';

type Risk = 'Low' | 'Moderate' | 'High' | 'Extreme' | 'Emergency';
type View =
  | 'overview'
  | 'forecast'
  | 'map'
  | 'model'
  | 'authority'
  | 'response'
  | 'validation'
  | 'history'
  | 'alerts';
type District = {
  district: string;
  lat: number;
  lon: number;
  temp: number;
  humidity: number;
  htsi: number;
  risk: Risk;
  probability: number;
  x: number;
  y: number;
  source: string;
  wind?: number;
  uv?: number;
  wbgt?: number;
  heat_index?: number;
  pet?: number;
  action?: string;
};
type ForecastPoint = {
  time: string;
  label: string;
  temp: number;
  humidity: number;
  htsi: number;
  risk: Risk;
};
type Horizon = {
  horizon_hours: number;
  predicted_class: Risk;
  probability: number;
  htsi: number;
};
type Profile = {
  profile: string;
  multiplier: number;
  htsi: number;
  risk: Risk;
};
type DistrictDetail = {
  district: string;
  current: District;
  forecast: ForecastPoint[];
  horizons: Horizon[];
  peak?: ForecastPoint;
  profiles: Profile[];
  source: string;
  facilities?: Facility[];
};
type Facility = {
  id: string;
  name: string;
  type: string;
  emergency: boolean;
  map_url: string;
};
type AlertRow = {
  id: string;
  district: string;
  risk: Risk;
  channel: string;
  language: string;
  message: string;
  status: string;
  created_at: string;
};
type IncidentRow = {
  id: string;
  district: string;
  incident_type: string;
  severity: Risk;
  description: string;
  reporter: string;
  status: string;
  created_at: string;
};
type HistoryData = {
  observations: RecordRow[];
  predictions: RecordRow[];
  counts: { observations: number; predictions: number };
};
type RecordRow = Record<string, string | number | null>;
type DashboardData = {
  districts: District[];
  model: {
    model_version: string;
    model_type: string;
    data_source: string;
    train_samples: number;
    test_samples: number;
    metrics: Record<string, number>;
    feature_names: string[];
    label_note: string;
  };
  authority: {
    coverage: number;
    high_risk_count: number;
    active_alerts: number;
    open_incidents: number;
    highest_risk_locations: District[];
    recommended_interventions: string[];
  };
  validation: {
    accuracy_pct: number;
    macro_f1_pct: number;
    precision_pct: number;
    recall_pct: number;
    false_alarms: number;
    missed_events: number;
    class_support: Record<string, number>;
    confusion_matrix: number[][];
    labels: string[];
    replay: Array<{
      label: string;
      actual_htsi: number;
      predicted_probability: number;
    }>;
  };
  generated_at: string;
};

const seedDistricts: District[] = [
  {
    district: 'Delhi',
    lat: 28.6139,
    lon: 77.209,
    temp: 42.1,
    humidity: 39,
    htsi: 73.5,
    risk: 'Extreme',
    probability: 81,
    x: 144,
    y: 75,
    source: 'resilient-fallback',
    wbgt: 34.4,
    heat_index: 53.2,
    pet: 45.1,
  },
  {
    district: 'Jaipur',
    lat: 26.9124,
    lon: 75.7873,
    temp: 43.6,
    humidity: 31,
    htsi: 71.1,
    risk: 'Extreme',
    probability: 78,
    x: 120,
    y: 91,
    source: 'resilient-fallback',
  },
  {
    district: 'Hyderabad',
    lat: 17.385,
    lon: 78.4867,
    temp: 39.4,
    humidity: 47,
    htsi: 63.8,
    risk: 'High',
    probability: 71,
    x: 162,
    y: 184,
    source: 'resilient-fallback',
  },
  {
    district: 'Patna',
    lat: 25.5941,
    lon: 85.1376,
    temp: 40.2,
    humidity: 58,
    htsi: 69.4,
    risk: 'High',
    probability: 76,
    x: 208,
    y: 104,
    source: 'resilient-fallback',
  },
  {
    district: 'Ahmedabad',
    lat: 23.0225,
    lon: 72.5714,
    temp: 41.3,
    humidity: 37,
    htsi: 67.2,
    risk: 'High',
    probability: 74,
    x: 96,
    y: 118,
    source: 'resilient-fallback',
  },
  {
    district: 'Bhopal',
    lat: 23.2599,
    lon: 77.4126,
    temp: 38.8,
    humidity: 44,
    htsi: 58.2,
    risk: 'High',
    probability: 63,
    x: 150,
    y: 130,
    source: 'resilient-fallback',
  },
  {
    district: 'Lucknow',
    lat: 26.8467,
    lon: 80.9462,
    temp: 38.6,
    humidity: 51,
    htsi: 52.8,
    risk: 'Moderate',
    probability: 48,
    x: 178,
    y: 91,
    source: 'resilient-fallback',
  },
  {
    district: 'Bhubaneswar',
    lat: 20.2961,
    lon: 85.8245,
    temp: 37.4,
    humidity: 66,
    htsi: 61.4,
    risk: 'High',
    probability: 66,
    x: 215,
    y: 154,
    source: 'resilient-fallback',
  },
];

const riskStyle: Record<
  Risk,
  { badge: string; color: string; soft: string; bar: string }
> = {
  Low: {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    color: '#15803d',
    soft: '#ecfdf3',
    bar: 'bg-emerald-600',
  },
  Moderate: {
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    color: '#a16207',
    soft: '#fffbeb',
    bar: 'bg-amber-600',
  },
  High: {
    badge: 'border-orange-200 bg-orange-50 text-orange-700',
    color: '#c2410c',
    soft: '#fff7ed',
    bar: 'bg-orange-600',
  },
  Extreme: {
    badge: 'border-red-200 bg-red-50 text-red-700',
    color: '#b91c1c',
    soft: '#fef2f2',
    bar: 'bg-red-700',
  },
  Emergency: {
    badge: 'border-purple-200 bg-purple-50 text-purple-700',
    color: '#7e22ce',
    soft: '#faf5ff',
    bar: 'bg-purple-700',
  },
};

const navigation: Array<{
  id: View;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Command center', icon: LayoutDashboard },
  { id: 'forecast', label: 'Forecast horizon', icon: TrendingUp },
  { id: 'map', label: 'Risk map', icon: Map },
  { id: 'model', label: 'Explainable AI', icon: Sparkles },
  { id: 'authority', label: 'Authority', icon: ShieldCheck },
  { id: 'response', label: 'Response hub', icon: Building2 },
  { id: 'validation', label: 'Validation', icon: FileText },
  { id: 'history', label: 'History', icon: History },
  { id: 'alerts', label: 'Alert center', icon: Bell },
];

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options);
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <Badge
      variant="outline"
      className={riskStyle[risk]?.badge ?? riskStyle.Low.badge}
    >
      {risk}
    </Badge>
  );
}

function PanelTitle({
  eyebrow,
  title,
  note,
  action,
}: {
  eyebrow: string;
  title: string;
  note?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="font-mono text-[9px] font-semibold tracking-[0.15em] text-slate-400">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2>
        {note && (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{note}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
  tone = 'blue',
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'border-blue-100 bg-blue-50 text-blue-800',
    red: 'border-red-100 bg-red-50 text-red-800',
    amber: 'border-amber-100 bg-amber-50 text-amber-800',
    green: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    purple: 'border-purple-100 bg-purple-50 text-purple-800',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[tone]}`}>
      <span className="block text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </span>
      <strong className="my-1 block text-2xl">{value}</strong>
      <small className="opacity-70">{detail}</small>
    </div>
  );
}

function Loading({ label = 'Loading live intelligence' }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-slate-500">
      <RefreshCw className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function IndiaMap({
  districts,
  selected,
  onSelect,
  expanded = false,
}: {
  districts: District[];
  selected: District;
  onSelect: (district: District) => void;
  expanded?: boolean;
}) {
  const indiaLocations = indiaMap.locations as Array<{
    id: string;
    path: string;
  }>;
  const project = (lat: number, lon: number) => ({
    x: (lon - 67.7) * 20.35,
    y: (37.6 - lat) * 22.05,
  });

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_50%_38%,#ffffff_0%,#f4f7fb_58%,#e9eff7_100%)] ${expanded ? 'h-[520px] sm:h-[600px]' : 'h-[380px]'}`}
    >
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-white/80 bg-white/85 px-3 py-1.5 shadow-sm backdrop-blur">
        <span className="flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-600">
          <i className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgb(16_185_129/12%)]" />
          20 live districts
        </span>
      </div>
      <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 text-right shadow-sm backdrop-blur">
        <span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-400">
          Selected
        </span>
        <strong className="text-sm text-slate-800">{selected.district}</strong>
        <span
          className="ml-2 text-[10px] font-bold uppercase"
          style={{ color: riskStyle[selected.risk].color }}
        >
          {selected.risk}
        </span>
      </div>
      <svg
        viewBox={indiaMap.viewBox}
        className="h-full w-full px-8 pb-14 pt-12 drop-shadow-[0_18px_24px_rgb(37_58_88/12%)]"
        role="img"
        aria-label="Geographic heat-risk map of India showing 20 monitored districts"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="india-land" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#f8fbff" />
            <stop offset="52%" stopColor="#e8f0fa" />
            <stop offset="100%" stopColor="#dce8f5" />
          </linearGradient>
          <filter id="marker-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g aria-hidden="true">
          {indiaLocations.map((location) => (
            <path
              key={location.id}
              d={location.path}
              fill="url(#india-land)"
              stroke="#b7c8dc"
              strokeWidth="1.15"
              vectorEffect="non-scaling-stroke"
              className="transition-colors duration-200 hover:fill-blue-50"
            />
          ))}
        </g>

        {districts.map((item) => {
          const point = project(item.lat, item.lon);
          const isSelected = selected.district === item.district;
          const color = riskStyle[item.risk].color;
          const labelWidth = Math.max(62, item.district.length * 7 + 20);

          return (
            <g
              key={item.district}
              role="button"
              tabIndex={0}
              aria-label={`${item.district}: ${item.risk} risk, HTSI ${item.htsi}`}
              className="group cursor-pointer focus:outline-none"
              onClick={() => onSelect(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(item);
                }
              }}
            >
              <title>{`${item.district} · ${item.risk} risk · HTSI ${item.htsi}`}</title>
              <circle cx={point.x} cy={point.y} r="19" fill="transparent" />
              <circle
                cx={point.x}
                cy={point.y}
                r={isSelected ? 15 : 11}
                fill={riskStyle[item.risk].soft}
                fillOpacity="0.96"
                stroke="white"
                strokeWidth="4"
                filter={isSelected ? 'url(#marker-glow)' : undefined}
                className="transition-all duration-200 group-hover:r-[14px] group-focus:stroke-blue-700"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={isSelected ? 7 : 5.5}
                fill={color}
                stroke={isSelected ? 'white' : color}
                strokeWidth="1.5"
              />
              {isSelected && (
                <g transform={`translate(${point.x - labelWidth / 2} ${point.y - 42})`}>
                  <rect
                    width={labelWidth}
                    height="25"
                    rx="12.5"
                    fill="#0f172a"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={labelWidth / 2}
                    y="16.5"
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="700"
                    fill="white"
                  >
                    {item.district}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-x-3 bottom-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5 rounded-2xl border border-white/90 bg-white/92 px-3 py-2.5 text-[10px] text-slate-600 shadow-[0_8px_24px_rgb(37_58_88/10%)] backdrop-blur">
        {(['Low', 'Moderate', 'High', 'Extreme', 'Emergency'] as Risk[]).map(
          (risk) => (
            <span key={risk} className="flex items-center gap-1.5">
              <i
                className="h-2 w-2 rounded-full"
                style={{ background: riskStyle[risk].color }}
              />
              {risk}
            </span>
          ),
        )}
      </div>
      <span className="absolute bottom-1 right-4 text-[7px] text-slate-400">
        Boundary geometry · CC BY 4.0
      </span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export function ThermoWatchDashboard() {
  const [view, setView] = useState<View>('overview');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [districts, setDistricts] = useState<District[]>(seedDistricts);
  const [selectedName, setSelectedName] = useState('Delhi');
  const [detail, setDetail] = useState<DistrictDetail | null>(null);
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [incidentType, setIncidentType] = useState('heat illness');
  const [incidentSeverity, setIncidentSeverity] = useState<Risk>('High');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [reporter, setReporter] = useState('');
  const [alertRisk, setAlertRisk] = useState<Risk>('High');
  const [alertLanguage, setAlertLanguage] = useState('en');
  const [personalAge, setPersonalAge] = useState('adult');
  const [personalActivity, setPersonalActivity] = useState('moderate');
  const [acclimatized, setAcclimatized] = useState(false);
  const [personalResult, setPersonalResult] = useState<{
    htsi_score: number;
    risk_level: Risk;
    recommended_action: string;
  } | null>(null);

  const selected = useMemo(
    () =>
      districts.find((item) => item.district === selectedName) ?? districts[0],
    [districts, selectedName],
  );
  const hotspots = useMemo(
    () => [...districts].sort((a, b) => b.htsi - a.htsi).slice(0, 6),
    [districts],
  );
  const highCount = districts.filter((item) =>
    ['High', 'Extreme', 'Emergency'].includes(item.risk),
  ).length;

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api<DashboardData>('/api/dashboard');
      setDashboard(data);
      setDistricts(data.districts);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Live dashboard unavailable',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(
    async (district: string, facilities = false) => {
      setDetailLoading(true);
      try {
        setDetail(
          await api<DistrictDetail>(
            `/api/district?district=${encodeURIComponent(district)}${facilities ? '&facilities=true' : ''}`,
          ),
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'District detail unavailable',
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [],
  );

  const loadRecords = useCallback(async (district: string) => {
    const [history, alertData, incidentData] = await Promise.all([
      api<HistoryData>(`/api/history?district=${encodeURIComponent(district)}`),
      api<{ alerts: AlertRow[] }>(
        `/api/alerts?district=${encodeURIComponent(district)}`,
      ),
      api<{ incidents: IncidentRow[] }>(
        `/api/incidents?district=${encodeURIComponent(district)}`,
      ),
    ]);
    setHistoryData(history);
    setAlerts(alertData.alerts);
    setIncidents(incidentData.incidents);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  useEffect(() => {
    loadDetail(selectedName, view === 'response');
  }, [selectedName, view, loadDetail]);
  useEffect(() => {
    if (['history', 'alerts', 'response'].includes(view))
      loadRecords(selectedName).catch(() =>
        setError('Saved records could not be loaded.'),
      );
  }, [view, selectedName, loadRecords]);

  function selectDistrict(item: District) {
    setSelectedName(item.district);
    setView('overview');
    setMobileNav(false);
  }
  function changeView(next: View) {
    setView(next);
    setMobileNav(false);
    setNotice('');
  }

  async function calculatePersonal() {
    try {
      const result = await api<{
        htsi_score: number;
        risk_level: Risk;
        recommended_action: string;
      }>('/api/htsi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature_c: selected.temp,
          humidity_pct: selected.humidity,
          wind_speed_ms: selected.wind,
          uv_index: selected.uv,
          age_group: personalAge,
          activity: personalActivity,
          acclimatized,
        }),
      });
      setPersonalResult(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Screening failed',
      );
    }
  }

  async function submitIncident(event: FormEvent) {
    event.preventDefault();
    setNotice('');
    try {
      const result = await api<{ id: string }>('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district: selected.district,
          incident_type: incidentType,
          severity: incidentSeverity,
          description: incidentDescription,
          reporter,
        }),
      });
      setIncidentDescription('');
      setNotice(`Incident ${result.id} recorded in the authority trail.`);
      await loadRecords(selected.district);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Incident could not be saved',
      );
    }
  }

  async function sendAlert() {
    setNotice('');
    try {
      if ('Notification' in window && Notification.permission === 'default')
        await Notification.requestPermission();
      const result = await api<{ id: string; message: string }>('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district: selected.district,
          risk: alertRisk,
          channel: 'browser',
          language: alertLanguage,
        }),
      });
      if ('Notification' in window && Notification.permission === 'granted')
        new Notification(`ThermoWatch · ${selected.district}`, {
          body: result.message,
        });
      setNotice(`Alert ${result.id} sent and stored.`);
      await loadRecords(selected.district);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Alert could not be sent',
      );
    }
  }

  async function acknowledgeAlert(id: string) {
    await api('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotice(`Alert ${id} acknowledged.`);
    await loadRecords(selected.district);
  }

  const navLabel =
    navigation.find((item) => item.id === view)?.label ?? 'Command center';
  const sourceLabel = districts.some((item) => item.source === 'open-meteo')
    ? 'Live Open-Meteo connected'
    : 'Resilient demonstration data';

  return (
    <div className="min-h-screen bg-[#f3f6fa] text-slate-900 lg:flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] border-r border-slate-200 bg-white px-4 py-6 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-3 px-2 lg:mb-8">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-800 text-white shadow-[0_8px_18px_rgb(30_64_175/22%)]">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <strong className="block text-sm">ThermoWatch</strong>
            <span className="font-mono text-[9px] tracking-[0.12em] text-slate-400">
              SIH26083 · INDIA
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setMobileNav(false)}
            aria-label="Close navigation"
          >
            <X />
          </Button>
        </div>
        <nav className="mt-6 space-y-1" aria-label="Main navigation">
          <p className="px-3 pb-2 font-mono text-[9px] tracking-[0.14em] text-slate-400">
            WORKSPACE
          </p>
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => changeView(id)}
              className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-semibold transition ${view === id ? 'border border-blue-100 bg-blue-50 text-blue-800' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-800'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {id === 'alerts' && (
                <span className="ml-auto rounded-full bg-orange-50 px-2 py-0.5 text-[10px] text-orange-700">
                  {highCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-6 left-4 right-4 rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[10px] text-slate-500">
          <span
            className={`mr-2 inline-block h-2 w-2 rounded-full ${districts.some((item) => item.source === 'open-meteo') ? 'bg-emerald-500' : 'bg-amber-500'}`}
          />
          {sourceLabel}
          <span className="mt-2 block text-[9px] text-slate-400">
            Model {dashboard?.model.model_version ?? 'htsi-real-3.0'}
          </span>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation overlay"
        />
      )}

      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl lg:px-10">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="Open navigation"
            >
              <Menu />
            </Button>
            <div className="font-mono text-xs text-slate-400">
              India <span className="mx-2">/</span>{' '}
              <b className="text-slate-700">{navLabel}</b>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NativeSelect
              value={selected.district}
              onChange={(event) => setSelectedName(event.target.value)}
              aria-label="Select monitoring district"
            >
              {districts.map((item) => (
                <NativeSelectOption key={item.district} value={item.district}>
                  {item.district}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Button
              variant="outline"
              size="lg"
              onClick={loadDashboard}
              disabled={loading}
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 lg:p-10">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-blue-700">
                DISASTER MANAGEMENT ·{' '}
                {view === 'overview' ? 'LIVE OVERVIEW' : view.toUpperCase()}
              </p>
              <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                {view === 'overview'
                  ? 'Heat conditions, made actionable.'
                  : navLabel}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                {view === 'overview'
                  ? 'See where heat is rising, who is exposed, and what response should come next.'
                  : 'Use transparent signals to make an earlier, more targeted response decision.'}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <b className="block text-xs">System operational</b>
                <span className="text-[11px] text-emerald-700">
                  {districts.length} districts monitored
                </span>
              </div>
            </div>
          </div>
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <span>{error}</span>
              <button onClick={() => setError('')} aria-label="Dismiss error">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {notice && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <Check className="h-4 w-4" />
              {notice}
            </div>
          )}

          {view === 'overview' && (
            <div className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
                  <Card className="border-0 shadow-[0_14px_38px_rgb(37_58_88/7%)]">
                    <CardHeader className="flex-row items-start justify-between">
                      <div>
                        <p className="font-mono text-[9px] tracking-[0.14em] text-slate-400">
                          CURRENT HUMAN THERMAL STRESS
                        </p>
                        <h2 className="mt-2 text-2xl font-bold">
                          {selected.district}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                          {selected.temp}°C · {selected.humidity}% humidity ·{' '}
                          {selected.source === 'open-meteo'
                            ? 'live weather'
                            : 'safe fallback'}
                        </p>
                      </div>
                      <RiskBadge risk={selected.risk} />
                    </CardHeader>
                    <CardContent>
                      <div className="mt-4 flex items-end gap-2">
                        <strong
                          className="text-6xl leading-none"
                          style={{ color: riskStyle[selected.risk].color }}
                        >
                          {selected.htsi}
                        </strong>
                        <span className="pb-1 text-sm text-slate-400">
                          / 100 HTSI
                        </span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                        <i
                          className="block h-full rounded-full"
                          style={{
                            width: `${selected.htsi}%`,
                            background: riskStyle[selected.risk].color,
                          }}
                        />
                      </div>
                      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <span className="block text-[9px] text-slate-400">
                            WBGT
                          </span>
                          <b>
                            {selected.wbgt ?? detail?.current.wbgt ?? '—'}°C
                          </b>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <span className="block text-[9px] text-slate-400">
                            HEAT INDEX
                          </span>
                          <b>
                            {selected.heat_index ??
                              detail?.current.heat_index ??
                              '—'}
                            °C
                          </b>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <span className="block text-[9px] text-slate-400">
                            PET
                          </span>
                          <b>{selected.pet ?? detail?.current.pet ?? '—'}°C</b>
                        </div>
                      </div>
                      <div
                        className="mt-5 rounded-xl border p-4 text-xs"
                        style={{
                          background: riskStyle[selected.risk].soft,
                          borderColor: `${riskStyle[selected.risk].color}22`,
                          color: riskStyle[selected.risk].color,
                        }}
                      >
                        <b className="mb-1 block">What to do now</b>
                        {selected.action ??
                          detail?.current.action ??
                          'Increase hydration messaging and reduce peak-hour exposure.'}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-[0_14px_38px_rgb(37_58_88/7%)]">
                    <CardHeader>
                      <PanelTitle
                        eyebrow="SPATIAL VIEW"
                        title="India risk map"
                        action={
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setView('map')}
                          >
                            Explore <ChevronRight />
                          </Button>
                        }
                      />
                    </CardHeader>
                    <CardContent>
                      <IndiaMap
                        districts={districts}
                        selected={selected}
                        onSelect={selectDistrict}
                      />
                    </CardContent>
                  </Card>
                </div>
                <div className="grid gap-5">
                  <Card className="border-0 shadow-[0_14px_38px_rgb(37_58_88/7%)]">
                    <CardHeader>
                      <PanelTitle
                        eyebrow="NEXT WARNING WINDOW"
                        title="Risk horizon"
                      />
                    </CardHeader>
                    <CardContent>
                      {detailLoading && !detail ? (
                        <Loading />
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-2">
                            {(
                              detail?.horizons ??
                              [24, 48, 72].map((hours, index) => ({
                                horizon_hours: hours,
                                probability: Math.max(
                                  28,
                                  selected.probability - index * 12,
                                ),
                                predicted_class:
                                  index === 2
                                    ? ('Moderate' as Risk)
                                    : selected.risk,
                                htsi: selected.htsi,
                              }))
                            ).map((item) => (
                              <button
                                key={item.horizon_hours}
                                onClick={() => setView('forecast')}
                                className="rounded-xl border border-slate-200 p-3 text-center hover:border-blue-200 hover:bg-blue-50/40"
                              >
                                <span className="font-mono text-[9px] text-slate-400">
                                  {item.horizon_hours}H
                                </span>
                                <strong className="my-2 block text-xl text-orange-700">
                                  {item.probability}%
                                </strong>
                                <RiskBadge risk={item.predicted_class} />
                              </button>
                            ))}
                          </div>
                          <div className="mt-4 flex items-center gap-3 rounded-xl bg-blue-50 p-3 text-xs text-blue-900">
                            <CloudSun className="h-5 w-5" />
                            <span>
                              Peak risk:{' '}
                              <b>
                                {detail?.peak
                                  ? new Date(detail.peak.time).toLocaleString(
                                      'en-IN',
                                      { weekday: 'short', hour: 'numeric' },
                                    )
                                  : 'tomorrow afternoon'}
                              </b>
                              .
                            </span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-[0_14px_38px_rgb(37_58_88/7%)]">
                    <CardHeader>
                      <PanelTitle
                        eyebrow="PRIORITY LOCATIONS"
                        title="Hotspots"
                        note="Ranked by current HTSI."
                      />
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {hotspots.map((item, index) => (
                        <button
                          key={item.district}
                          onClick={() => selectDistrict(item)}
                          className="grid w-full grid-cols-[30px_1fr_auto_38px] items-center gap-2 rounded-xl px-2 py-2.5 text-left hover:bg-slate-50"
                        >
                          <span className="font-mono text-[10px] text-slate-400">
                            0{index + 1}
                          </span>
                          <span>
                            <b className="block text-xs">{item.district}</b>
                            <small className="text-[10px] text-slate-400">
                              {item.temp}°C · {item.humidity}% RH
                            </small>
                          </span>
                          <RiskBadge risk={item.risk} />
                          <strong
                            className="text-right"
                            style={{ color: riskStyle[item.risk].color }}
                          >
                            {item.htsi}
                          </strong>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                <Card className="border-0">
                  <CardHeader>
                    <PanelTitle
                      eyebrow="EXPOSURE LENS"
                      title="Who needs help first?"
                      note="Human context changes the risk."
                    />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {detail?.profiles?.slice(0, 6).map((item) => (
                      <div
                        key={item.profile}
                        className="grid grid-cols-[1fr_auto_42px] items-center gap-2 rounded-xl bg-slate-50 p-3"
                      >
                        <div>
                          <b className="block text-xs">{item.profile}</b>
                          <small className="text-[9px] text-slate-400">
                            {item.multiplier}× exposure
                          </small>
                        </div>
                        <RiskBadge risk={item.risk} />
                        <strong style={{ color: riskStyle[item.risk].color }}>
                          {item.htsi}
                        </strong>
                      </div>
                    )) ?? <Loading />}
                  </CardContent>
                </Card>
                <Card className="border-0">
                  <CardHeader>
                    <PanelTitle
                      eyebrow="PERSONALIZED SCREENING"
                      title="Adjust exposure context"
                      note="Not a medical diagnosis."
                    />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[10px] font-semibold text-slate-500">
                        AGE
                        <NativeSelect
                          className="mt-1 w-full"
                          value={personalAge}
                          onChange={(event) =>
                            setPersonalAge(event.target.value)
                          }
                        >
                          <NativeSelectOption value="adult">
                            Adult
                          </NativeSelectOption>
                          <NativeSelectOption value="child">
                            Child
                          </NativeSelectOption>
                          <NativeSelectOption value="elderly">
                            Older adult
                          </NativeSelectOption>
                        </NativeSelect>
                      </label>
                      <label className="text-[10px] font-semibold text-slate-500">
                        ACTIVITY
                        <NativeSelect
                          className="mt-1 w-full"
                          value={personalActivity}
                          onChange={(event) =>
                            setPersonalActivity(event.target.value)
                          }
                        >
                          <NativeSelectOption value="resting">
                            Resting
                          </NativeSelectOption>
                          <NativeSelectOption value="moderate">
                            Moderate
                          </NativeSelectOption>
                          <NativeSelectOption value="heavy">
                            Heavy work
                          </NativeSelectOption>
                        </NativeSelect>
                      </label>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={acclimatized}
                        onChange={(event) =>
                          setAcclimatized(event.target.checked)
                        }
                      />{' '}
                      Acclimatized to local heat
                    </label>
                    <Button className="w-full" onClick={calculatePersonal}>
                      <UserRound />
                      Calculate personal HTSI
                    </Button>
                    {personalResult && (
                      <div className="rounded-xl border bg-slate-50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            Personal HTSI
                          </span>
                          <strong
                            className="text-2xl"
                            style={{
                              color: riskStyle[personalResult.risk_level].color,
                            }}
                          >
                            {personalResult.htsi_score}
                          </strong>
                          <RiskBadge risk={personalResult.risk_level} />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {personalResult.recommended_action}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-0">
                  <CardHeader>
                    <PanelTitle
                      eyebrow="RESPONSE GUIDE"
                      title="Three actions now"
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      [
                        '1',
                        'Observe',
                        'Monitor the forecast and thermal-stress trend.',
                      ],
                      [
                        '2',
                        'Prepare',
                        'Open cooling spaces and adjust outdoor work.',
                      ],
                      [
                        '3',
                        'Alert',
                        'Notify vulnerable groups before the peak.',
                      ],
                    ].map(([number, title, copy]) => (
                      <div key={number} className="flex gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 font-mono text-xs font-bold text-blue-800">
                          {number}
                        </span>
                        <p className="text-xs text-slate-500">
                          <b className="block text-slate-800">{title}</b>
                          {copy}
                        </p>
                      </div>
                    ))}
                    <Button
                      className="w-full"
                      onClick={() => setView('alerts')}
                    >
                      <Bell />
                      Open alert center
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {view === 'forecast' && (
            <div className="space-y-5">
              {detailLoading && !detail ? (
                <Loading />
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {detail?.horizons.map((item) => (
                      <Stat
                        key={item.horizon_hours}
                        label={`${item.horizon_hours}-hour warning`}
                        value={`${item.probability}%`}
                        detail={`${item.predicted_class} · HTSI ${item.htsi}`}
                        tone={
                          item.predicted_class === 'Extreme'
                            ? 'red'
                            : item.predicted_class === 'High'
                              ? 'amber'
                              : 'blue'
                        }
                      />
                    ))}
                  </div>
                  <div className="grid gap-5 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <PanelTitle
                          eyebrow="FIVE-DAY OUTLOOK"
                          title="Forecast HTSI"
                          note="Three-hour rolling thermal-stress signal."
                        />
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{ htsi: { label: 'HTSI', color: '#f59e0b' } }}
                          className="h-[300px] w-full"
                        >
                          <AreaChart data={detail?.forecast ?? []}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="label" minTickGap={36} />
                            <YAxis domain={[0, 100]} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area
                              type="monotone"
                              dataKey="htsi"
                              stroke="var(--color-htsi)"
                              fill="var(--color-htsi)"
                              fillOpacity={0.16}
                              strokeWidth={2.5}
                            />
                          </AreaChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <PanelTitle
                          eyebrow="TEMPERATURE"
                          title="Heat profile"
                          note="Colour follows predicted risk class."
                        />
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            temp: { label: 'Temperature °C', color: '#2563eb' },
                          }}
                          className="h-[300px] w-full"
                        >
                          <BarChart data={detail?.forecast ?? []}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="label" minTickGap={36} />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="temp" radius={[5, 5, 0, 0]}>
                              {detail?.forecast.map((item, index) => (
                                <Cell
                                  key={index}
                                  fill={riskStyle[item.risk].color}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader>
                      <PanelTitle
                        eyebrow="EXPLAINABLE PREDICTION"
                        title="Why the risk moves"
                        note="Temperature, humidity, WBGT, PET, solar load, UV, wind and time of day contribute to each class."
                      />
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {dashboard?.model.feature_names.map((feature, index) => (
                        <div
                          key={feature}
                          className="rounded-xl bg-slate-50 p-3"
                        >
                          <span className="block text-xs font-semibold capitalize">
                            {feature}
                          </span>
                          <div className="mt-3 h-1.5 rounded-full bg-slate-200">
                            <i
                              className="block h-full rounded-full bg-blue-700"
                              style={{ width: `${92 - index * 7}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {view === 'map' && (
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardHeader>
                  <PanelTitle
                    eyebrow="SPATIAL COMMAND"
                    title="India district risk map"
                    note="Select a marker to return to its command center."
                  />
                </CardHeader>
                <CardContent>
                  <IndiaMap
                    districts={districts}
                    selected={selected}
                    onSelect={selectDistrict}
                    expanded
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <PanelTitle
                    eyebrow="ALL LOCATIONS"
                    title={`${districts.length} monitored districts`}
                  />
                </CardHeader>
                <CardContent className="max-h-[500px] space-y-1 overflow-auto">
                  {[...districts]
                    .sort((a, b) => b.htsi - a.htsi)
                    .map((item) => (
                      <button
                        key={item.district}
                        onClick={() => selectDistrict(item)}
                        className="grid w-full grid-cols-[1fr_auto_48px] items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50"
                      >
                        <span>
                          <b className="block text-sm">{item.district}</b>
                          <small className="text-slate-400">
                            {item.temp}°C · {item.humidity}% RH
                          </small>
                        </span>
                        <RiskBadge risk={item.risk} />
                        <strong style={{ color: riskStyle[item.risk].color }}>
                          {item.htsi}
                        </strong>
                      </button>
                    ))}
                </CardContent>
              </Card>
            </div>
          )}

          {view === 'model' && (
            <div className="space-y-5">
              {dashboard ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat
                      label="Test accuracy"
                      value={`${dashboard.model.metrics.accuracy_pct}%`}
                      detail={`${dashboard.model.test_samples} chronological holdout rows`}
                      tone="green"
                    />
                    <Stat
                      label="Macro F1"
                      value={`${dashboard.model.metrics.macro_f1_pct}%`}
                      detail="Observed-class balance"
                      tone="amber"
                    />
                    <Stat
                      label="False alarms"
                      value={dashboard.model.metrics.false_alarms}
                      detail="High+ predicted, lower actual"
                      tone="red"
                    />
                    <Stat
                      label="Missed events"
                      value={dashboard.model.metrics.missed_events}
                      detail="High+ actual, lower predicted"
                      tone="purple"
                    />
                  </div>
                  <Card>
                    <CardHeader>
                      <PanelTitle
                        eyebrow={dashboard.model.model_version}
                        title={dashboard.model.model_type}
                        note={dashboard.model.data_source}
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
                        {dashboard.model.label_note}
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {dashboard.model.feature_names.map((name, index) => (
                          <div
                            key={name}
                            className="grid grid-cols-[130px_1fr] items-center gap-3 rounded-xl bg-slate-50 p-3"
                          >
                            <span className="text-xs capitalize">{name}</span>
                            <div className="h-2 rounded-full bg-slate-200">
                              <i
                                className="block h-full rounded-full bg-blue-700"
                                style={{ width: `${95 - index * 8}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Loading />
              )}
            </div>
          )}

          {view === 'authority' && (
            <div className="space-y-5">
              {dashboard ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat
                      label="Coverage"
                      value={dashboard.authority.coverage}
                      detail="districts monitored"
                    />
                    <Stat
                      label="High+ zones"
                      value={dashboard.authority.high_risk_count}
                      detail="require action"
                      tone="red"
                    />
                    <Stat
                      label="Active alerts"
                      value={dashboard.authority.active_alerts}
                      detail="awaiting acknowledgement"
                      tone="amber"
                    />
                    <Stat
                      label="Open incidents"
                      value={dashboard.authority.open_incidents}
                      detail="community field reports"
                      tone="purple"
                    />
                  </div>
                  <div className="grid gap-5 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <PanelTitle
                          eyebrow="PRIORITY QUEUE"
                          title="Highest-risk locations"
                          action={
                            <Button
                              variant="outline"
                              onClick={() =>
                                window.open('/api/export', '_blank')
                              }
                            >
                              <Download />
                              CSV brief
                            </Button>
                          }
                        />
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {dashboard.authority.highest_risk_locations.map(
                          (item) => (
                            <div
                              key={item.district}
                              className="grid grid-cols-[1fr_auto_54px_70px] items-center gap-3 rounded-xl bg-slate-50 p-3"
                            >
                              <b>{item.district}</b>
                              <RiskBadge risk={item.risk} />
                              <strong
                                style={{ color: riskStyle[item.risk].color }}
                              >
                                {item.htsi}
                              </strong>
                              <small className="text-right text-slate-400">
                                {item.probability}% High+
                              </small>
                            </div>
                          ),
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <PanelTitle
                          eyebrow="RESPONSE PLAYBOOK"
                          title="Recommended now"
                          action={
                            <Button
                              variant="outline"
                              onClick={() => window.print()}
                            >
                              <FileText />
                              Print / PDF
                            </Button>
                          }
                        />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {dashboard.authority.recommended_interventions.map(
                          (item) => (
                            <div
                              key={item}
                              className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900"
                            >
                              <Check className="mt-0.5 h-4 w-4 shrink-0" />
                              {item}
                            </div>
                          ),
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Loading />
              )}
            </div>
          )}

          {view === 'response' && (
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <PanelTitle
                      eyebrow="LIVE OPEN DATA"
                      title="Nearby response facilities"
                      note="Hospitals, clinics, community centres and water points from OpenStreetMap."
                    />
                  </CardHeader>
                  <CardContent>
                    {detailLoading ? (
                      <Loading label="Finding nearby support" />
                    ) : detail?.facilities?.length ? (
                      <div className="max-h-[430px] space-y-2 overflow-auto">
                        {detail.facilities.map((item) => (
                          <a
                            key={item.id}
                            href={item.map_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:border-blue-200 hover:bg-blue-50/30"
                          >
                            <div>
                              <b className="block text-sm">{item.name}</b>
                              <small className="capitalize text-slate-400">
                                {item.type}
                              </small>
                            </div>
                            <span className="flex items-center gap-2">
                              {item.emergency && (
                                <Badge variant="destructive">Emergency</Badge>
                              )}
                              <ExternalLink className="h-4 w-4 text-slate-400" />
                            </span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <Empty>
                        No nearby facilities were returned. OpenStreetMap
                        availability can vary; the district alert workflow
                        remains available.
                      </Empty>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <PanelTitle
                      eyebrow="COMMUNITY SIGNAL"
                      title="Report a heat incident"
                      note="Saved to the authority audit trail."
                    />
                  </CardHeader>
                  <CardContent>
                    <form
                      className="grid gap-3 sm:grid-cols-2"
                      onSubmit={submitIncident}
                    >
                      <label className="text-[10px] font-semibold text-slate-500">
                        INCIDENT TYPE
                        <NativeSelect
                          className="mt-1 w-full"
                          value={incidentType}
                          onChange={(event) =>
                            setIncidentType(event.target.value)
                          }
                        >
                          <NativeSelectOption value="heat illness">
                            Heat illness
                          </NativeSelectOption>
                          <NativeSelectOption value="water shortage">
                            Water shortage
                          </NativeSelectOption>
                          <NativeSelectOption value="power outage">
                            Power outage
                          </NativeSelectOption>
                          <NativeSelectOption value="cooling centre issue">
                            Cooling centre issue
                          </NativeSelectOption>
                          <NativeSelectOption value="outdoor worker exposure">
                            Outdoor worker exposure
                          </NativeSelectOption>
                        </NativeSelect>
                      </label>
                      <label className="text-[10px] font-semibold text-slate-500">
                        SEVERITY
                        <NativeSelect
                          className="mt-1 w-full"
                          value={incidentSeverity}
                          onChange={(event) =>
                            setIncidentSeverity(event.target.value as Risk)
                          }
                        >
                          {Object.keys(riskStyle).map((risk) => (
                            <NativeSelectOption key={risk}>
                              {risk}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </label>
                      <label className="text-[10px] font-semibold text-slate-500 sm:col-span-2">
                        REPORTER
                        <Input
                          className="mt-1"
                          value={reporter}
                          onChange={(event) => setReporter(event.target.value)}
                          placeholder="Name or organisation (optional)"
                        />
                      </label>
                      <label className="text-[10px] font-semibold text-slate-500 sm:col-span-2">
                        WHAT HAPPENED?
                        <Textarea
                          className="mt-1 min-h-28"
                          value={incidentDescription}
                          onChange={(event) =>
                            setIncidentDescription(event.target.value)
                          }
                          placeholder="Describe the location, incident and immediate need."
                        />
                      </label>
                      <Button
                        className="sm:col-span-2"
                        type="submit"
                        disabled={incidentDescription.trim().length < 10}
                      >
                        <Send />
                        Submit incident
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <PanelTitle
                    eyebrow="RECENT REPORTS"
                    title={`${selected.district} incident log · ${incidents.length}`}
                  />
                </CardHeader>
                <CardContent>
                  {incidents.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {incidents.slice(0, 10).map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-3 rounded-xl border border-slate-200 p-4"
                        >
                          <RiskBadge risk={item.severity} />
                          <div className="min-w-0">
                            <b className="capitalize">{item.incident_type}</b>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.description}
                            </p>
                            <small className="mt-2 block text-[10px] text-slate-400">
                              {item.reporter} ·{' '}
                              {new Date(item.created_at).toLocaleString(
                                'en-IN',
                              )}{' '}
                              · {item.status}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty>
                      No field incidents recorded for this district.
                    </Empty>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {view === 'validation' && (
            <div className="space-y-5">
              {dashboard ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat
                      label="Accuracy"
                      value={`${dashboard.validation.accuracy_pct}%`}
                      detail="364 held-out samples"
                      tone="green"
                    />
                    <Stat
                      label="Precision"
                      value={`${dashboard.validation.precision_pct}%`}
                      detail="macro average"
                    />
                    <Stat
                      label="Recall"
                      value={`${dashboard.validation.recall_pct}%`}
                      detail="macro average"
                      tone="amber"
                    />
                    <Stat
                      label="Macro F1"
                      value={`${dashboard.validation.macro_f1_pct}%`}
                      detail="observed classes"
                      tone="purple"
                    />
                  </div>
                  <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                    <Card>
                      <CardHeader>
                        <PanelTitle
                          eyebrow="HISTORICAL REPLAY"
                          title="Observed vs predicted"
                          note="Transparent held-out replay from the active real-weather training run."
                        />
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            actual_htsi: {
                              label: 'Actual HTSI',
                              color: '#dc2626',
                            },
                            predicted_probability: {
                              label: 'Predicted probability',
                              color: '#2563eb',
                            },
                          }}
                          className="h-[300px] w-full"
                        >
                          <AreaChart data={dashboard.validation.replay}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="label" />
                            <YAxis domain={[0, 100]} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area
                              type="monotone"
                              dataKey="actual_htsi"
                              stroke="var(--color-actual_htsi)"
                              fill="var(--color-actual_htsi)"
                              fillOpacity={0.08}
                            />
                            <Area
                              type="monotone"
                              dataKey="predicted_probability"
                              stroke="var(--color-predicted_probability)"
                              fill="var(--color-predicted_probability)"
                              fillOpacity={0.08}
                            />
                          </AreaChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <PanelTitle
                          eyebrow="ERROR ANALYSIS"
                          title="Confusion matrix"
                          note={`${dashboard.validation.false_alarms} false alarms · ${dashboard.validation.missed_events} missed High+ events`}
                        />
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-2">
                          {dashboard.validation.confusion_matrix.flatMap(
                            (row, rowIndex) =>
                              row.map((value, colIndex) => (
                                <div
                                  key={`${rowIndex}-${colIndex}`}
                                  className={`rounded-xl p-3 text-center ${rowIndex === colIndex ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}
                                >
                                  <strong className="block text-lg">
                                    {value}
                                  </strong>
                                  <small className="text-[8px]">
                                    {dashboard.validation.labels[
                                      rowIndex
                                    ].slice(0, 3)}
                                    →
                                    {dashboard.validation.labels[
                                      colIndex
                                    ].slice(0, 3)}
                                  </small>
                                </div>
                              )),
                          )}
                        </div>
                        <div className="mt-4 space-y-2">
                          {Object.entries(
                            dashboard.validation.class_support,
                          ).map(([risk, count]) => (
                            <div
                              key={risk}
                              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"
                            >
                              <span>{risk}</span>
                              <b>{count} samples</b>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
                    These metrics use real ERA5-Seamless weather and transparent
                    HTSI proxy labels. Verified official IMD district/date
                    outcomes are still required before claiming official
                    calibration.
                  </div>
                </>
              ) : (
                <Loading />
              )}
            </div>
          )}

          {view === 'history' && (
            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <PanelTitle
                    eyebrow="PERSISTENT RECORD"
                    title="Recent observations"
                    note={`${historyData?.counts.observations ?? 0} stored rows for ${selected.district}.`}
                  />
                </CardHeader>
                <CardContent>
                  {historyData?.observations.length ? (
                    <div className="max-h-[520px] space-y-2 overflow-auto">
                      {historyData.observations.map((row, index) => (
                        <div
                          key={`${row.id}-${index}`}
                          className="grid grid-cols-[1fr_50px_auto] items-center gap-3 rounded-xl bg-slate-50 p-3"
                        >
                          <span>
                            <b className="block text-xs">
                              {new Date(String(row.observed_at)).toLocaleString(
                                'en-IN',
                              )}
                            </b>
                            <small className="text-slate-400">
                              {String(row.temperature)}°C ·{' '}
                              {String(row.humidity)}% RH · {String(row.source)}
                            </small>
                          </span>
                          <strong>{String(row.htsi)}</strong>
                          <RiskBadge risk={String(row.risk) as Risk} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty>
                      Refresh the command center to create persistent
                      observations.
                    </Empty>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <PanelTitle
                    eyebrow="PREDICTION TRACK"
                    title="Forecast records"
                    note={`${historyData?.counts.predictions ?? 0} stored horizons for later comparison.`}
                  />
                </CardHeader>
                <CardContent>
                  {historyData?.predictions.length ? (
                    <div className="max-h-[520px] space-y-2 overflow-auto">
                      {historyData.predictions.map((row, index) => (
                        <div
                          key={`${row.id}-${index}`}
                          className="grid grid-cols-[1fr_55px_auto] items-center gap-3 rounded-xl bg-slate-50 p-3"
                        >
                          <span>
                            <b className="block text-xs">
                              {new Date(
                                String(row.predicted_at),
                              ).toLocaleString('en-IN')}
                            </b>
                            <small className="text-slate-400">
                              {String(row.horizon_hours)}h horizon ·{' '}
                              {String(row.source)}
                            </small>
                          </span>
                          <strong>{String(row.probability)}%</strong>
                          <RiskBadge
                            risk={String(row.predicted_class) as Risk}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty>
                      Open a district forecast to create persistent predictions.
                    </Empty>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {view === 'alerts' && (
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                <Card>
                  <CardHeader>
                    <PanelTitle
                      eyebrow="ONE REAL CHANNEL"
                      title="Browser early warning"
                      note="English, Hindi and Telugu messages are supported. SMS and webhooks require provider credentials."
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="text-[10px] font-semibold text-slate-500">
                      RISK LEVEL
                      <NativeSelect
                        className="mt-1 w-full"
                        value={alertRisk}
                        onChange={(event) =>
                          setAlertRisk(event.target.value as Risk)
                        }
                      >
                        {(['High', 'Extreme', 'Emergency'] as Risk[]).map(
                          (risk) => (
                            <NativeSelectOption key={risk}>
                              {risk}
                            </NativeSelectOption>
                          ),
                        )}
                      </NativeSelect>
                    </label>
                    <label className="text-[10px] font-semibold text-slate-500">
                      LANGUAGE
                      <NativeSelect
                        className="mt-1 w-full"
                        value={alertLanguage}
                        onChange={(event) =>
                          setAlertLanguage(event.target.value)
                        }
                      >
                        <NativeSelectOption value="en">
                          English
                        </NativeSelectOption>
                        <NativeSelectOption value="hi">
                          Hindi
                        </NativeSelectOption>
                        <NativeSelectOption value="te">
                          Telugu
                        </NativeSelectOption>
                      </NativeSelect>
                    </label>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800">
                      <b className="block">Browser channel ready</b>Uses this
                      device&apos;s notification permission and stores the alert
                      in the audit trail.
                    </div>
                    <Button className="w-full" onClick={sendAlert}>
                      <Bell />
                      Send and record warning
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <PanelTitle
                      eyebrow="AUDIT TRAIL"
                      title={`${selected.district} alert history · ${alerts.length}`}
                    />
                  </CardHeader>
                  <CardContent>
                    {alerts.length ? (
                      <div className="max-h-[520px] space-y-2 overflow-auto">
                        {alerts.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-slate-200 p-4"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <RiskBadge risk={item.risk} />
                              <b className="text-xs">{item.id}</b>
                              <span className="ml-auto text-[10px] text-slate-400">
                                {new Date(item.created_at).toLocaleString(
                                  'en-IN',
                                )}
                              </span>
                            </div>
                            <p className="mt-3 text-xs leading-relaxed text-slate-600">
                              {item.message}
                            </p>
                            <div className="mt-3 flex items-center justify-between">
                              <small className="text-slate-400">
                                {item.channel} · {item.language} · {item.status}
                              </small>
                              {item.status !== 'acknowledged' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => acknowledgeAlert(item.id)}
                                >
                                  <Check />
                                  Acknowledge
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty>
                        No warnings have been sent for this district.
                      </Empty>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <footer className="mt-10 flex flex-wrap justify-between gap-2 border-t border-slate-200 py-6 text-[10px] text-slate-400">
            <span>ThermoWatch · SIH26083</span>
            <span>
              Decision support · not a medical diagnosis or official government
              warning
            </span>
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noreferrer"
              className="text-blue-700"
            >
              Weather data by Open-Meteo
            </a>
          </footer>
        </main>
      </section>
    </div>
  );
}
