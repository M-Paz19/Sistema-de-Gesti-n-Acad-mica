export function UnicaucaLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Escudo base */}
      <path
        d="M100 20 L160 50 L160 130 Q160 160 100 180 Q40 160 40 130 L40 50 Z"
        fill="#FDB913"
        stroke="#ffffff"
        strokeWidth="3"
      />
      <path
        d="M100 30 L150 55 L150 125 Q150 150 100 168 Q50 150 50 125 L50 55 Z"
        fill="#003366"
      />
      
      {/* Libro abierto */}
      <path
        d="M70 80 L100 75 L100 130 L70 135 Z"
        fill="#FDB913"
        opacity="0.9"
      />
      <path
        d="M100 75 L130 80 L130 135 L100 130 Z"
        fill="#FDB913"
        opacity="0.7"
      />
      
      {/* Líneas del libro */}
      <line x1="75" y1="85" x2="95" y2="82" stroke="#003366" strokeWidth="1.5" />
      <line x1="75" y1="95" x2="95" y2="92" stroke="#003366" strokeWidth="1.5" />
      <line x1="75" y1="105" x2="95" y2="102" stroke="#003366" strokeWidth="1.5" />
      <line x1="105" y1="82" x2="125" y2="85" stroke="#003366" strokeWidth="1.5" />
      <line x1="105" y1="92" x2="125" y2="95" stroke="#003366" strokeWidth="1.5" />
      <line x1="105" y1="102" x2="125" y2="105" stroke="#003366" strokeWidth="1.5" />
      
      {/* Estrella superior */}
      <path
        d="M100 45 L103 54 L112 54 L105 60 L108 69 L100 63 L92 69 L95 60 L88 54 L97 54 Z"
        fill="#FDB913"
      />
      
      {/* Texto UC */}
      <text
        x="100"
        y="160"
        textAnchor="middle"
        fill="#FDB913"
        fontSize="28"
        fontWeight="bold"
        fontFamily="serif"
      >
        UC
      </text>
    </svg>
  );
}

export function UnicaucaLogotipo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <UnicaucaLogo className="w-12 h-12 flex-shrink-0" />
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
