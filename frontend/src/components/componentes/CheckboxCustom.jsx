export default function CheckboxCustom({ label, checked, onChange, accentColor = 'var(--naranja)' }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200"
        style={{
          borderColor: checked ? accentColor : 'var(--gris-borde)',
          backgroundColor: checked ? accentColor : 'transparent',
        }}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <label
        onClick={() => onChange(!checked)}
        className="cursor-pointer select-none text-sm font-semibold"
        style={{ color: 'var(--gris-texto)', fontFamily: "'Lato', sans-serif" }}
      >
        {label}
      </label>
    </div>
  );
}
