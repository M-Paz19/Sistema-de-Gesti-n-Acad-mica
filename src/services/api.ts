const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// ... (Interfaces anteriores se mantienen) ...

// Nuevas Interfaces para Nivelación
export interface MateriaComparadaDTO {
  nombre: string;
  semestre: number;
  obligatoria: boolean;
  aprobada: boolean;
  observacion: string;
}

export interface VerificacionNiveladoDTO {
  codigoEstudiante: string;
  nombre: string;
  programa: string;
  nivelado: boolean;
  semestreVerificado: number;
  mensajeResumen: string;
  comparacionMaterias: MateriaComparadaDTO[];
}

export interface DatosAcademicoResponse {
  id: number;
  codigoEstudiante: string;
  apellidos: string;
  nombres: string;
  programa: string;
  creditosAprobados: number;
  periodosMatriculados: number;
  promedioCarrera: number;
  aprobadas: number;
  esNivelado: boolean;
  porcentajeAvance: number;
  estadoAptitud: string; // PENDIENTE_VALIDACION, POSIBLE_NIVELADO, etc.
}

// ... (Interfaces y funciones existentes: Departamento, Programa, Electiva, Periodo, Oferta, etc.) ...

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

export interface Electiva {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  departamentoId: number;
  departamentoNombre?: string;
  programas: { id: number; nombre: string }[];
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'INACTIVA';
  fechaCreacion: string;
}

