interface StatusDisplayProps {
  message?: string;
  tokenStatus?: string;
}

export function StatusDisplay({ message, tokenStatus }: StatusDisplayProps) {
  return (
    <div className="status-display">
      {message && <div className="message">{message}</div>}
      {tokenStatus && <div className="message">{tokenStatus}</div>}
    </div>
  );
}