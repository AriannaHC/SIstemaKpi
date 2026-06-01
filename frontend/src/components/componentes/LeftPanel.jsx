export default function LeftPanel() {
  return (
    <section className="hidden lg:flex w-[50%] min-h-screen relative overflow-hidden flex-col justify-between bg-azul text-white">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(18,52,152,0.96)_0%,rgba(18,52,152,0.96)_55%,rgba(9,106,204,0.88)_100%)]" />
      <div className="absolute left-0 top-0 h-1.5 w-full bg-naranja" />
      <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-naranja/18 blur-3xl" />
      <div className="absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10 px-14 xl:px-20 pt-12">
        <div className="flex items-center gap-4">
          <img
            src="/Imag/Consultora_JB.png"
            alt="Consultora JB"
            className="h-16 w-16 rounded-[18px] bg-white p-2 shadow-xl shadow-black/15 object-contain ring-1 ring-white/50"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/60 font-black">Consultora JB</p>
            <h2 className="text-2xl font-black leading-tight tracking-tight">Sistema KPI</h2>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-14 xl:px-20">
        <div className="mb-12 max-w-[520px]">
          <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/85 ring-1 ring-white/15">
            Planeamiento estrategico
          </span>
          <h1 className="mt-7 text-5xl xl:text-7xl font-black leading-[0.98] tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Registro
            <span className="block">inteligente</span>
            <span className="block text-naranja">de KPIs</span>
          </h1>
          <p className="mt-6 max-w-md text-base xl:text-lg leading-8 text-white/76">
            Gestiona indicadores diarios, metas, participacion y reportes desde un panel claro para cada rol.
          </p>
        </div>

      </div>

      <div className="relative z-10 px-14 xl:px-20 pb-10">
        <div className="flex items-center gap-4 text-white/35">
          <div className="h-px flex-1 bg-white/15" />
          <span className="text-[11px] font-bold uppercase tracking-[0.28em]">SISTEKPI</span>
          <div className="h-px flex-1 bg-white/15" />
        </div>
      </div>
    </section>
  );
}
