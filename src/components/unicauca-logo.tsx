import logo from "../assets/logo-unicauca.png";

export function UnicaucaLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="Logo Universidad del Cauca"
      className={className}
    />
  );
}
export function UnicaucaLogotipo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="p-1 bg-white rounded-md shadow">
        <UnicaucaLogo className="w-12 h-12" />
      </div>

      <div className="flex flex-col">
        <span className="text-white font-bold text-base leading-tight">
          Universidad del Cauca
        </span>
        <span className="text-[#FDB913] text-xs leading-tight">
          Facultad de Ingeniería
        </span>
      </div>
    </div>
  );
}
