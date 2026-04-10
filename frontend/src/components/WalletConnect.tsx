'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from './common/Button';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-4 py-2 bg-darker rounded-lg">
          <span className="text-success text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <Button variant="outline" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => connect({ connector: connectors[0] })}>
      Connect Wallet
    </Button>
  );
}
