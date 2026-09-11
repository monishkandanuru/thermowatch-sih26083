import type { Metadata } from 'next';

import { SecurityDemoLogin } from '@/components/security-demo-login';

export const metadata: Metadata = {
  title: 'Officer Sign In — ThermoWatch',
  description:
    'Secure officer access to ThermoWatch operational heat-response tools.',
};

export default function LoginPage() {
  return <SecurityDemoLogin />;
}
