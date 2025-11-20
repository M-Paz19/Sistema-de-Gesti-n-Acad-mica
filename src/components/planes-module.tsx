import { useState } from 'react';
import { Plus, Search, Upload, Download, Eye, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { useEffect } from "react";
import { 
  fetchProgramas, 
  listarPlanes, 
  listarTodosLosPlanes,
  crearPlan, 
  cargarMalla, 
  modificarPlan,
  obtenerMalla
} from "../services/api";


export function PlanesModule() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingMalla, setIsUploadingMalla] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filtroPrograma, setFiltroPrograma] = useState<string>('TODOS');
  const [showReglasModal, setShowReglasModal] = useState(false);
  const [currentPlanForReglas, setCurrentPlanForReglas] = useState<string | null>(null);
  const [reglasNivelacion, setReglasNivelacion] = useState('');
  const [programas, setProgramas] = useState<any[]>([]);
  const [selectedProgramaId, setSelectedProgramaId] = useState<number | null>(null);
  const [materias, setMaterias] = useState<any[]>([]);
  useEffect(() => {
  (async () => {
    try {
      // Cargar todos los planes al abrir la sección
      const data = await listarTodosLosPlanes();
      setPlanes(data.map((p: any) => ({
        ...p,
        año: p.anioInicio
      })));
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar los planes");
    }
  })();
}, []);
  // Cargar la lista de programas al entrar al módulo
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProgramas();
        setProgramas(data);
      } catch (err) {
        toast.error("Error al cargar los programas");
      }
    })();
  }, []);
  const [formData, setFormData] = useState({
    nombre: '',
    version: '',
    programa: '',
    año: new Date().getFullYear()
  });

  // Paso 3: Obtener los planes de un programa desde el backend
  useEffect(() => {
  if (!selectedProgramaId) return;

  (async () => {
    try {
      const data = await listarPlanes(selectedProgramaId);
      const normalizedData = data.map((plan: any) => ({
      id: plan.id,
      nombre: plan.nombre,
      version: plan.version,
      estado: plan.estado,
      programaId: plan.programaId,
      año: plan.anioInicio,
      totalCreditos: plan.creditosTotalesPlan ?? 0,
      materiasCount: plan.materias?.length ?? 0,   // si tu backend no devuelve materias → queda en 0
      electivasRequeridas: plan.electivasRequeridas ?? 0,
      creditosTrabajoGrado: plan.creditosTrabajoGrado ?? 0,

      // Si quieres indicar si requiere malla
      mallaCargar: plan.estado === "CONFIGURACION_PENDIENTE",


      // Reglas
      reglasNivelacion: plan.reglasNivelacion ?? {},

      // Electivas por semestre
      electivasPorSemestre: plan.electivasPorSemestre ?? {},

      // Si backend no envía fechaCreacion, lo agregamos opcional
      fechaCreacion: plan.fechaCreacion ?? "N/A",
    }));

      setPlanes(normalizedData);
    } catch (err: any) {
      toast.error('Error al listar planes');
    }
  })();
  }, [selectedProgramaId]);




  const filteredPlanes = planes.filter(plan => {
  const matchesSearch =
    (plan.nombre ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (plan.version ?? "").toLowerCase().includes(searchTerm.toLowerCase());

  const matchesPrograma =
    filtroPrograma === "TODOS" ||
    String(plan.programaId) === filtroPrograma;

  return matchesSearch && matchesPrograma;
});

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'ACTIVO': return 'default';
      case 'BORRADOR': return 'secondary';
      case 'INACTIVO': return 'outline';
      default: return 'secondary';
    }
  };

  // Paso 2: Crear un nuevo plan usando la API
  const handleSubmit = async () => {
    if (!selectedProgramaId) {
      toast.error('Selecciona primero un programa');
      return;
    }
    if (!formData.nombre || !formData.version) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    try {
      const payload = {
      nombre: formData.nombre,
      version: formData.version,
      anioInicio: Number(formData.año),
      programaId: selectedProgramaId
    };
      const createdPlan = await crearPlan(payload);  // Llamamos a la función de la API para crear el plan
      const nuevoPlan = {
        ...createdPlan,
        id: createdPlan.id,
        año: createdPlan.anioInicio ?? Number(formData.año),
      };
      setPlanes(prev => [...prev, nuevoPlan]);  // Actualizamos el estado de los planes
      toast.success('Plan creado exitosamente');
      setIsCreating(false);
      setFormData({ nombre: '', version: '', programa: '', año: new Date().getFullYear() });
    } catch (err: any) {
      toast.error(err.message || 'Error al crear el plan');
    }
  };


  // Paso 4: Subir la malla curricular al backend
  const handleFileUpload = async (planId: string, file: File) => {
    if (!selectedProgramaId) {
      toast.error('Selecciona un programa primero');
      return;
    }
    setCurrentPlanForReglas(planId);
    setIsUploadingMalla(true);
    setUploadProgress(10);

    const configuration = {
      reglasNivelacionJson: reglasNivelacion || {},
      electivasPorSemestreJson: {},
      electivasRequeridas: 0,
      creditosTotalesPlan: 0,
      creditosTrabajoGrado: 0,
    };

    try {
      const response = await cargarMalla(selectedProgramaId, Number(planId), file, configuration);  // Llamada al backend
      setUploadProgress(100);
      setIsUploadingMalla(false);
      setPlanes(prev => prev.map(p => 
        p.id === planId ? { ...p, mallaCargar: false, estado: 'ACTIVO', totalCreditos: response.creditosTotalesPlan } : p
      ));
      toast.success('Malla cargada correctamente');
      setShowReglasModal(true);
    } catch (err: any) {
      setIsUploadingMalla(false);
      setUploadProgress(0);
      toast.error(err.message || 'Error al cargar malla');
    }
  };


  const handleSaveReglasNivelacion = () => {
    if (!currentPlanForReglas) return;
    
    // Actualizar el plan con los datos de la malla y reglas
    setPlanes(prevPlanes => prevPlanes.map(p => 
      p.id === currentPlanForReglas 
        ? { 
            ...p, 
            totalCreditos: 160, 
            materiasCount: 52, 
            mallaCargar: false,
            estado: 'ACTIVO' as const
          }
        : p
    ));
    
    toast.success('Malla curricular y reglas de nivelación guardadas exitosamente');
    setShowReglasModal(false);
    setReglasNivelacion('');
    setCurrentPlanForReglas(null);
  };

  const generateTemplate = () => {
    // En una implementación real, esto generaría y descargaría un archivo Excel
    toast.success('Plantilla de Excel descargada');
  };

  // Paso 5: Modificar un plan
  const handleModificarPlan = async (planId: string, data: { nombre?: string; version?: string; año?: number }) => {
    if (!selectedProgramaId) {
      toast.error('Falta seleccionar un programa');
      return;
    }
    try {
      const updatedPlan = await modificarPlan(selectedProgramaId, Number(planId), data);  // Llamada al backend para modificar el plan
      const normalizedPlan = { ...updatedPlan, año: updatedPlan.anioInicio ?? data.año, id: updatedPlan.id };
      setPlanes(prev => prev.map(p => p.id === normalizedPlan.id ? normalizedPlan : p));  // Actualizamos el estado con el plan modificado
      toast.success('Plan actualizado');
    } catch (err: any) {
      toast.error(err.message || 'Error al modificar plan');
    }
  };

  async function cargarMallaDelPlan(plan: any) {
  try {
    const data = await obtenerMalla(plan.id); 
    setSelectedPlan(plan);
    setMaterias(data);
  } catch (err) {
    toast.error("Error al cargar la malla curricular");
  }
}


  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1>Gestión de Planes de Estudio</h1>
            <p className="text-muted-foreground">Administra los planes académicos y mallas curriculares</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={generateTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Plantilla Excel
            </Button>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Plan de Estudios</DialogTitle>
                </DialogHeader>
                <Select value={selectedProgramaId ? String(selectedProgramaId) : ""} 
                      onValueChange={(v) => setSelectedProgramaId(Number(v))}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Selecciona un programa" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">Nombre del Plan *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej: Plan de Estudios 2024"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="version">Versión *</Label>
                      <Input
                        id="version"
                        value={formData.version}
                        onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                        placeholder="Ej: v2024.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="año">Año *</Label>
                      <Input
                        id="año"
                        type="number"
                        value={formData.año}
                        onChange={(e) => setFormData(prev => ({ ...prev, año: parseInt(e.target.value) }))}
                        min="2020"
                        max="2030"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreating(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSubmit}>
                      Crear Plan
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {!selectedPlan ? (
          <div className="p-6 space-y-4 h-full overflow-y-auto">
            <div className="flex space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar planes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtroPrograma} onValueChange={setFiltroPrograma}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los programas</SelectItem>
                  {programas.map(programa => (
                  <SelectItem key={programa.id} value={String(programa.id)}>
                    {programa.nombre}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPlanes.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.nombre}</CardTitle>
                        <p className="text-sm text-muted-foreground">{plan.version}</p>
                      </div>
                      <Badge variant={getEstadoBadgeVariant(plan.estado)}>
                        {plan.estado}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><span className="font-medium">Programa:</span> {programas.find(p => p.id === plan.programaId)?.nombre || "—"}</p>
                      <p><span className="font-medium">Año:</span> {plan.año}</p>
                      <p><span className="font-medium">Créditos totales:</span> {plan.creditosTotalesPlan}</p>
                      <p><span className="font-medium">Electivas requeridas:</span> {plan.electivasRequeridas}</p>
                      <p><span className="font-medium">Créditos Trabajo de Grado:</span> {plan.creditosTrabajoGrado}</p>
                      <p><span className="font-medium">Estado:</span> {plan.estado}</p>

                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                    {plan.mallaCargar ? (
                      <div className="w-full space-y-2">
                        <Alert>
                          <AlertDescription>
                            Este plan necesita una malla curricular
                          </AlertDescription>
                        </Alert>

                        {/* Input REAL */}
                        <label className="w-full">
                          <input
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              handleFileUpload(String(plan.id), file);
                            }}
                          />

                          <Button className="w-full" disabled={isUploadingMalla} asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              {isUploadingMalla ? "Cargando..." : "Cargar Malla Excel"}
                            </span>
                          </Button>
                        </label>

                        {isUploadingMalla && (
                          <div className="space-y-1">
                            <Progress value={uploadProgress} className="w-full" />
                            <p className="text-sm text-muted-foreground text-center">
                              {uploadProgress}% completado
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (

                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => cargarMallaDelPlan(plan)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Malla
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPlanes.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron planes que coincidan con los filtros.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => setSelectedPlan(null)}>
                    ← Volver
                  </Button>
                  <h2>{selectedPlan.nombre}</h2>
                  <Badge variant={getEstadoBadgeVariant(selectedPlan.estado)}>
                    {selectedPlan.estado}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {programas.find(p => p.id === selectedPlan.programaId)?.nombre || "—"} - {selectedPlan.version}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total de créditos</p>
                <p className="text-2xl font-bold">
                  {selectedPlan.totalCreditos ?? selectedPlan.creditosTotalesPlan}
                </p>

              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Materias Obligatorias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {materias.filter(m => m.tipo === "OBLIGATORIA").length}
                  </div>
                  <p className="text-sm text-muted-foreground">materias</p>
                </CardContent>
              </Card>

              
              <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Electivas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {materias.filter(m => m.tipo === "ELECTIVA").length}
                </div>
                <p className="text-sm text-muted-foreground">materias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Prácticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {materias.filter(m => m.tipo === "TRABAJO_GRADO").length}
                </div>
                <p className="text-sm text-muted-foreground">materias</p>
              </CardContent>
            </Card>

            </div>

            <Card>
              <CardHeader>
                <CardTitle>Malla Curricular</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Materia</TableHead>
                      <TableHead>Créditos</TableHead>
                      <TableHead>Semestre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Prerequisitos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materias.map(mat => (
                      <TableRow key={mat.id}>
                        <TableCell>{mat.id}</TableCell>
                        <TableCell>{mat.nombre}</TableCell>
                        <TableCell>{mat.creditos}</TableCell>
                        <TableCell>{mat.semestre}</TableCell>
                        <TableCell>{mat.tipo}</TableCell>
                        <TableCell>—</TableCell> {/* No tenemos prerrequisitos */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de Reglas de Nivelación */}
      <Dialog open={showReglasModal} onOpenChange={setShowReglasModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reglas de Nivelación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Define las reglas de nivelación que se aplicarán para identificar estudiantes que requieren nivelación académica.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="reglas">Reglas de Nivelación</Label>
              <Textarea
                id="reglas"
                value={reglasNivelacion}
                onChange={(e) => setReglasNivelacion(e.target.value)}
                placeholder="Ejemplo: Estudiante con promedio menor a 3.5 o con más de 2 materias pendientes..."
                rows={6}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setShowReglasModal(false);
                setReglasNivelacion('');
                setCurrentPlanForReglas(null);
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSaveReglasNivelacion}>
                Guardar y Continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}