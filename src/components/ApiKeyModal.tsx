import { useState, useEffect } from 'react';
import { X, KeyRound, Check, Eye, EyeOff } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  currentKey: string;
  onSave: (newKey: string) => void;
  onClose: () => void;
}

export function ApiKeyModal({ isOpen, currentKey, onSave, onClose }: ApiKeyModalProps) {
  const [value, setValue] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(currentKey);
      setShowKey(false);
    }
  }, [isOpen, currentKey]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(value.trim());
    onClose();
  };

  const handleClear = () => {
    setValue('');
    onSave('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl border-2 border-[#111827] bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0F2C59] text-white">
              <KeyRound className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 id="api-key-modal-title" className="text-[22px] font-bold text-[#111827]">
              Configurar API Key
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border-2 border-[#D6D3CD] bg-[#FAF8F5] text-[#111827] hover:bg-[#EFECE6]"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-4 text-[18px] leading-relaxed text-[#374151]">
          Opcional: la aplicación ya usa de forma segura la clave vinculada en el servidor. Solo
          use este campo si desea probar temporalmente otra clave personal desde este dispositivo.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="gemini-api-key-input"
              className="mb-2 block text-[18px] font-bold text-[#111827]"
            >
              Clave de API de Gemini (opcional)
            </label>
            <div className="flex gap-2">
              <input
                id="gemini-api-key-input"
                type={showKey ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Pegue su clave aquí (ej. AIza... o AQ...)"
                autoComplete="off"
                className="w-full rounded-xl border-2 border-[#374151] bg-[#FAF8F5] px-4 py-3.5 text-[18px] text-[#111827] placeholder:text-[#6B7280]"
              />
              <button
                type="button"
                onClick={() => setShowKey((prev) => !prev)}
                aria-label={showKey ? 'Ocultar clave' : 'Mostrar clave'}
                className="flex min-h-[54px] min-w-[54px] shrink-0 items-center justify-center rounded-xl border-2 border-[#374151] bg-[#FAF8F5] text-[#111827] hover:bg-[#EFECE6]"
              >
                {showKey ? (
                  <EyeOff className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Eye className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="flex min-h-[58px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F2C59] px-5 py-3 text-[22px] font-bold text-white hover:bg-[#0A1F40] active:scale-[0.99]"
            >
              <Check className="h-6 w-6" aria-hidden="true" />
              <span>Guardar clave</span>
            </button>

            {currentKey && (
              <button
                type="button"
                onClick={handleClear}
                className="flex min-h-[58px] items-center justify-center rounded-xl border-2 border-[#B91C1C] bg-white px-5 py-3 text-[22px] font-bold text-[#B91C1C] hover:bg-red-50"
              >
                Borrar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
