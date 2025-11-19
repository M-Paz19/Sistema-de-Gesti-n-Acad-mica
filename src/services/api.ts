const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// ==========================================
//             INTERFACES
// ==========================================

export interface Departamento {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  fechaCreacion: string;
}

export interface Programa {
  id: string;
  nombre: string;
  codigo: string;
  estado: 'BORRADOR' | 'APROBADO' | 'DESHABILITADO';
  fechaCreacion: string;
}

// CAMBIO AQUÍ: Ajustamos para recibir la lista de objetos programas
export interface Electiva {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  departamentoId: number;
  departamentoNombre?: string; // Opcional, útil para mostrar
  programas: { id: number; nombre: string }[]; // El backend envía esto
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'INACTIVA';
  fechaCreacion: string;
}

export interface Periodo {
  id: number;
  semestre: string;
  fechaApertura: string;
  fechaCierre: string;
  estado: 'CONFIGURACION' | 'ABIERTO_FORMULARIO' | 'CERRADO_FORMULARIO' | 'EN_PROCESO_ASIGNACION' | 'CERRADO' | 'PROCESO_CARGA_SIMCA' | 'PROCESO_REVISION_POTENCIALES_NIVELADOS' | 'PROCESO_CALCULO_AVANCE' | 'PROCESO_CALCULO_APTITUD';
  numeroOpcionesFormulario?: number;
  urlFormulario?: string;
}

export interface Oferta {
  id: number;
  electivaId: number;
  nombreElectiva: string;
  codigoElectiva: string;
  periodoId: number;
  nombrePeriodo: string;
  estado: 'OFERTADA' | 'EN_CURSO' | 'CERRADA';
  cuposPorPrograma: Record<string, number>;
}

// ==========================================
//             DEPARTAMENTOS
// ==========================================

export async function fetchDepartamentos(): Promise<Departamento[]> {
  const res = await fetch(`${API_URL}/api/departamentos`);
  if (!res.ok) throw new Error("Error al obtener departamentos");
  return res.json();
}

export async function createDepartamento(departamento: Omit<Departamento, "id" | "fechaCreacion">) {
  const res = await fetch(`${API_URL}/api/departamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(departamento),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Error al crear departamento");
  }
  return res.json();
}

export async function updateDepartamento(id: string, departamento: Partial<Departamento>) {
  const res = await fetch(`${API_URL}/api/departamentos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(departamento),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Error al actualizar departamento");
  }
  return res.json();
}

// ==========================================
//             PROGRAMAS
// ==========================================

export async function fetchProgramas(): Promise<Programa[]> {
  const res = await fetch(`${API_URL}/api/programas`);
  if (!res.ok) throw new Error("Error al obtener programas");
  return res.json();
}

export async function createPrograma(programa: Omit<Programa, "id" | "estado" | "fechaCreacion">): Promise<Programa> {
  const res = await fetch(`${API_URL}/api/programas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...programa, estado: 'BORRADOR' }),
  });
  if (!res.ok) throw new Error("Error al crear programa");
  return res.json();
}

export async function updatePrograma(id: string, programa: Partial<Programa>): Promise<Programa> {
  const res = await fetch(`${API_URL}/api/programas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(programa),
  });
  if (!res.ok) throw new Error("Error al actualizar programa");
  return res.json();
}

export async function disablePrograma(id: string): Promise<Programa> {
  const res = await fetch(`${API_URL}/api/programas/${id}/deshabilitar`, { method: "PATCH" });
  if (!res.ok) throw new Error("Error al deshabilitar programa");
  return res.json();
}





// --------------------- Electivas ---------------------
export interface Electiva {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  departamentoId: number;
  programasIds: number[];
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'INACTIVA';
  fechaCreacion: string;
}

// Listar todas las electivas
export async function fetchElectivas(): Promise<Electiva[]> {
  const res = await fetch(`${API_URL}/api/electivas`);
  if (!res.ok) throw new Error("Error al obtener electivas");
  return res.json();
}

// Crear una electiva
export async function createElectiva(electiva: Omit<Electiva, "id" | "estado" | "fechaCreacion">): Promise<Electiva> {
  const res = await fetch(`${API_URL}/api/electivas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(electiva),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.message || "Error al crear electiva");
  }
  return res.json();
}

// Obtener electiva por ID
export async function fetchElectivaById(id: string): Promise<Electiva> {
  const res = await fetch(`${API_URL}/api/electivas/${id}`);
  if (!res.ok) throw new Error("Error al obtener la electiva");
  return res.json();
}

// Actualizar electiva
export async function updateElectiva(id: string, electiva: Partial<Electiva>): Promise<Electiva> {
  const res = await fetch(`${API_URL}/api/electivas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(electiva),
  });
  if (!res.ok) throw new Error("Error al actualizar electiva");
  
  const data = await res.json();

  // 🔧 Normaliza para evitar errores al renderizar
  return {
    ...data,
    programas: data.programas || [],
  };
}


// Aprobar electiva
export async function approveElectiva(id: string): Promise<Electiva> {
  const res = await fetch(`${API_URL}/api/electivas/${id}/aprobar`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.message || "Error al aprobar electiva");
  }
  return res.json();
}

