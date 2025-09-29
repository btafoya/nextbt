interface TextareaProps {
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
  rows?: number;
}

export function Textarea({
  name,
  value,
  onChange,
  placeholder,
  className = "",
  label,
  required = false,
  rows = 4
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={`form-input ${className}`}
      />
    </div>
  );
}
