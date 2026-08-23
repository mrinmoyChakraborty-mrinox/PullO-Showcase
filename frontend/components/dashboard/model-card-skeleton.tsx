const ModelCardSkeleton = () => {
  return (
    <div style={{ padding: '16px', borderRadius: 12, marginBottom: '16px', background: 'rgba(0,0,0,0.3)' }}>
      <div style={{ height: 24, width: '100%', borderRadius: 6, marginBottom: '8px', background: 'rgba(255,255,255,0.1)' }} />
      <div style={{ height: 16, width: '60%', borderRadius: 6, marginBottom: '4px', background: 'rgba(255,255,255,0.1)' }} />
      <div style={{ height: 14, width: '80%', borderRadius: 6, marginBottom: '4px', background: 'rgba(255,255,255,0.1)' }} />
    </div>
  );
};

export default ModelCardSkeleton;