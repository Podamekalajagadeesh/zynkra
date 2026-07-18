import { Link } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <div>
      {isConnected ? (
        <div>
          <span>{address}</span>
          <button onClick={() => disconnect()}>Disconnect</button>
        </div>
      ) : (
        <Link to="/login">Connect Wallet</Link>
      )}
    </div>
  );
}