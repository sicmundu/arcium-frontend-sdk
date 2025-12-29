import { useState } from 'react';
import { useWallet, useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import {
    getMXEPublicKey,
} from '@arcium-hq/client';
import { Buffer } from 'buffer';
import {
    createAnchorProvider,
} from 'arcium-frontend-sdk';

import Grid from './components/Grid';
import Row from './components/Row';
import Card from './components/Card';
import Button from './components/Button';
import Text from './components/Text';
import { ClientWalletProvider } from './contexts/ClientWalletProvider';
import { WalletConnect } from './components/WalletConnect';

function AppContent() {
    const { connected, publicKey } = useWallet();
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

    const handleMPCInteraction = async () => {
        if (!wallet || !publicKey) {
            addLog("Wallet not connected.");
            return;
        }

        setLoading(true);
        addLog("Starting MPC interaction...");

        try {
            // 0. Setup Provider
            const provider = createAnchorProvider(connection, wallet, 'confirmed');
            // Use SystemProgram ID as a safe default if env is missing, to prevent "Invalid public key" crash
            const defaultMxeId = '11111111111111111111111111111111';
            const programId = new PublicKey(import.meta.env.NEXT_PUBLIC_MXE_PROGRAM_ID || defaultMxeId);

            addLog("Fetching MXE Public Key...");
            // 1. Fetch MXE Key
            const mxePublicKey = await getMXEPublicKey(provider, programId);
            let keyStr = 'unknown';
            if (mxePublicKey && typeof mxePublicKey === 'object' && 'toBase58' in mxePublicKey) {
                keyStr = (mxePublicKey as any).toBase58();
            } else if (mxePublicKey instanceof Uint8Array) {
                keyStr = Buffer.from(mxePublicKey).toString('hex');
            }
            addLog(`MXE Key: ${keyStr.slice(0, 8)}...`);

            // This is where you would call:
            // prepareEncryptionPayload(...)
            // deriveCoreAccounts(...)
            // encodeEncryptedCall(...)
            // buildInstruction(...)
            // buildTransaction(...)

            addLog("MPC Interaction simulation complete.");
            addLog("To implement real logic, import functions from 'arcium-frontend-sdk'.");

        } catch (e: any) {
            console.error(e);
            addLog(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '100ch', margin: '0 auto' }}>
            <Grid>
                <Row>
                    <Card title="ARCIUM CRUCIBLE" mode="left">
                        <Text>
                            Secure Multiparty Computation Interface.
                            <br />
                            Connect your Solana wallet to begin.
                        </Text>
                    </Card>
                </Row>

                <Row>
                    <Card title="CONNECTION" mode="right">
                        <WalletConnect />
                        <br />
                        <Text>
                            STATUS: {connected ? 'ONLINE' : 'OFFLINE'}
                            <br />
                            NETWORK: DEVNET
                        </Text>
                    </Card>
                </Row>

                {connected && (
                    <Row>
                        <Card title="MPC OPERATIONS">
                            <Text>
                                Initiate encrypted computation on the Arcium Network.
                            </Text>
                            <br />
                            <Button onClick={handleMPCInteraction} disabled={loading}>
                                {loading ? 'EXECUTING...' : 'EXECUTE MPC TRANSACTION'}
                            </Button>
                        </Card>
                    </Row>
                )}

                <Row>
                    <Card title="LOGS">
                        <div style={{ height: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '1ch' }}>
                            {logs.length === 0 ? <Text style={{ opacity: 0.5 }}>System idle.</Text> : logs.map((log, i) => (
                                <Text key={i}>{log}</Text>
                            ))}
                        </div>
                    </Card>
                </Row>
            </Grid>
        </div>
    )
}

function App() {
    return (
        <ClientWalletProvider>
            <AppContent />
        </ClientWalletProvider>
    )
}

export default App
