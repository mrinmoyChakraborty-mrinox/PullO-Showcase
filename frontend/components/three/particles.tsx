const Particles = ({ count = 30 }) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    x: Math.random() * 500,
    y: Math.random() * 300,
    opacity: Math.random(),
  }));

  return (
    <g>
      {particles.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="1.5"
          fill="rgba(124,58,237,0.3)"
          opacity={p.opacity}
        />
      ))}
    </g>
  );
};

export default Particles;