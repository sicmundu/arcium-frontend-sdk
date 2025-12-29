import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Button from './Button';
import { useEffect, useState } from 'react';

export const WalletConnect = () => {
    const { connected, publicKey, disconnect } = useWallet();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Helper to format address
    const shortAddress = (key: string) => {
        return `${key.slice(0, 4)}..${key.slice(-4)}`;
    };

    if (!mounted) {
        return <Button disabled>INITIALIZING...</Button>;
    }

    if (connected && publicKey) {
        return (
            <Button theme="SECONDARY" onClick={disconnect}>
                DISCONNECT [{shortAddress(publicKey.toBase58())}]
            </Button>
        );
    }

    // We style the standard button to be invisible but clickable, 
    // or we wrap it. Actually, standard WalletMultiButton has its own styles.
    // For a terminal look, let's just use our Button and trigger the modal manually?
    // The standard WalletModalProvider handles the modal opening when we use WalletMultiButton.
    // However, WalletMultiButton is hard to style perfectly to match our Button component without deep overrides.
    // A simpler approach for the template is to wrap the standard button or use a custom trigger if possible.
    // The WalletModalProvider context provides setVisible.

    return (
        <div className="terminal-wallet-adapter">
            <WalletMultiButton style={{
                fontFamily: 'var(--font-family-mono)',
                backgroundColor: 'var(--theme-button)',
                color: 'var(--theme-button-text)',
                height: 'auto',
                lineHeight: 'calc(var(--theme-line-height-base) * 2em)',
                minHeight: 'calc(var(--theme-line-height-base) * (var(--font-size) * 2))',
                borderRadius: 0,
                textTransform: 'uppercase',
                width: '100%',
                justifyContent: 'center',
                fontSize: 'var(--font-size)',
                padding: '0 2ch'
            }} />
        </div>
    );
};
