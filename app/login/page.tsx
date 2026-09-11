import type { Metadata } from 'next';

import { SecurityDemoLogin } from '@/components/security-demo-login';

export const metadata: Metadata = {
  title: 'Officer Security Demo — ThermoWatch',
  description:
    'ThermoWatch officer authentication demonstration for Smart India Hackathon.',
};

export default function LoginPage() {
  return <SecurityDemoLogin />;
}
