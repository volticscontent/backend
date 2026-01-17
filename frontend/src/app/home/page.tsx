'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button"
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
      .then(res => res.json())
      .then(data => setApiStatus(`Online (${data.status})`))
      .catch(() => setApiStatus('Offline (Failed to connect)'));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-slate-50">
      <h1 className="text-4xl font-bold mb-8 text-slate-900">Agency CRM</h1>
      
      <div className="mb-8 p-4 bg-white rounded shadow border">
        <p className="text-sm font-medium text-slate-600">Backend Status:</p>
        <p className={`text-lg font-bold ${apiStatus.includes('Online') ? 'text-green-600' : 'text-red-600'}`}>
          {apiStatus}
        </p>
      </div>

      <div className="flex gap-4">
        {/* Links para testar localmente. Em produção, usar os subdomínios reais */}
        <Link href="http://admin.localhost:3000">
          <Button>Acesso Master (Local)</Button>
        </Link>
        <Link href="http://demo.localhost:3000">
          <Button variant="outline">Acesso Cliente (Local)</Button>
        </Link>
      </div>
      <p className="mt-8 text-sm text-slate-500 max-w-md text-center">
        Nota: Para testar subdomínios localmente, você pode precisar configurar seu arquivo hosts ou usar um serviço como lvh.me (ex: admin.lvh.me:3000).
        Mas o Next.js lida com localhost como domínio base por padrão.
      </p>
    </div>
  );
}
