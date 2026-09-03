'use client';
/* oxlint-disable next/no-html-link-for-pages -- Sites auth requires top-level anchor navigation. */
/* oxlint-disable typescript/no-deprecated -- Recharts 3.8 still uses Cell for per-bar risk colours. */

import {
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
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
import type { AlertChannel } from '@/lib/alerting';
import { LocalAssistant } from '@/components/local-assistant';

type Risk = 'Low' | 'Moderate' | 'High' | 'Extreme' | 'Emergency';
type Contribution = {
  feature: string;
  label: string;
  contribution_pct: number;
  direction: 'raises' | 'reduces';
  value: number;
};
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
  solar?: number;
  model_confidence?: number;
  high_risk_probability?: number;
  explanation?: Contribution[];
  horizon_hours?: 24 | 48 | 72;
  valid_at?: string;
  action?: string;
};
type ForecastPoint = {
  time: string;
  label: string;
  temp: number;
  humidity: number;
  htsi: number;
  risk: Risk;
  model_confidence?: number;
  high_risk_probability?: number;
  explanation?: Contribution[];
};
type Horizon = {
  horizon_hours: number;
  predicted_class: Risk;
  probability: number;
  high_risk_probability: number;
  htsi: number;
  explanation: Contribution[];
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
type AutomaticWarning = {
  id: string;
  district: string;
  horizon_hours: number;
  risk: Risk;
  probability: number;
  htsi: number;
  model_version: string;
  status: string;
  valid_at: string;
  created_at: string;
};
type SessionData = {
  id: string | null;
  email: string | null;
  name: string | null;
  role: 'public' | 'officer' | 'admin';
  signed_in: boolean;
};
type ForecastMapData = {
  layers: Record<'24' | '48' | '72', District[]>;
  generated_at: string;
  warning_count: number;
  model_version: string;
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
    calibration_samples: number;
    test_samples: number;
    train_period: string;
    calibration_period: string;
    test_period: string;
    metrics: Record<string, number>;
    feature_names: string[];
    feature_importance: Array<{
      feature: string;
      label: string;
      importance_pct: number;
    }>;
    label_note: string;
    artifact_sha256: string;
  };
  authority: {
    coverage: number;
    high_risk_count: number;
    active_alerts: number;
    automatic_warnings: number;
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
    brier_score: number;
    test_samples: number;
    test_period: string;
    methodology: string;
    caveat: string;
    district_accuracy_pct: Record<string, number>;
    replay: Array<{
      label: string;
      timestamp: string;
      district: string;
      actual_htsi: number;
      predicted_probability: number;
    }>;
    replay_cases: Array<{
      id: string;
      district: string;
      timestamp: string;
      observed: {
        temperature_c: number;
        humidity_pct: number;
        wind_speed_ms: number;
        shortwave_radiation_wm2: number;
        htsi: number;
        risk: Risk;
      };
      prediction: {
        risk: Risk;
        confidence_pct: number;
        high_risk_probability_pct: number;
        probabilities: Record<Risk, number>;
        correct: boolean;
        explanation: Contribution[];
      };
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

type UiLanguage = 'en' | 'hi' | 'te' | 'kn';
const shellCopy: Record<
  UiLanguage,
  {
    nav: Record<View, string>;
    hero: string;
    overviewNote: string;
    viewNote: string;
    operational: string;
    monitored: string;
    refresh: string;
    officerSignIn: string;
    disasterManagement: string;
    decisionSupport: string;
  }
> = {
  en: {
    nav: Object.fromEntries(
      navigation.map((item) => [item.id, item.label]),
    ) as Record<View, string>,
    hero: 'Heat conditions, made actionable.',
    overviewNote:
      'See where heat is rising, who is exposed, and what response should come next.',
    viewNote:
      'Use transparent signals to make an earlier, more targeted response decision.',
    operational: 'System operational',
    monitored: 'districts monitored',
    refresh: 'Refresh',
    officerSignIn: 'OFFICER SIGN IN',
    disasterManagement: 'DISASTER MANAGEMENT',
    decisionSupport:
      'Decision support · not a medical diagnosis or official government warning',
  },
  hi: {
    nav: {
      overview: 'कमांड सेंटर',
      forecast: 'पूर्वानुमान समयरेखा',
      map: 'जोखिम मानचित्र',
      model: 'व्याख्यात्मक AI',
      authority: 'प्राधिकरण',
      response: 'प्रतिक्रिया केंद्र',
      validation: 'सत्यापन',
      history: 'इतिहास',
      alerts: 'चेतावनी केंद्र',
    },
    hero: 'गर्मी की स्थिति, अब कार्रवाई योग्य।',
    overviewNote:
      'देखें गर्मी कहाँ बढ़ रही है, कौन प्रभावित है और अगली प्रतिक्रिया क्या होनी चाहिए।',
    viewNote:
      'पहले और अधिक लक्षित निर्णय के लिए पारदर्शी संकेतों का उपयोग करें।',
    operational: 'सिस्टम चालू है',
    monitored: 'जिलों की निगरानी',
    refresh: 'रीफ़्रेश',
    officerSignIn: 'अधिकारी साइन इन',
    disasterManagement: 'आपदा प्रबंधन',
    decisionSupport:
      'निर्णय सहायता · चिकित्सा निदान या आधिकारिक सरकारी चेतावनी नहीं',
  },
  te: {
    nav: {
      overview: 'కమాండ్ సెంటర్',
      forecast: 'అంచనా కాలరేఖ',
      map: 'ప్రమాద పటం',
      model: 'వివరణాత్మక AI',
      authority: 'అధికార విభాగం',
      response: 'ప్రతిస్పందన కేంద్రం',
      validation: 'ధృవీకరణ',
      history: 'చరిత్ర',
      alerts: 'హెచ్చరిక కేంద్రం',
    },
    hero: 'వేడి పరిస్థితులను చర్యగా మార్చండి.',
    overviewNote:
      'వేడి ఎక్కడ పెరుగుతోంది, ఎవరు ప్రభావితమవుతున్నారు, తదుపరి చర్య ఏమిటో చూడండి.',
    viewNote:
      'ముందస్తు, లక్ష్యిత నిర్ణయాలకు పారదర్శక సంకేతాలను ఉపయోగించండి.',
    operational: 'వ్యవస్థ పనిచేస్తోంది',
    monitored: 'జిల్లాల పర్యవేక్షణ',
    refresh: 'రిఫ్రెష్',
    officerSignIn: 'అధికారి సైన్ ఇన్',
    disasterManagement: 'విపత్తు నిర్వహణ',
    decisionSupport:
      'నిర్ణయ సహాయం · వైద్య నిర్ధారణ లేదా అధికారిక ప్రభుత్వ హెచ్చరిక కాదు',
  },
  kn: {
    nav: {
      overview: 'ಕಮಾಂಡ್ ಕೇಂದ್ರ',
      forecast: 'ಮುನ್ಸೂಚನೆ ಅವಧಿ',
      map: 'ಅಪಾಯ ನಕ್ಷೆ',
      model: 'ವಿವರಣಾತ್ಮಕ AI',
      authority: 'ಪ್ರಾಧಿಕಾರ',
      response: 'ಪ್ರತಿಕ್ರಿಯಾ ಕೇಂದ್ರ',
      validation: 'ಮೌಲ್ಯಮಾಪನ',
      history: 'ಇತಿಹಾಸ',
      alerts: 'ಎಚ್ಚರಿಕೆ ಕೇಂದ್ರ',
    },
    hero: 'ಉಷ್ಣ ಪರಿಸ್ಥಿತಿಗಳನ್ನು ಕ್ರಮವಾಗಿ ಪರಿವರ್ತಿಸಿ.',
    overviewNote:
      'ಉಷ್ಣತೆ ಎಲ್ಲಿ ಹೆಚ್ಚುತ್ತಿದೆ, ಯಾರು ಅಪಾಯದಲ್ಲಿದ್ದಾರೆ ಮತ್ತು ಮುಂದಿನ ಕ್ರಮ ಏನು ಎಂಬುದನ್ನು ನೋಡಿ.',
    viewNote:
      'ಮುಂಚಿತ ಮತ್ತು ಗುರಿಯುಕ್ತ ನಿರ್ಧಾರಕ್ಕಾಗಿ ಪಾರದರ್ಶಕ ಸೂಚನೆಗಳನ್ನು ಬಳಸಿ.',
    operational: 'ವ್ಯವಸ್ಥೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ',
    monitored: 'ನಗರಗಳ ಮೇಲ್ವಿಚಾರಣೆ',
    refresh: 'ರಿಫ್ರೆಶ್',
    officerSignIn: 'ಅಧಿಕಾರಿ ಸೈನ್ ಇನ್',
    disasterManagement: 'ವಿಪತ್ತು ನಿರ್ವಹಣೆ',
    decisionSupport:
      'ನಿರ್ಧಾರ ಸಹಾಯ · ವೈದ್ಯಕೀಯ ನಿರ್ಣಯ ಅಥವಾ ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಎಚ್ಚರಿಕೆ ಅಲ್ಲ',
  },
};

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
        <p className="font-mono text-[9px] font-semibold tracking-[0.18em] text-[#9a6d19]">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-[#14213a]">
          {title}
        </h2>
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
    <div
      className={`rounded-[1.15rem] border p-4 shadow-[inset_0_1px_rgb(255_255_255/70%)] ${colors[tone]}`}
    >
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
  layerLabel = 'Live conditions',
}: {
  districts: District[];
  selected: District;
  onSelect: (district: District) => void;
  expanded?: boolean;
  layerLabel?: string;
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
      className={`relative overflow-hidden rounded-[1.6rem] border border-[#dbe1e8] bg-[radial-gradient(circle_at_50%_34%,#ffffff_0%,#f2f5f7_56%,#e8edf2_100%)] shadow-[inset_0_1px_rgb(255_255_255/90%)] ${expanded ? 'h-[520px] sm:h-[600px]' : 'h-[390px]'}`}
    >
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-white/80 bg-white/85 px-3 py-1.5 shadow-sm backdrop-blur">
        <span className="flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-600">
          <i className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgb(16_185_129/12%)]" />
          {layerLabel} · {districts.length} districts
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
          {selected.high_risk_probability !== undefined && (
            <> · {Math.round(selected.high_risk_probability)}% High+</>
          )}
        </span>
      </div>
      <svg
        viewBox={indiaMap.viewBox}
        className="h-full w-full px-8 pb-14 pt-12 drop-shadow-[0_18px_24px_rgb(37_58_88/12%)]"
        aria-label={`Geographic heat-risk map of India showing ${districts.length} monitored cities`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="india-land" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#fffdf8" />
            <stop offset="52%" stopColor="#edf2f5" />
            <stop offset="100%" stopColor="#dfe8ef" />
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
              stroke="#afbfcb"
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
          const markerRadius = districts.length > 24 ? 8.5 : 11;
          const markerCore = districts.length > 24 ? 4.25 : 5.5;

          return (
            <a
              key={item.district}
              href={`#district-${item.district.toLowerCase().replaceAll(' ', '-')}`}
              tabIndex={0}
              aria-label={`${item.district}: ${item.risk} risk, HTSI ${item.htsi}${item.high_risk_probability !== undefined ? `, ${Math.round(item.high_risk_probability)} percent High plus probability` : ''}`}
              className="group cursor-pointer focus:outline-none"
              onClick={(event) => {
                event.preventDefault();
                onSelect(item);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(item);
                }
              }}
            >
              <title>{`${item.district} · ${item.risk} risk · HTSI ${item.htsi}`}</title>
              <circle cx={point.x} cy={point.y} r="15" fill="transparent" />
              <circle
                cx={point.x}
                cy={point.y}
                r={isSelected ? 13 : markerRadius}
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
                r={isSelected ? 6.5 : markerCore}
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
                    fill="#10213f"
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
            </a>
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
    <div className="rounded-[1.2rem] border border-dashed border-[#d6d0c5] bg-[#f8f6f1] p-8 text-center text-sm text-slate-500">
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
  const [automaticWarnings, setAutomaticWarnings] = useState<
    AutomaticWarning[]
  >([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [session, setSession] = useState<SessionData | null>(null);
  const [forecastMap, setForecastMap] = useState<ForecastMapData | null>(null);
  const [mapHorizon, setMapHorizon] = useState<0 | 24 | 48 | 72>(0);
  const [mapLoading, setMapLoading] = useState(false);
  const [online, setOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine,
  );
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
  const [alertChannel, setAlertChannel] = useState<AlertChannel>('browser');
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>('en');
  const [readinessComplete, setReadinessComplete] = useState(false);
  const [replayCaseId, setReplayCaseId] = useState('');
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
  const copy = shellCopy[uiLanguage];
  const canManage = session?.role === 'officer' || session?.role === 'admin';
  const hotspots = useMemo(
    () => [...districts].sort((a, b) => b.htsi - a.htsi).slice(0, 5),
    [districts],
  );
  const highCount = districts.filter((item) =>
    ['High', 'Extreme', 'Emergency'].includes(item.risk),
  ).length;
  const districtReplayCases = useMemo(
    () =>
      dashboard?.validation.replay_cases.filter(
        (item) => item.district === selectedName,
      ) ?? [],
    [dashboard, selectedName],
  );
  const selectedReplay = useMemo(
    () =>
      districtReplayCases.find((item) => item.id === replayCaseId) ??
      districtReplayCases[0],
    [districtReplayCases, replayCaseId],
  );
  const mapDistricts = useMemo(
    () =>
      mapHorizon === 0
        ? districts
        : (forecastMap?.layers[String(mapHorizon) as '24' | '48' | '72'] ??
          districts),
    [districts, forecastMap, mapHorizon],
  );
  const selectedMapDistrict = useMemo(
    () =>
      mapDistricts.find((item) => item.district === selectedName) ??
      mapDistricts[0],
    [mapDistricts, selectedName],
  );
  const selectedAutomaticWarnings = useMemo(
    () =>
      automaticWarnings.filter(
        (warning) => warning.district === selectedName,
      ),
    [automaticWarnings, selectedName],
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [data, actor] = await Promise.all([
        api<DashboardData>('/api/dashboard'),
        api<SessionData>('/api/session'),
      ]);
      setDashboard(data);
      setDistricts(data.districts);
      setSession(actor);
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

  const loadForecastMap = useCallback(async (refresh = false) => {
    setMapLoading(true);
    try {
      const data = await api<ForecastMapData>(
        `/api/forecast-map${refresh ? '?refresh=true' : ''}`,
      );
      setForecastMap(data);
      const warningData = await api<{ warnings: AutomaticWarning[] }>(
        '/api/warnings',
      );
      setAutomaticWarnings(warningData.warnings);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Forecast map unavailable',
      );
    } finally {
      setMapLoading(false);
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
    const [history, alertData, incidentData, warningData] = await Promise.all([
      api<HistoryData>(`/api/history?district=${encodeURIComponent(district)}`),
      api<{ alerts: AlertRow[] }>(
        `/api/alerts?district=${encodeURIComponent(district)}`,
      ),
      api<{ incidents: IncidentRow[] }>(
        `/api/incidents?district=${encodeURIComponent(district)}`,
      ),
      api<{ warnings: AutomaticWarning[] }>(
        `/api/warnings?district=${encodeURIComponent(district)}`,
      ),
    ]);
    setHistoryData(history);
    setAlerts(alertData.alerts);
    setIncidents(incidentData.incidents);
    setAutomaticWarnings(warningData.warnings);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);
  useEffect(() => {
    const timer = window.setTimeout(
      () => void loadDetail(selectedName, view === 'response'),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [selectedName, view, loadDetail]);
  useEffect(() => {
    if ((view === 'map' || view === 'alerts') && !forecastMap) {
      const timer = window.setTimeout(() => void loadForecastMap(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [view, forecastMap, loadForecastMap]);
  useEffect(() => {
    if (['history', 'alerts', 'response'].includes(view)) {
      const timer = window.setTimeout(
        () =>
          void loadRecords(selectedName).catch(() =>
            setError('Saved records could not be loaded.'),
          ),
        0,
      );
      return () => window.clearTimeout(timer);
    }
  }, [view, selectedName, loadRecords]);
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem('thermowatch-language');
      if (saved === 'hi' || saved === 'te' || saved === 'kn')
        setUiLanguage(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (
      !automaticWarnings.length ||
      !('Notification' in window) ||
      Notification.permission !== 'granted'
    )
      return;
    const timer = window.setTimeout(() => {
      let stored: string[] = [];
      try {
        stored = JSON.parse(
          window.localStorage.getItem('thermowatch-notified-warnings') ?? '[]',
        ) as string[];
      } catch {
        stored = [];
      }
      const notified = new Set(stored);
      const fresh = automaticWarnings.filter(
        (warning) => !notified.has(warning.id),
      );
      fresh.slice(0, 3).forEach((warning) => {
        new Notification(
          `ThermoWatch · ${warning.district} +${warning.horizon_hours}h`,
          {
            body: `${warning.risk} forecast risk · ${Math.round(warning.probability)}% High+ probability.`,
          },
        );
        notified.add(warning.id);
      });
      window.localStorage.setItem(
        'thermowatch-notified-warnings',
        JSON.stringify([...notified].slice(-120)),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [automaticWarnings]);

  function changeLanguage(language: UiLanguage) {
    setUiLanguage(language);
    setAlertLanguage(language);
    window.localStorage.setItem('thermowatch-language', language);
    document.documentElement.lang =
      language === 'hi'
        ? 'hi-IN'
        : language === 'te'
          ? 'te-IN'
          : language === 'kn'
            ? 'kn-IN'
            : 'en-IN';
  }

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

  async function submitIncident(event: SyntheticEvent<HTMLFormElement>) {
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
      if (
        alertChannel === 'browser' &&
        'Notification' in window &&
        Notification.permission === 'default'
      )
        await Notification.requestPermission();
      const result = await api<{
        id: string;
        message: string;
        delivery_mode: 'live' | 'demo';
      }>('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district: selected.district,
          risk: alertRisk,
          channel: alertChannel,
          language: alertLanguage,
        }),
      });
      if (
        alertChannel === 'browser' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      )
        new Notification(`ThermoWatch · ${selected.district}`, {
          body: result.message,
        });
      setNotice(
        result.delivery_mode === 'live'
          ? `Alert ${result.id} sent and stored.`
          : `${alertChannel === 'sms' ? 'SMS' : 'WhatsApp'} demo ${result.id} generated and stored without external delivery.`,
      );
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

  async function runReadinessSimulation() {
    setReadinessComplete(false);
    setNotice('');
    try {
      await Promise.all([
        loadDashboard(),
        loadDetail(selected.district),
        loadForecastMap(true),
      ]);
      setReadinessComplete(true);
      setNotice(
        'Hackathon readiness simulation completed using live APIs, forecast layers and stored model evidence.',
      );
    } catch {
      setError('The readiness simulation could not complete every check.');
    }
  }

  const navLabel = copy.nav[view];
  const sourceLabel = districts.some((item) => item.source === 'open-meteo')
    ? 'Live Open-Meteo connected'
    : 'Resilient demonstration data';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_86%_0%,#dfe8f0_0%,transparent_27rem),linear-gradient(135deg,#f7f4ee_0%,#f2f0eb_48%,#eef2f4_100%)] text-[#17233a] lg:flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[272px] overflow-hidden border-r border-white/10 bg-[linear-gradient(165deg,#112443_0%,#0c1a31_58%,#091426_100%)] px-4 py-6 text-white shadow-[18px_0_60px_rgb(4_13_28/12%)] transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full border border-white/5 bg-blue-400/10 blur-2xl" />
        <div className="relative flex items-center gap-3 px-2 lg:mb-8">
          <span className="grid h-11 w-11 place-items-center rounded-[0.9rem] border border-white/15 bg-white/10 text-[#f2c96c] shadow-[0_12px_30px_rgb(0_0_0/20%)] backdrop-blur">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <strong className="block text-sm tracking-[-0.01em] text-white">
              ThermoWatch
            </strong>
            <span className="font-mono text-[9px] tracking-[0.16em] text-blue-200/55">
              SIH26083 · INDIA
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-white hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setMobileNav(false)}
            aria-label="Close navigation"
          >
            <X />
          </Button>
        </div>
        <nav className="relative mt-7 space-y-1.5" aria-label="Main navigation">
          <p className="px-3 pb-2 font-mono text-[9px] tracking-[0.18em] text-blue-200/45">
            OPERATIONS
          </p>
          {navigation.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => changeView(id)}
              className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c96c] ${view === id ? 'bg-white text-[#10213f] shadow-[0_8px_22px_rgb(0_0_0/18%)]' : 'text-blue-100/65 hover:bg-white/8 hover:text-white'}`}
            >
              <span
                className={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${view === id ? 'bg-[#e9eef6] text-[#234b8b]' : 'bg-white/5 text-blue-100/70 group-hover:bg-white/10 group-hover:text-[#f2c96c]'}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              {copy.nav[id]}
              {id === 'alerts' && (
                <span className="ml-auto rounded-full bg-[#f2c96c] px-2 py-0.5 text-[10px] text-[#352506]">
                  {highCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-6 left-4 right-4 rounded-[1.15rem] border border-white/10 bg-white/[0.06] p-3.5 font-mono text-[10px] text-blue-100/65 backdrop-blur">
          <span
            className={`mr-2 inline-block h-2 w-2 rounded-full ${districts.some((item) => item.source === 'open-meteo') ? 'bg-emerald-500' : 'bg-amber-500'}`}
          />
          {sourceLabel}
          <span className="mt-2 block border-t border-white/8 pt-2 text-[9px] text-blue-200/40">
            Model {dashboard?.model.model_version ?? 'htsi-logit-4.0'}
          </span>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="fixed inset-0 z-40 bg-[#07101f]/55 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation overlay"
        />
      )}

      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-[#d8d3ca]/70 bg-[#f8f6f1]/85 px-4 py-3 backdrop-blur-xl lg:px-10">
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
            <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
              India <span className="mx-2 text-[#b58b3b]">/</span>{' '}
              <b className="text-[#293a54]">{navLabel}</b>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session?.signed_in ? (
              <a
                href="/signout-with-chatgpt?return_to=/"
                target="_top"
                className="hidden rounded-xl border border-[#d8d3ca] bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 sm:block"
                title="Sign out"
              >
                {session.role.toUpperCase()}
              </a>
            ) : (
              <a
                href="/signin-with-chatgpt?return_to=/"
                target="_top"
                className="hidden rounded-xl border border-[#d8d3ca] bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 sm:block"
              >
                {copy.officerSignIn}
              </a>
            )}
            <NativeSelect
              value={uiLanguage}
              onChange={(event) =>
                changeLanguage(event.target.value as UiLanguage)
              }
              aria-label="Interface language"
              className="w-[92px]"
            >
              <NativeSelectOption value="en">English</NativeSelectOption>
              <NativeSelectOption value="hi">हिन्दी</NativeSelectOption>
              <NativeSelectOption value="te">తెలుగు</NativeSelectOption>
              <NativeSelectOption value="kn">ಕನ್ನಡ</NativeSelectOption>
            </NativeSelect>
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
              {copy.refresh}
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-[1540px] p-4 sm:p-6 lg:p-10 xl:px-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-[#d8d3ca]/65 pb-7">
            <div>
              <p className="mb-2.5 flex items-center gap-2 font-mono text-[9px] font-semibold tracking-[0.2em] text-[#9a6d19]">
                <span className="h-px w-7 bg-[#c39a4b]" />
                {copy.disasterManagement} ·{' '}
                {view === 'overview' ? 'LIVE OVERVIEW' : view.toUpperCase()}
              </p>
              <h1 className="text-3xl font-bold tracking-[-0.035em] text-[#12203a] lg:text-[2.65rem] lg:leading-tight">
                {view === 'overview'
                  ? copy.hero
                  : navLabel}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                {view === 'overview'
                  ? copy.overviewNote
                  : copy.viewNote}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-[1.15rem] border border-[#cfdbd3] bg-[#f4faf5]/90 px-4 py-3 shadow-sm">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <b className="block text-xs">{copy.operational}</b>
                <span className="text-[11px] text-emerald-700">
                  {districts.length} {copy.monitored}
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
          {!online && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <CloudSun className="h-4 w-4" />
              Offline mode: cached public weather and forecast views remain
              available. Record submission and authority actions require a
              connection.
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
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-12">
                <div className="contents">
                  <Card className="relative border-[#1f365b] bg-[radial-gradient(circle_at_90%_5%,rgb(70_111_174/35%),transparent_17rem),linear-gradient(155deg,#14294b_0%,#0d1c34_65%,#091629_100%)] text-white shadow-[0_26px_60px_rgb(13_28_52/20%)] ring-white/5 xl:col-span-4">
                    <div className="pointer-events-none absolute right-6 top-6 h-24 w-24 rounded-full border border-white/5" />
                    <CardHeader className="flex-row items-start justify-between">
                      <div>
                        <p className="font-mono text-[9px] tracking-[0.17em] text-blue-200/55">
                          CURRENT HUMAN THERMAL STRESS
                        </p>
                        <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-white">
                          {selected.district}
                        </h2>
                        <p className="mt-1 text-xs text-blue-100/55">
                          {selected.temp}°C · {selected.humidity}% humidity ·{' '}
                          {selected.source === 'open-meteo'
                            ? 'live weather'
                            : 'safe fallback'}
                        </p>
                      </div>
                      <RiskBadge risk={selected.risk} />
                    </CardHeader>
                    <CardContent>
                      <div className="mt-5 flex items-end gap-2">
                        <strong
                          className="text-6xl leading-none"
                          style={{ color: riskStyle[selected.risk].color }}
                        >
                          {selected.htsi}
                        </strong>
                        <span className="pb-1 text-sm text-blue-100/45">
                          / 100 HTSI
                        </span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                        <i
                          className="block h-full rounded-full"
                          style={{
                            width: `${selected.htsi}%`,
                            background: riskStyle[selected.risk].color,
                          }}
                        />
                      </div>
                      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl border border-white/8 bg-white/[0.06] p-3 backdrop-blur">
                          <span className="block text-[9px] text-blue-100/45">
                            WBGT
                          </span>
                          <b>
                            {selected.wbgt ?? detail?.current.wbgt ?? '—'}°C
                          </b>
                        </div>
                        <div className="rounded-xl border border-white/8 bg-white/[0.06] p-3 backdrop-blur">
                          <span className="block text-[9px] text-blue-100/45">
                            HEAT INDEX
                          </span>
                          <b>
                            {selected.heat_index ??
                              detail?.current.heat_index ??
                              '—'}
                            °C
                          </b>
                        </div>
                        <div className="rounded-xl border border-white/8 bg-white/[0.06] p-3 backdrop-blur">
                          <span className="block text-[9px] text-blue-100/45">
                            PET
                          </span>
                          <b>{selected.pet ?? detail?.current.pet ?? '—'}°C</b>
                        </div>
                      </div>
                      <div
                        className="mt-5 rounded-[1.15rem] border p-4 text-xs leading-relaxed shadow-[inset_0_1px_rgb(255_255_255/50%)]"
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
                  <Card className="xl:col-span-8">
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
                <div className="contents">
                  <Card className="xl:col-span-5">
                    <CardHeader>
                      <PanelTitle
                        eyebrow="NEXT WARNING WINDOW"
                        title="Risk horizon"
                      />
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-between gap-4">
                      {detailLoading && !detail ? (
                        <Loading />
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-3">
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
                                className="min-h-28 cursor-pointer rounded-[1.05rem] border border-[#ded9cf] bg-[#faf8f3] p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-[#b7c6d8] hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
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
                          <div className="mt-4 flex items-center gap-3 rounded-[1.05rem] border border-blue-100 bg-[#edf3f8] p-3 text-xs text-blue-950">
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
                  <Card className="xl:col-span-7">
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
                          className="grid w-full grid-cols-[30px_1fr_auto_38px] items-center gap-2 rounded-xl border border-transparent px-2 py-2.5 text-left transition-colors hover:border-[#e3ddd3] hover:bg-[#faf8f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
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
              <div className="grid gap-5 lg:grid-cols-2">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <PanelTitle
                      eyebrow="EXPOSURE LENS"
                      title="Who needs help first?"
                      note="Human context changes the risk."
                    />
                  </CardHeader>
                  <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {detail?.profiles?.slice(0, 6).map((item) => (
                      <div
                        key={item.profile}
                        className="grid grid-cols-[1fr_auto_42px] items-center gap-2 rounded-[1.05rem] border border-[#e5e0d7] bg-[#faf8f3] p-3"
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
                <Card>
                  <CardHeader>
                    <PanelTitle
                      eyebrow="PERSONALIZED SCREENING"
                      title="Adjust exposure context"
                      note="Not a medical diagnosis."
                    />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        htmlFor="personal-age"
                        className="text-[10px] font-semibold text-slate-500"
                      >
                        AGE
                        <NativeSelect
                          id="personal-age"
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
                      <label
                        htmlFor="personal-activity"
                        className="text-[10px] font-semibold text-slate-500"
                      >
                        ACTIVITY
                        <NativeSelect
                          id="personal-activity"
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
                      <div className="rounded-[1.05rem] border bg-[#faf8f3] p-3">
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
                <Card>
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
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e8edf4] font-mono text-xs font-bold text-[#244a80]">
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
                        value={`${Math.round(item.probability)}%`}
                        detail={`${item.predicted_class} confidence · ${Math.round(item.high_risk_probability)}% High+`}
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
                    <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {(detail?.horizons[0]?.explanation ?? []).map((item) => (
                        <div
                          key={item.feature}
                          className="rounded-xl bg-slate-50 p-3"
                        >
                          <span className="flex items-center justify-between gap-2 text-xs font-semibold">
                            {item.label}
                            <small
                              className={
                                item.direction === 'raises'
                                  ? 'text-red-600'
                                  : 'text-emerald-700'
                              }
                            >
                              {item.direction} class
                            </small>
                          </span>
                          <div className="mt-3 h-1.5 rounded-full bg-slate-200">
                            <i
                              className="block h-full rounded-full bg-blue-700"
                              style={{ width: `${item.contribution_pct}%` }}
                            />
                          </div>
                          <small className="mt-2 block text-[10px] text-slate-500">
                            {item.contribution_pct}% contribution · value{' '}
                            {item.value}
                          </small>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {view === 'map' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-[#ddd7cc] bg-white/75 p-3 shadow-sm backdrop-blur">
                <div>
                  <b className="block text-sm text-[#14213a]">
                    Forecast risk layer
                  </b>
                  <small className="text-slate-500">
                    ML predictions across all monitored locations
                  </small>
                </div>
                <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
                  {([0, 24, 48, 72] as const).map((horizon) => (
                    <button
                      key={horizon}
                      onClick={() => setMapHorizon(horizon)}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                        mapHorizon === horizon
                          ? 'bg-[#10213f] text-white shadow-sm'
                          : 'text-slate-500 hover:bg-white hover:text-slate-800'
                      }`}
                    >
                      {horizon === 0 ? 'Live' : `+${horizon}h`}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadForecastMap(true)}
                  disabled={mapLoading}
                >
                  <RefreshCw className={mapLoading ? 'animate-spin' : ''} />
                  Refresh layers
                </Button>
              </div>
              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardHeader>
                  <PanelTitle
                    eyebrow="SPATIAL COMMAND"
                    title={
                      mapHorizon === 0
                        ? 'India live risk map'
                        : `India ${mapHorizon}-hour forecast map`
                    }
                    note={
                      mapHorizon === 0
                        ? 'Current model classifications across monitored districts.'
                        : 'Select a marker to inspect its predicted class and High+ probability.'
                    }
                  />
                </CardHeader>
                <CardContent>
                  {mapLoading && !forecastMap && mapHorizon !== 0 ? (
                    <Loading label="Building national forecast layers" />
                  ) : (
                    <IndiaMap
                      districts={mapDistricts}
                      selected={selectedMapDistrict}
                      onSelect={selectDistrict}
                      expanded
                      layerLabel={
                        mapHorizon === 0 ? 'Live' : `Forecast +${mapHorizon}h`
                      }
                    />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <PanelTitle
                    eyebrow="ALL LOCATIONS"
                    title={`${mapDistricts.length} monitored districts`}
                    note={
                      mapHorizon === 0
                        ? 'Ranked by current HTSI.'
                        : 'Ranked by forecast High+ probability.'
                    }
                  />
                </CardHeader>
                <CardContent className="max-h-[500px] space-y-1 overflow-auto">
                  {[...mapDistricts]
                    .sort((a, b) =>
                      mapHorizon === 0
                        ? b.htsi - a.htsi
                        : (b.high_risk_probability ?? 0) -
                          (a.high_risk_probability ?? 0),
                    )
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
                            {mapHorizon !== 0 && (
                              <>
                                {' '}
                                · {Math.round(item.high_risk_probability ?? 0)}%
                                High+
                              </>
                            )}
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
                        {dashboard.model.feature_importance.map((item) => (
                          <div
                            key={item.feature}
                            className="grid grid-cols-[130px_1fr_auto] items-center gap-3 rounded-xl bg-slate-50 p-3"
                          >
                            <span className="text-xs">{item.label}</span>
                            <div className="h-2 rounded-full bg-slate-200">
                              <i
                                className="block h-full rounded-full bg-blue-700"
                                style={{ width: `${Math.min(100, item.importance_pct * 4)}%` }}
                              />
                            </div>
                            <b className="text-[10px] text-slate-500">
                              {item.importance_pct}%
                            </b>
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
                      <label
                        htmlFor="incident-type"
                        className="text-[10px] font-semibold text-slate-500"
                      >
                        INCIDENT TYPE
                        <NativeSelect
                          id="incident-type"
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
                      <label
                        htmlFor="incident-severity"
                        className="text-[10px] font-semibold text-slate-500"
                      >
                        SEVERITY
                        <NativeSelect
                          id="incident-severity"
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
                      <label
                        htmlFor="incident-reporter"
                        className="text-[10px] font-semibold text-slate-500 sm:col-span-2"
                      >
                        REPORTER
                        <Input
                          id="incident-reporter"
                          className="mt-1"
                          value={reporter}
                          onChange={(event) => setReporter(event.target.value)}
                          placeholder="Name or organisation (optional)"
                        />
                      </label>
                      <label
                        htmlFor="incident-description"
                        className="text-[10px] font-semibold text-slate-500 sm:col-span-2"
                      >
                        WHAT HAPPENED?
                        <Textarea
                          id="incident-description"
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
                      detail={`${dashboard.validation.test_samples.toLocaleString('en-IN')} held-out 2025 rows`}
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
                          title="Observed stress vs High+ probability"
                          note={`Untouched chronological test period · ${dashboard.validation.test_period}`}
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
                        <div
                          className="grid gap-2"
                          style={{
                            gridTemplateColumns: `repeat(${dashboard.validation.labels.length}, minmax(0, 1fr))`,
                          }}
                        >
                          {dashboard.validation.confusion_matrix.flatMap(
                            (row, rowIndex) =>
                              row.map((value, colIndex) => (
                                <div
                                  key={`${rowIndex}-${colIndex}`}
                                  className={`rounded-xl p-2 text-center ${rowIndex === colIndex ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}
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
                  {selectedReplay && (
                    <Card>
                      <CardHeader>
                        <PanelTitle
                          eyebrow="SELECTABLE 2025 EVIDENCE"
                          title={`${selectedReplay.district} historical case`}
                          note="Choose a real held-out timestamp and inspect the weather, result and model reasoning."
                          action={
                            <NativeSelect
                              value={selectedReplay.id}
                              onChange={(event) =>
                                setReplayCaseId(event.target.value)
                              }
                              aria-label="Select historical replay case"
                            >
                              {districtReplayCases.map((item) => (
                                <NativeSelectOption
                                  key={item.id}
                                  value={item.id}
                                >
                                  {new Date(item.timestamp).toLocaleString(
                                    'en-IN',
                                    {
                                      dateStyle: 'medium',
                                      timeStyle: 'short',
                                    },
                                  )}
                                </NativeSelectOption>
                              ))}
                            </NativeSelect>
                          }
                        />
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                          <Stat
                            label="Observed proxy"
                            value={selectedReplay.observed.risk}
                            detail={`HTSI ${selectedReplay.observed.htsi}`}
                            tone="amber"
                          />
                          <Stat
                            label="Model result"
                            value={selectedReplay.prediction.risk}
                            detail={`${selectedReplay.prediction.confidence_pct}% confidence`}
                            tone={
                              selectedReplay.prediction.correct ? 'green' : 'red'
                            }
                          />
                          <Stat
                            label="High+ probability"
                            value={`${selectedReplay.prediction.high_risk_probability_pct}%`}
                            detail={
                              selectedReplay.prediction.correct
                                ? 'class matched'
                                : 'class mismatch'
                            }
                          />
                          <Stat
                            label="Temperature"
                            value={`${selectedReplay.observed.temperature_c}°C`}
                            detail={`${selectedReplay.observed.humidity_pct}% humidity`}
                          />
                          <Stat
                            label="Wind"
                            value={`${selectedReplay.observed.wind_speed_ms} m/s`}
                            detail="ERA5-Seamless"
                          />
                          <Stat
                            label="Solar load"
                            value={`${selectedReplay.observed.shortwave_radiation_wm2}`}
                            detail="W/m²"
                          />
                        </div>
                        <div>
                          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Why the model selected {selectedReplay.prediction.risk}
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {selectedReplay.prediction.explanation.map(
                              (item) => (
                                <div
                                  key={item.feature}
                                  className="rounded-xl bg-slate-50 p-3"
                                >
                                  <span className="flex justify-between gap-2 text-xs font-semibold">
                                    {item.label}
                                    <small className="text-slate-500">
                                      {item.contribution_pct}%
                                    </small>
                                  </span>
                                  <div className="mt-3 h-1.5 rounded-full bg-slate-200">
                                    <i
                                      className={`block h-full rounded-full ${
                                        item.direction === 'raises'
                                          ? 'bg-red-600'
                                          : 'bg-emerald-600'
                                      }`}
                                      style={{
                                        width: `${item.contribution_pct}%`,
                                      }}
                                    />
                                  </div>
                                  <small className="mt-2 block text-[10px] text-slate-500">
                                    {item.direction} this class · value{' '}
                                    {item.value}
                                  </small>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <Card>
                    <CardHeader>
                      <PanelTitle
                        eyebrow="HACKATHON TABLETOP TEST"
                        title="Reproducible readiness simulation"
                        note="A safe substitute for unavailable field testing. It verifies the technical workflow, but does not claim real-user or authority validation."
                        action={
                          <Button
                            variant="outline"
                            onClick={runReadinessSimulation}
                            disabled={loading || mapLoading || detailLoading}
                          >
                            <RefreshCw
                              className={
                                loading || mapLoading || detailLoading
                                  ? 'animate-spin'
                                  : ''
                              }
                            />
                            Run readiness check
                          </Button>
                        }
                      />
                    </CardHeader>
                    <CardContent>
                      {readinessComplete ? (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                          {[
                            {
                              label: 'Live coverage',
                              pass: districts.length >= 30,
                              detail: `${districts.length} cities loaded`,
                            },
                            {
                              label: 'Forecast workflow',
                              pass: detail?.horizons.length === 3,
                              detail: `${detail?.horizons.length ?? 0}/3 horizons`,
                            },
                            {
                              label: 'National layers',
                              pass: Boolean(
                                forecastMap &&
                                  Object.values(forecastMap.layers).every(
                                    (layer) => layer.length >= 30,
                                  ),
                              ),
                              detail: '24h · 48h · 72h',
                            },
                            {
                              label: 'Historical evidence',
                              pass:
                                dashboard.validation.test_samples === 58_400,
                              detail: `${dashboard.validation.test_samples.toLocaleString('en-IN')} held-out rows`,
                            },
                            {
                              label: 'Alert readiness',
                              pass: true,
                              detail: '1 live · 2 demo channels',
                            },
                          ].map((check) => (
                            <div
                              key={check.label}
                              className={`rounded-xl border p-3 ${check.pass ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}
                            >
                              <span
                                className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${check.pass ? 'text-emerald-700' : 'text-red-700'}`}
                              >
                                {check.pass ? <Check /> : <X />}
                                {check.pass ? 'Pass' : 'Check'}
                              </span>
                              <b className="mt-2 block text-xs text-slate-800">
                                {check.label}
                              </b>
                              <small className="mt-1 block text-[10px] text-slate-500">
                                {check.detail}
                              </small>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs leading-relaxed text-slate-600">
                          Run this before the SIH presentation to refresh the
                          live data pipeline, all forecast horizons, the
                          30-city map layers and the historical validation
                          evidence in one repeatable exercise.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
                    <b className="block">Validation boundary</b>
                    {dashboard.validation.methodology}{' '}
                    {dashboard.validation.caveat} The Emergency row is retained
                    in the matrix, but its 2025 support is zero and therefore no
                    Emergency performance claim is made.
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
              <Card>
                <CardHeader>
                  <PanelTitle
                    eyebrow="AUTOMATIC ML WATCH"
                    title={`${selectedAutomaticWarnings.length} active forecast warning${selectedAutomaticWarnings.length === 1 ? '' : 's'} for ${selected.district}`}
                    note="Created automatically when the model predicts High+ risk with at least 60% High+ probability. Duplicate forecast windows are suppressed."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadForecastMap(true)}
                        disabled={mapLoading}
                      >
                        <RefreshCw
                          className={mapLoading ? 'animate-spin' : ''}
                        />
                        Evaluate forecasts
                      </Button>
                    }
                  />
                </CardHeader>
                <CardContent>
                  {selectedAutomaticWarnings.length ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {selectedAutomaticWarnings.map((warning) => (
                        <div
                          key={warning.id}
                          className="rounded-[1.05rem] border border-orange-100 bg-orange-50/70 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <RiskBadge risk={warning.risk} />
                            <b className="text-xs">
                              +{warning.horizon_hours}h
                            </b>
                          </div>
                          <strong className="mt-3 block text-2xl text-orange-800">
                            {Math.round(warning.probability)}% High+
                          </strong>
                          <small className="mt-1 block text-orange-900/65">
                            HTSI {warning.htsi} · valid{' '}
                            {new Date(warning.valid_at).toLocaleString('en-IN')}
                          </small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty>
                      No automatic High+ warning is active for this district.
                      Evaluate the forecast layers to refresh the warning engine.
                    </Empty>
                  )}
                </CardContent>
              </Card>
              <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                <Card>
                  <CardHeader>
                    <PanelTitle
                      eyebrow="MULTICHANNEL WARNING"
                      title="Alert composer"
                      note="Browser delivery is live. SMS and WhatsApp are safe hackathon previews and do not contact real recipients."
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label
                      htmlFor="alert-risk"
                      className="text-[10px] font-semibold text-slate-500"
                    >
                      RISK LEVEL
                      <NativeSelect
                        id="alert-risk"
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
                    <label
                      htmlFor="alert-channel"
                      className="text-[10px] font-semibold text-slate-500"
                    >
                      DELIVERY CHANNEL
                      <NativeSelect
                        id="alert-channel"
                        className="mt-1 w-full"
                        value={alertChannel}
                        onChange={(event) =>
                          setAlertChannel(event.target.value as AlertChannel)
                        }
                      >
                        <NativeSelectOption value="browser">
                          Browser notification · live
                        </NativeSelectOption>
                        <NativeSelectOption value="sms">
                          SMS · demo preview
                        </NativeSelectOption>
                        <NativeSelectOption value="whatsapp">
                          WhatsApp · demo preview
                        </NativeSelectOption>
                      </NativeSelect>
                    </label>
                    <label
                      htmlFor="alert-language"
                      className="text-[10px] font-semibold text-slate-500"
                    >
                      LANGUAGE
                      <NativeSelect
                        id="alert-language"
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
                        <NativeSelectOption value="kn">
                          Kannada
                        </NativeSelectOption>
                      </NativeSelect>
                    </label>
                    <div
                      className={`rounded-xl border p-3 text-xs ${alertChannel === 'browser' ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
                    >
                      <b className="block">
                        {canManage
                          ? alertChannel === 'browser'
                            ? `${session?.role} access · live browser delivery`
                            : `${session?.role} access · demo-only delivery`
                          : 'Officer sign-in required'}
                      </b>
                      {canManage ? (
                        <>
                          {alertChannel === 'browser'
                            ? 'Browser delivery uses this device’s notification permission and stores the alert in the audit trail.'
                            : 'This creates and audits a realistic message preview. No phone number, external API, SMS, or WhatsApp message is used.'}
                        </>
                      ) : (
                        <>
                          Public visitors can view warnings, but only signed-in
                          officers can send or acknowledge them.{' '}
                          <a
                            href="/signin-with-chatgpt?return_to=/"
                            target="_top"
                            className="font-semibold underline"
                          >
                            Sign in with ChatGPT
                          </a>
                        </>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      onClick={sendAlert}
                      disabled={!canManage}
                    >
                      <Bell />
                      {alertChannel === 'browser'
                        ? 'Send and record warning'
                        : `Generate ${alertChannel === 'sms' ? 'SMS' : 'WhatsApp'} demo`}
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
                              {item.status !== 'acknowledged' &&
                                item.status !== 'demo_only' &&
                                canManage && (
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
              {copy.decisionSupport}
            </span>
            <span className="flex flex-wrap gap-3">
              <Link href="/privacy" className="text-blue-700">
                Privacy and data use
              </Link>
              <Link href="/api/health" className="text-blue-700">
                System status
              </Link>
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-700"
              >
                Weather data by Open-Meteo
              </a>
            </span>
          </footer>
          <LocalAssistant
            language={uiLanguage}
            context={{
              district: selected.district,
              risk: selected.risk,
              htsi: selected.htsi,
              temperature: selected.temp,
              humidity: selected.humidity,
              highRiskProbability: selected.high_risk_probability,
              forecastRisk: detail?.horizons[0]?.predicted_class,
            }}
          />
        </main>
      </section>
    </div>
  );
}
