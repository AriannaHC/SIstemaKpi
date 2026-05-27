export default function LeftPanel() {
  return (
    <div
      className="w-1/2 relative overflow-hidden flex flex-col justify-between"
      style={{ backgroundColor: '#123498' }}
    >
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, #F46F0B 1px, transparent 1px), radial-gradient(circle at 80% 70%, #F46F0B 1px, transparent 1px)",
          backgroundSize: '60px 60px, 80px 80px',
        }}
      />

      <div
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #F46F0B 0%, transparent 70%)' }}
      />

      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-5"
        style={{ background: 'radial-gradient(circle, #FDB907 0%, transparent 70%)' }}
      />

      <div className="relative z-10 flex flex-col justify-center flex-1 px-12 xl:px-16">

        <div className="mb-12">
          <img
  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAEeqY-77toOiiJxZao_SQU6vqrOpnMTpV5A&s"
  alt="Logo"
  style={{
    height: '64px',
    objectFit: 'contain',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: '8px',
  }}
/>
        </div>

        <div className="mb-10 flex items-end gap-3">
          <div className="w-6 rounded-t-sm" style={{ height: '60px', backgroundColor: '#F46F0B' }} />
          <div className="w-6 rounded-t-sm" style={{ height: '84px', backgroundColor: '#FDB907' }} />
          <div className="w-6 rounded-t-sm" style={{ height: '48px', backgroundColor: '#096ACC' }} />
          <div className="w-6 rounded-t-sm" style={{ height: '100px', backgroundColor: '#F46F0B' }} />
          <div className="w-6 rounded-t-sm" style={{ height: '36px', backgroundColor: '#41C4C0' }} />
          <div className="w-6 rounded-t-sm" style={{ height: '72px', backgroundColor: '#FDB907' }} />
          <div className="w-6 rounded-t-sm" style={{ height: '56px', backgroundColor: '#096ACC' }} />
        </div>

        <h1
          className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Sistema de
          <br />
          <span style={{ color: '#F46F0B' }}>Registro de KPIs</span>
        </h1>

        <p
          className="text-base xl:text-lg text-white/70 leading-relaxed max-w-md"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          Acceda a su panel para gestionar indicadores clave de rendimiento,
          hacer seguimiento de métricas y tomar decisiones basadas en datos.
        </p>
      </div>

      <div className="relative z-10 px-12 xl:px-16 pb-8">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span
            className="text-white/30 text-xs tracking-widest uppercase"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            SISTEKPI
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
      </div>
    </div>
  );
}