import React, { useState } from 'react';
import { TestNetDispenser } from '../components/TestNetDispenser';

export default function AdminDashboard() {
  const [tab, setTab] = useState<'dispenser' | 'lookup' | 'transactions'>('dispenser');

  return (
    <div className="min-h-screen flex">
      <aside className="w-48 bg-gray-100 p-4">
        <h2 className="font-bold mb-4">Admin Tools</h2>
        <ul>
          <li>
            <button onClick={() => setTab('dispenser')} className={tab === 'dispenser' ? 'font-bold' : ''}>
              TestNet Dispenser
            </button>
          </li>
          <li>
            <button onClick={() => setTab('lookup')} className={tab === 'lookup' ? 'font-bold' : ''}>
              User/Wallet Lookup
            </button>
          </li>
          <li>
            <button onClick={() => setTab('transactions')} className={tab === 'transactions' ? 'font-bold' : ''}>
              Transactions
            </button>
          </li>
        </ul>
      </aside>
      <main className="flex-1 p-8">
        {tab === 'dispenser' && <TestNetDispenser />}
        {tab === 'lookup' && <div>Lookup tool coming soon...</div>}
        {tab === 'transactions' && <div>Transaction tools coming soon...</div>}
      </main>
    </div>
  );
} 