const Scene = () => {
  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight x={10} y={10} z={10} intensity={1.2} />
    </group>
  );
};

export default Scene;