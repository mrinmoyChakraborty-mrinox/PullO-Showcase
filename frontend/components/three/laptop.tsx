const Laptop = () => {
  return (
    <group>
      <rect x="20" y="80" width="60" height="40" rx="8" fill="rgba(255,255,255,0.1)" />
      <rect x="30" y="90" width="40" height="20" rx="4" fill="rgba(124,58,237,0.3)" />
      <line x1="40" y1="80" x2="40" y2="120" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <circle cx="40" cy="100" r="4" fill="rgba(255,255,255,0.5)" />
    </group>
  );
};

export default Laptop;