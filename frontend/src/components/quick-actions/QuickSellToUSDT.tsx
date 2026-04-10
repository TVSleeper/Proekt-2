'use client';

export function QuickSellToUSDT() {
  return (
    <div className="bg-darker rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4 text-accent">⚡ Quick Exit to USDT</h2>
      <p className="text-gray-400 mb-4">
        Instantly remove liquidity and swap all tokens to USDT in one click
      </p>
      <button className="px-6 py-3 bg-danger hover:bg-red-600 text-white rounded-lg font-bold transition">
        Quick Sell All Positions to USDT
      </button>
    </div>
  );
}