export interface Periodo {
  id: number;
  semestre: string;
  fechaApertura: string;
  fechaCierre: string;
  estado: string;
  numeroOpcionesFormulario?: number;
  urlFormulario?: string;
  opcionesPorPrograma?: Record<string, number>;
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

export interface PlanEstudio {
    id: number;
    nombre: string;
    version: string;
    estado: string;
    anioInicio: number;
    programaId: number;
    creditosTotalesPlan?: number;
    materiasCount?: number;
    electivasRequeridas?: number;
    creditosTrabajoGrado?: number;
    mallaCargar?: boolean;
    reglasNivelacion?: any;
    electivasPorSemestre?: any;
    fechaCreacion?: string;
}

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

export interface RespuestaFormularioDesicionResponse {
  id: number;
  codigoEstudiante: string;
  correoEstudiante: string;
  nombreCompleto: string;
  estado: string;
  mensaje: string;
}

export interface CambioEstadoValidacionResponse {
  periodoId: number;
  semestre: string;
  nuevoEstado: string;
  mensaje: string;
}

export interface InconsistenciaDto {
  respuestaId: number | null;
  codigoEstudianteCsv: string;
  nombreEstudianteCsv: string;
  error: string;
  archivoOrigen: string;
}

export interface SimcaCargaResponse {
  mensaje: string;
  archivosProcesados: number;
  registrosCargadosExitosamente: number;
  inconsistenciasEncontradas: number;
  detalleInconsistencias: InconsistenciaDto[];
}

// ... (Funciones existentes de Departamentos, Programas, Electivas, Planes, Periodos, Ofertas) ...
// ... (Omitidas para brevedad, asegúrate de mantenerlas) ...
// ==========================================
//             DEPARTAMENTOS
// ==========================================

export async function fetchDepartamentos(): Promise<Departamento[]> {
  const res = await fetch(`${API_URL}/api/departamentos`);
  if (!res.ok) throw new Error("Error al obtener departamentos");
  return res.json();
}

export async function createDepartamento(departamento: any) {
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

export async function updateDepartamento(id: string, departamento: any) {
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

export async function createPrograma(programa: any): Promise<Programa> {
  const res = await fetch(`${API_URL}/api/programas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...programa, estado: 'BORRADOR' }),
  });
  if (!res.ok) throw new Error("Error al crear programa");
  return res.json();
}

export async function updatePrograma(id: string, programa: any): Promise<Programa> {
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

// ==========================================
//             ELECTIVAS
// ==========================================

export async function fetchElectivas(): Promise<Electiva[]> {
  const res = await fetch(`${API_URL}/api/electivas`);
  if (!res.ok) throw new Error("Error al obtener electivas");
  return res.json();
}

export async function createElectiva(electiva: any): Promise<Electiva> {
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

export async function fetchElectivaById(id: string): Promise<Electiva> {
  const res = await fetch(`${API_URL}/api/electivas/${id}`);
  if (!res.ok) throw new Error("Error al obtener la electiva");
  return res.json();
}

export async function updateElectiva(id: string, electiva: any): Promise<Electiva> {
  const res = await fetch(`${API_URL}/api/electivas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(electiva),
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // Evita el crash si la API no devuelve JSON
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || "Error al actualizar electiva");
  }

  return {
    ...data,
    programas: data?.programas || []
  };
}


export async function approveElectiva(id: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/electivas/${id}/aprobar`, { method: "PATCH" });

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // Si no hay JSON, no pasa nada
  }

  if (!res.ok) {
    throw new Error(data?.message || "Error al aprobar electiva");
  }

  return data; // Puede ser null si el backend no retorna nada
}


export async function deactivateElectiva(id: string): Promise<Electiva> {
  const res = await fetch(`${API_URL}/api/electivas/${id}/desactivar`, { method: "PATCH" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.message || "Error al desactivar electiva");
  }
  return res.json();
}

export async function reactivateElectiva(id: string): Promise<Electiva> {
  const res = await fetch(`${API_URL}/api/electivas/${id}/reactivar`, { method: "PATCH" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.message || "Error al reactivar electiva");
  }
  return res.json();
}

// ==========================================
//             PLANES DE ESTUDIO
// ==========================================

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

export async function listarPlanes(programaId: number) {
  const response = await fetch(`${API_URL}/api/programas/${programaId}/planes`);
  if (!response.ok) throw new Error('Error al listar planes');
  return response.json();
}

export async function modificarPlan(programaId: number, planId: number, data: any) {
  const response = await fetch(`${API_URL}/api/programas/${programaId}/planes/${planId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error al modificar el plan');
  return response.json();
}

export async function cargarMalla(programaId, planId, archivo, config) {
  const formData = new FormData();

  formData.append("file", archivo);
  formData.append(
    "configuracion",
    new Blob([JSON.stringify(config)], { type: "application/json" })
  );

  const res = await fetch(`${API_URL}/api/programas/${programaId}/planes/${planId}/malla`, {
    method: "POST",
    body: formData,
  });

  // 👇 CAMBIO IMPORTANTE AQUÍ
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // Si no hay JSON, evitamos el error del frontend
  }

  if (!res.ok) {
    throw data || { message: "Error desconocido en carga de malla" };
  }

  return data;
}

export async function listarTodosLosPlanes(): Promise<PlanEstudio[]> {
  try {
    const programas = await fetchProgramas();
    let todosLosPlanes: PlanEstudio[] = [];
    
    for (const prog of programas) {
      try {
        const planes = await listarPlanes(parseInt(prog.id));
        const planesConPrograma = planes.map((p: any) => ({
          ...p,
          programaId: parseInt(prog.id)
        }));
        todosLosPlanes = [...todosLosPlanes, ...planesConPrograma];
      } catch (e) {
        console.warn(`No se pudieron cargar planes para programa ${prog.id}`, e);
      }
    }

    return todosLosPlanes;
  } catch (error) {
    console.error("Error al listar todos los planes", error);
    return [];
  }
}


export async function obtenerMalla(planId: number) {
    console.warn("Endpoint obtenerMalla no implementado en backend. Retornando array vacío.");
    return []; 
}

// ==========================================
//             PERIODOS ACADÉMICOS
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

export async function abrirPeriodo(id: number, opcionesPorPrograma: Record<string, number>, forzar: boolean = false) {
  const res = await fetch(`${API_URL}/api/periodos-academicos/${id}/abrir`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      opcionesPorPrograma: opcionesPorPrograma,
      numeroOpcionesFormulario: 1, // Dummy por compatibilidad
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

export async function cerrarPeriodoAcademico(id: number) {
    const res = await fetch(`${API_URL}/api/periodos-academicos/${id}/cerrar-periodo`, { method: "POST" });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Error al cerrar el periodo");
    }
    return res.json();
}

// ==========================================
//             OFERTA ACADÉMICA
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

// =========================================================
//    PROCESAMIENTO Y VALIDACIÓN (ValidacionRespuestas)
// =========================================================

export async function fetchRespuestasFormulario(periodoId: number): Promise<RespuestaFormulario[]> {
  const res = await fetch(`${API_URL}/api/procesamiento/periodos/${periodoId}/respuestas`);
  if (!res.ok) throw new Error("Error al obtener respuestas del formulario");
  return res.json();
}

export async function aplicarFiltroDuplicados(periodoId: number): Promise<CambioEstadoValidacionResponse> {
  const res = await fetch(`${API_URL}/api/procesamiento/periodos/${periodoId}/filtro-duplicados`, { method: "POST" });
  if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
  return res.json();
}

export async function aplicarFiltroAntiguedad(periodoId: number): Promise<CambioEstadoValidacionResponse> {
  const res = await fetch(`${API_URL}/api/procesamiento/periodos/${periodoId}/filtro-antiguedad`, { method: "POST" });
  if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
  return res.json();
}

export async function revisarManualFormatoInvalido(respuestaId: number, incluir: boolean, nuevoCodigo: string): Promise<RespuestaFormularioDesicionResponse> {
  const res = await fetch(`${API_URL}/api/procesamiento/respuestas/${respuestaId}/revision-manual?incluir=${incluir}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nuevoCodigo: nuevoCodigo || "0" }) 
  });
  
  if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error en revisión manual");
  }
  return res.json();
}

export async function confirmarListaParaSimca(periodoId: number): Promise<CambioEstadoValidacionResponse> {
  const res = await fetch(`${API_URL}/api/procesamiento/periodos/${periodoId}/confirmar-simca`, { method: "POST" });
  if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
  return res.json();
}

// =========================================================
//    VALIDACIÓN ACADÉMICA (ValidacionAcademicaController)
// =========================================================

export async function cargarDatosSimca(periodoId: number, files: File[]): Promise<SimcaCargaResponse> {
  const formData = new FormData();
  files.forEach(file => formData.append("archivos", file));

  const res = await fetch(`${API_URL}/api/validacion-academica/periodos/${periodoId}/cargar-simca`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
  return res.json();
}

export async function fetchDatosAcademicos(periodoId: number, estados?: string[]): Promise<DatosAcademicoResponse[]> {
  const params = new URLSearchParams();
  if (estados && estados.length > 0) {
      estados.forEach(e => params.append("estados", e));
  }
  const res = await fetch(`${API_URL}/api/validacion-academica/periodo/${periodoId}/datos-academicos?${params.toString()}`);
  if (!res.ok) throw new Error("Error al obtener datos académicos");
  return res.json();
}

export async function listarInconsistencias(periodoId: number): Promise<RespuestaFormulario[]> {
  const res = await fetch(`${API_URL}/api/validacion-academica/periodos/${periodoId}/inconsistencias`);
  if (!res.ok) throw new Error("Error al listar inconsistencias");
  return res.json();
}

export async function resolverInconsistencia(respuestaId: number, incluir: boolean, nuevoCodigo: string) {
    const res = await fetch(`${API_URL}/api/validacion-academica/respuestas/${respuestaId}/decision-inconsistencia?incluir=${incluir}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nuevoCodigo: nuevoCodigo || "0" })
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
    return res.json();
}

export async function descargarLotesSimca(periodoId: number) {
  const res = await fetch(`${API_URL}/api/archivos/descargar/lotes/${periodoId}`);
  if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Error al descargar lotes");
  }
  return res.blob();
}

export async function regenerarLoteCorregidos(periodoId: number) {
  return descargarLotesSimca(periodoId);
}

export async function calcularPorcentajeAvance(periodoId: number): Promise<CambioEstadoValidacionResponse> {
    const res = await fetch(`${API_URL}/api/validacion-academica/periodos/${periodoId}/calcular-porcentaje-avance`, { method: "POST" });
    if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
    return res.json();
}

export async function validarRequisitosGenerales(periodoId: number): Promise<CambioEstadoValidacionResponse> {
    const res = await fetch(`${API_URL}/api/validacion-academica/periodos/${periodoId}/validar-requisitos-generales`, { method: "POST" });
    if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
    return res.json();
}

// =========================================================
//    VALIDACIÓN NIVELADOS (ValidacionNiveladosController)
// =========================================================

// 1. Preseleccionar Nivelados
export async function preseleccionarNivelados(periodoId: number): Promise<DatosAcademicoResponse[]> {
    const res = await fetch(`${API_URL}/api/validacion-nivelados/periodos/${periodoId}/preseleccionar-nivelados`, { method: "POST" });
    if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
    return res.json();
}

// 2. Generar Reporte Visual (Subir Excel)
export async function generarReporteNivelado(idDatosAcademicos: number, file: File): Promise<VerificacionNiveladoDTO> {
    const formData = new FormData();
    formData.append("archivo", file);
    
    const res = await fetch(`${API_URL}/api/validacion-nivelados/reporte/${idDatosAcademicos}`, {
        method: "POST",
        body: formData
    });
    
    if (!res.ok) { 
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error al generar reporte de nivelación"); 
    }
    return res.json();
}

// 3. Registrar Decisión Final
export async function registrarDecisionFinal(idDatosAcademicos: number, nivelado: boolean): Promise<DatosAcademicoResponse> {
    // OJO: El endpoint usa @RequestParam, así que usamos query params
    const res = await fetch(`${API_URL}/api/validacion-nivelados/decision-final/${idDatosAcademicos}?nivelado=${nivelado}`, {
        method: "POST"
    });
    
    if (!res.ok) { 
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error al registrar decisión"); 
    }
    return res.json();
}