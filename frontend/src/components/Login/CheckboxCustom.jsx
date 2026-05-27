export default function CheckboxCustom({ label, checked, onChange, accentColor = '#F46F0B' }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="w-[18px] h-[18px] rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
        style={{
          borderColor: checked ? accentColor : '#d1d5db',
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
        className="text-sm cursor-pointer select-none"
        style={{ color: '#A3A3A3', fontFamily: "'Lato', sans-serif" }}
      >
        {label}
      </label>
    </div>
  );
}