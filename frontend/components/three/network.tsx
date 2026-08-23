const Network = () => {
  return (
    <g stroke="rgba(124,58,237,0.4)" strokeWidth={1}>
      <line x1="60" y1="40" x2="100" y2="40" />
      <line x1="100" y1="40" x2="100" y2="80" />
      <circle cx="100" cy="60" r="5" fill="rgba(124,58,237,0.3)" />
      <line x1="100" y1="80" x2="60" y2="80" />
    </g>
  );
};

export default Network;