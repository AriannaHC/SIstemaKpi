export default function InputField({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  showToggle,
  showPassword,
  onTogglePassword,
  accentColor = '#123498',
}) {
  const handleFocus = (e) => {
    e.target.style.borderColor = accentColor;
    e.target.style.boxShadow = `0 0 0 3px ${accentColor}18`;
    e.target.style.backgroundColor = '#fff';
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = '#e5e7eb';
    e.target.style.boxShadow = 'none';
    e.target.style.backgroundColor = '#fafafa';
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ fontFamily: "'Montserrat', sans-serif", color: '#A3A3A3' }}
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: '#A3A3A3' }}>
            {icon}
          </div>
        )}

        <input
          type={showToggle ? (showPassword ? 'text' : 'password') : type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={name === 'contrasena' ? 'current-password' : 'username'}
          className={`w-full ${icon ? 'pl-11' : 'pl-4'} ${showToggle ? 'pr-12' : 'pr-4'} py-3 rounded-lg border text-sm transition-all duration-200`}
          style={{
            borderColor: '#e5e7eb',
            backgroundColor: '#fafafa',
            color: '#123498',
            fontFamily: "'Lato', sans-serif",
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {showToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
            style={{ color: '#A3A3A3' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#123498'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#A3A3A3'; }}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}