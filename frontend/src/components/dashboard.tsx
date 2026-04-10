'use client';

import { useState } from 'react';
import { WalletConnect } from './WalletConnect';
import { TokenSelector } from './token/TokenSelector';
import { PoolList } from './pool/PoolList';
import { PositionList } from './position/PositionList';
import { QuickSellToUSDT } from './quick-actions/QuickSellToUSDT';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'pools' | 'positions' | 'add'>('pools');

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Header */}
      <header className="border-b border-darker">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-accent">Liquidity Manager</h1>
          <WalletConnect />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <QuickSellToUSDT />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('pools')}
            className={`px-6 py-2 rounded-lg ${
              activeTab === 'pools' ? 'bg-primary text-white' : 'bg-darker text-gray-400'
            }`}
          >
            All Pools
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-6 py-2 rounded-lg ${
              activeTab === 'positions' ? 'bg-primary text-white' : 'bg-darker text-gray-400'
            }`}
          >
            My Positions
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-2 rounded-lg ${
              activeTab === 'add' ? 'bg-primary text-white' : 'bg-darker text-gray-400'
            }`}
          >
            Add Liquidity
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'pools' && <PoolList />}
        {activeTab === 'positions' && <PositionList />}
        {activeTab === 'add' && <AddLiquidityFlow />}
      </main>
    </div>
  );
}

function AddLiquidityFlow() {
  return (
    <div className="bg-darker rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Add Liquidity</h2>
      <div className="space-y-4">
        <TokenSelector label="Select Token" />
        <PoolList compact />
        {/* Range selector, amount inputs, etc. */}
      </div>
    </div>
  );
}
