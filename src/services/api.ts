const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// --------------------- Departamentos ---------------------
export interface Departamento {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  fechaCreacion: string;
}

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


// --------------------- Programas ---------------------
export interface Programa {
  id: string;
  nombre: string;
  codigo: string;
  estado: 'BORRADOR' | 'APROBADO' | 'DESHABILITADO';
  fechaCreacion: string;
}

// Listar todos los programas
export async function fetchProgramas(): Promise<Programa[]> {
  const res = await fetch(`${API_URL}/api/programas`);
  if (!res.ok) throw new Error("Error al obtener programas");
  return res.json();
}

// Crear un programa
export async function createPrograma(programa: Omit<Programa, "id" | "estado" | "fechaCreacion">): Promise<Programa> {
  const res = await fetch(`${API_URL}/api/programas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...programa,
      estado: 'BORRADOR', // estado por defecto
    }),
  });
  if (!res.ok) throw new Error("Error al crear programa");
  return res.json();
}


// Actualizar un programa
export async function updatePrograma(id: string, programa: Partial<Programa>): Promise<Programa> {
  const res = await fetch(`${API_URL}/api/programas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(programa),
  });
  if (!res.ok) throw new Error("Error al actualizar programa");
  return res.json();
}

// Deshabilitar un programa
export async function disablePrograma(id: string): Promise<Programa> {
  const res = await fetch(`${API_URL}/api/programas/${id}/deshabilitar`, {
    method: "PATCH",
  });
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
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.message || "Error al actualizar electiva");
  }
  return res.json();
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