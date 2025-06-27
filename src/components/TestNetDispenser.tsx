import React, { useState } from 'react';
import { Card, CardContent, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { CheckCircle, AlertCircle } from 'lucide-react';
import * as algokit from '@algorandfoundation/algokit-utils';


export function TestNetDispenser() {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Get token from env (for dev/demo only)
  const authToken = import.meta.env.VITE_ALGOKIT_DISPENSER_ACCESS_TOKEN;

  const requestFunds = async () => {
    if (!authToken) {
      setStatus('error');
      setMessage('Dispenser auth token is missing. Set VITE_ALGOKIT_DISPENSER_ACCESS_TOKEN in your .env file.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const client = algokit.algorand.getTestNetDispenserApiClient({ authToken });
      // 1 Algo = 1_000_000 microAlgos
      const response = await client.fund(address, 1_000_000);
      setStatus('success');
      setMessage(`Success! TestNet ALGO sent. TxID: ${response.txId}`);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to request funds');
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6 flex flex-col gap-4">
        <CardTitle className="mb-2 text-center">Algorand TestNet Dispenser</CardTitle>
        <Input
          type="text"
          placeholder="Enter your TestNet address"
          value={address}
          onChange={e => setAddress(e.target.value)}
          className="mb-2"
        />
        <Button
          onClick={requestFunds}
          disabled={status === 'loading' || !address}
          className="w-full"
        >
          {status === 'loading' ? 'Requesting...' : 'Request TestNet ALGO'}
        </Button>
        {message && (
          <div className={`mt-2 flex items-center gap-2 text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {status === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span>{message}</span>
          </div>
        )}
        {!authToken && (
          <div className="mt-2 text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
            Warning: Dispenser auth token is missing. Set <code>VITE_ALGOKIT_DISPENSER_ACCESS_TOKEN</code> in your .env file.<br/>
            (Do not expose this token in production!)
          </div>
        )}
      </CardContent>
    </Card>
  );
}