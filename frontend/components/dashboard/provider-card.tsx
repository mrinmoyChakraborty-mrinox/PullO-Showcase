const ProviderCard = ({ provider, status }) => {
  return (
    <div style={{ padding: '16px', borderRadius: 12, marginBottom: '16px' }}>
      <h3 style={{ margin: 0, fontSize: '1rem' }}>{provider.name || 'Local Provider'}</h3>
      <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#94a3b8' }}>
        {status || 'Offline'}
      </div>
    </div>
  );
};

export default ProviderCard;