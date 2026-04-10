'use client';

export function TokenSelector({ label }: { label: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type="text"
        placeholder="Enter token address or search..."
        className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg text-white"
      />
      {/* Token selector implementation */}
    </div>
  );
}