// Desactivar electiva
export async function deactivateElectiva(id: string): Promise<Electiva> {
  const res = await fetch(`${API_URL}/api/electivas/${id}/desactivar`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.message || "Error al desactivar electiva");
  }
  return res.json();
}

// Reactivar electiva
export async function reactivateElectiva(id: string): Promise<Electiva> {
  const res = await fetch(`${API_URL}/api/electivas/${id}/reactivar`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.message || "Error al reactivar electiva");
  }
  return res.json();
};

// --------------------- Planes de estudio ---------------------

// 1. Crear un nuevo plan
export const crearPlan = async (payload: any) => {
  const response = await fetch(`${API_URL}/api/programas/${payload.programaId}/planes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al crear plan');
  }

  return await response.json();
};



// 2. Listar planes de un programa
export async function listarPlanes(programaId: number) {
  const response = await fetch(`${API_URL}/api/programas/${programaId}/planes`);
  if (!response.ok) throw new Error('Error al listar planes');
  return response.json();
}

// 3. Modificar un plan
export async function modificarPlan(programaId: number, planId: number, data: any) {
  const response = await fetch(`${API_URL}/api/programas/${programaId}/planes/${planId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error al modificar el plan');
  return response.json();
}

// 4. Cargar malla
export async function cargarMalla(programaId: number, planId: number, file: File, configuration: any) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('configuration', JSON.stringify(configuration));

  const response = await fetch(`${API_URL}/api/programas/${programaId}/planes/${planId}/malla`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Error al cargar malla');
  return response.json();
}


// ==========================================
//        PERIODOS ACADÉMICOS
// ==========================================

export async function fetchPeriodos(semestre?: string, estado?: string): Promise<Periodo[]> {
  const params = new URLSearchParams();
  if (semestre) params.append("semestreTexto", semestre);
  if (estado && estado !== 'TODOS') params.append("estado", estado);

  const res = await fetch(`${API_URL}/api/periodos-academicos?${params.toString()}`);
  if (!res.ok) throw new Error("Error al obtener periodos");
  return res.json();
}

export async function createPeriodo(data: { semestre: string; fechaApertura: string; fechaCierre: string }): Promise<Periodo> {
  const res = await fetch(`${API_URL}/api/periodos-academicos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Error al crear periodo");
  }
  return res.json();
}

export async function abrirPeriodo(id: number, numeroOpciones: number, forzar: boolean = false) {
  const res = await fetch(`${API_URL}/api/periodos-academicos/${id}/abrir`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      numeroOpcionesFormulario: numeroOpciones,
      forzarApertura: forzar
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Error al abrir el periodo");
  }
  return res.json();
}

export async function cerrarFormulario(id: number) {
  const res = await fetch(`${API_URL}/api/periodos-academicos/${id}/cerrar-formulario`, { method: "POST" });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Error al cerrar formulario");
  }
  return res.json();
}

export async function cargarRespuestasManual(id: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/periodos-academicos/${id}/cargar-respuestas`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Error al cargar respuestas");
  }
  return res.json();
}

// ==========================================
//        OFERTA ACADÉMICA
// ==========================================

export async function fetchOfertasPorPeriodo(periodoId: number): Promise<Oferta[]> {
  const res = await fetch(`${API_URL}/api/periodos/${periodoId}/ofertas`);
  if (!res.ok) throw new Error("Error al obtener ofertas");
  return res.json();
}

export async function agregarOferta(periodoId: number, electivaId: number, cupos: Record<number, number>): Promise<Oferta> {
  const res = await fetch(`${API_URL}/api/periodos/${periodoId}/ofertas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      electivaId,
      cuposPorPrograma: cupos
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Error al agregar electiva a la oferta");
  }
  return res.json();
}

export async function editarCupos(ofertaId: number, cupos: Record<number, number>): Promise<Oferta> {
  const res = await fetch(`${API_URL}/api/ofertas/${ofertaId}/cupos`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cuposPorPrograma: cupos }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Error al actualizar cupos");
  }
  return res.json();
}

export async function eliminarOferta(ofertaId: number) {
  const res = await fetch(`${API_URL}/api/ofertas/${ofertaId}`, { method: "DELETE" });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Error al eliminar oferta");
  }
  return res.json();
}

// ==========================================
//        PROCESAMIENTO Y VALIDACIÓN
// ==========================================

export interface RespuestaFormulario {
  id: number;
  codigoEstudiante: string;
  correoEstudiante: string;
  nombreEstudiante: string;
  apellidosEstudiante: string;
  programaNombre: string;
  periodoSemestre: string;
  timestampRespuesta: string;
  estado: string;
  electivasSeleccionadas: {
    opcionNum: number;
    nombreElectiva: string;
  }[];
}

export async function fetchRespuestasFormulario(periodoId: number): Promise<RespuestaFormulario[]> {
  const res = await fetch(`${API_URL}/api/procesamiento/periodos/${periodoId}/respuestas`);
  if (!res.ok) throw new Error("Error al obtener respuestas del formulario");
  return res.json();
}
