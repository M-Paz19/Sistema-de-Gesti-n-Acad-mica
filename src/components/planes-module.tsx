import { useState, useEffect } from 'react';
import { Plus, Search, Upload, Eye } from 'lucide-react';
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
import { toast } from 'sonner@2.0.3';

// Importaciones corregidas y verificadas
import { 
  PlanEstudio, 
  Programa, 
  fetchProgramas, 
  crearPlan, 
  listarTodosLosPlanes, // Esta función DEBE existir en api.ts
  cargarMalla,
  obtenerMalla 
} from '../services/api';

export function PlanesModule() {
  const [planes, setPlanes] = useState<PlanEstudio[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanEstudio | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingMalla, setIsUploadingMalla] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filtroPrograma, setFiltroPrograma] = useState<string>('TODOS');
  
  // Estados para el formulario de creación
  const [formData, setFormData] = useState({
    nombre: '',
    version: '',
    programaId: '',
    anioInicio: new Date().getFullYear()
  });

  // Estados para carga de malla y configuración
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedPlanForConfig, setSelectedPlanForConfig] = useState<PlanEstudio | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  // De tu compañero
  const [materias, setMaterias] = useState<any[]>([]);
  // De tu rama (configuración automática)
  const [cantidadSemestres, setCantidadSemestres] = useState<number | null>(null);
  const [desdeSemestreElectivas, setDesdeSemestreElectivas] = useState<number | null>(null);
  const [electivasAuto, setElectivasAuto] = useState<Record<number, number>>({});
  const [reglasAuto, setReglasAuto] = useState<any>({});
  const [configForm, setConfigForm] = useState({
    electivasPorSemestreJson: {},
    reglasNivelacionJson: {},
    electivasRequeridas: 0,
    creditosTotalesPlan: 0,
    creditosTrabajoGrado: 0,
  });

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Cargar programas
        const progs = await fetchProgramas();
        setProgramas(progs);
        
        // 2. Cargar todos los planes
        const allPlanes = await listarTodosLosPlanes();
        setPlanes(allPlanes);
      } catch (err) {
        console.error(err);
        toast.error('Error al cargar datos iniciales. Verifica la conexión con el backend.');
      }
    };
    loadData();
  }, []);

  const filteredPlanes = planes.filter(plan => {
    const matchesSearch = plan.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.version.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrograma = filtroPrograma === 'TODOS' || plan.programaId.toString() === filtroPrograma;
    return matchesSearch && matchesPrograma;
  });

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'ACTIVO': return 'default'; // Verde/Azul oscuro según tema
      case 'CONFIGURACION_PENDIENTE': return 'secondary'; // Gris/Amarillo
      case 'INACTIVO': return 'outline'; // Borde
      default: return 'secondary';
    }
  };

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.version || !formData.programaId) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    try {
      await crearPlan({
        nombre: formData.nombre,
        version: formData.version,
        programaId: parseInt(formData.programaId),
        anioInicio: formData.anioInicio
      });
      
      toast.success('Plan de estudios creado exitosamente');
      setIsCreating(false);
      
      // Recargar lista
      const updated = await listarTodosLosPlanes();
      setPlanes(updated);
      
      // Reset form
      setFormData({
        nombre: '',
        version: '',
        programaId: '',
        anioInicio: new Date().getFullYear()
      });
    } catch (err: any) {
      toast.error(err.message || "Error al crear el plan");
    }
  };

  // Función para ver el detalle de un plan (malla)
    async function cargarMallaDelPlan(plan: any) {
    try {
      const data = await obtenerMalla(plan.id); 
      setSelectedPlan(plan);
      setMaterias(data); 
    } catch (err) {
      toast.error("Error al cargar la malla curricular");
    }
  }

  function generarCamposAutomaticos() {
    if (!cantidadSemestres || !desdeSemestreElectivas) return;

    const electivas: Record<number, number> = {};
    const reglas: any = {};

    for (let sem = desdeSemestreElectivas; sem <= cantidadSemestres; sem++) {
      electivas[sem] = 0;
      reglas[sem] = {
        minCreditosAprobados: 0,
        maxPeriodosMatriculados: 0
      };
    }

    setElectivasAuto(electivas);
    setReglasAuto(reglas);
  }


  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="p-6 border-b bg-gradient-to-r from-[#003366]/5 to-[#FDB913]/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#003366] text-2xl font-bold">Gestión de Planes de Estudio</h1>
            <p className="text-muted-foreground">Administra los planes académicos y mallas curriculares</p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="bg-[#003366] hover:bg-[#0d4f8b]">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Plan de Estudios</DialogTitle>
                </DialogHeader>
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
                        placeholder="Ej: 544"
                      />
                    </div>
                    <div>
                      <Label htmlFor="anio">Año Inicio *</Label>
                      <Input
                        id="anio"
                        type="number"
                        value={formData.anioInicio}
                        onChange={(e) => setFormData(prev => ({ ...prev, anioInicio: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="programa">Programa *</Label>
                    <Select value={formData.programaId} onValueChange={(value) => setFormData(prev => ({ ...prev, programaId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona programa" />
                      </SelectTrigger>
                      <SelectContent>
                        {programas.map(prog => (
                          <SelectItem key={prog.id} value={prog.id.toString()}>{prog.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 overflow-hidden p-6">
        {!selectedPlan ? (
          // VISTA: LISTA DE PLANES
          <div className="space-y-4 h-full overflow-y-auto">
            {/* Filtros */}
            <div className="flex space-x-4 bg-white p-4 rounded-lg border shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o versión..."
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
                  {programas.map(prog => (
                    <SelectItem key={prog.id} value={prog.id.toString()}>{prog.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grid de Tarjetas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPlanes.map((plan) => (
                <Card key={plan.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold">{plan.nombre}</CardTitle>
                        <p className="text-sm text-muted-foreground">Versión: {plan.version}</p>
                      </div>
                      <Badge variant={getEstadoBadgeVariant(plan.estado)}>
                        {plan.estado.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Programa:</span> {programas.find(p => p.id === plan.programaId.toString())?.nombre || "Cargando..."}</p>
                      <p><span className="font-semibold">Año Inicio:</span> {plan.anioInicio}</p>
                      <p><span className="font-semibold">Créditos:</span> {plan.creditosTotalesPlan || 0}</p>
                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                        {plan.estado === 'CONFIGURACION_PENDIENTE' ? (
                            <Button 
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                                onClick={() => {
                                    setSelectedPlanForConfig(plan);
                                    setIsConfigModalOpen(true);
                                }}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Configurar Malla
                            </Button>
                        ) : (
                            <Button className="w-full" variant="outline" onClick={() => cargarMallaDelPlan(plan)}>
                                <Eye className="h-4 w-4 mr-2" /> Ver Detalles
                            </Button>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPlanes.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <p>No se encontraron planes de estudio.</p>
                    <p className="text-sm">Intenta ajustar los filtros o crear uno nuevo.</p>
                </div>
            )}
          </div>
        ) : (
            // VISTA: DETALLE DEL PLAN (MALLA)
            <div className="space-y-6 h-full overflow-y-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button onClick={() => setSelectedPlan(null)} variant="outline">← Volver</Button>
                        <div>
                            <h2 className="text-2xl font-bold">{selectedPlan.nombre}</h2>
                            <p className="text-muted-foreground text-sm">
                                {programas.find(p => p.id === selectedPlan.programaId.toString())?.nombre} - {selectedPlan.version}
                            </p>
                        </div>
                    </div>
                    <Badge className="text-lg px-3 py-1" variant={getEstadoBadgeVariant(selectedPlan.estado)}>
                        {selectedPlan.estado.replace('_', ' ')}
                    </Badge>
                </div>

                {/* Resumen de Créditos */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Créditos Totales</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{selectedPlan.creditosTotalesPlan}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Electivas Requeridas</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{selectedPlan.electivasRequeridas}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Trabajo de Grado</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{selectedPlan.creditosTrabajoGrado}</div></CardContent>
                    </Card>
                </div>

                {/* Tabla de Materias */}
                <Card>
                    <CardHeader>
                        <CardTitle>Malla Curricular</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {materias.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                <p>No se pudieron cargar las materias o la lista está vacía.</p>
                                <p className="text-xs">(Verifica que el backend tenga implementado el endpoint para obtener materias)</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Semestre</TableHead>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Materia</TableHead>
                                        <TableHead>Créditos</TableHead>
                                        <TableHead>Tipo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {materias.map((mat, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-bold text-center">{mat.semestre}</TableCell>
                                            <TableCell className="font-mono text-xs">{mat.codigo || "N/A"}</TableCell>
                                            <TableCell>{mat.nombre}</TableCell>
                                            <TableCell>{mat.creditos}</TableCell>
                                            <TableCell><Badge variant="outline">{mat.tipo}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        )}
      </div>

      {/* MODAL DE CONFIGURACIÓN Y CARGA */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar y Cargar Malla Curricular</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                Asegúrate de que el archivo Excel tenga las columnas: <b>codigo, nombre, creditos, semestre</b>.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="mb-2 block">Electivas por semestre (JSON)</Label>
                  <Textarea
                    placeholder={`Ejemplo:\n{\n  "8": 2,\n  "9": 2,\n  "10": 1\n}`}
                    className="font-mono text-xs h-32"
                    onChange={(e) => {
                      try {
                        setConfigForm(prev => ({
                          ...prev,
                          electivasPorSemestreJson: JSON.parse(e.target.value)
                        }));
                      } catch (_) {}
                    }}
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Reglas de nivelación (JSON)</Label>
                  <Textarea
                    placeholder={`Ejemplo:\n{\n  "Octavo": { "minCreditosAprobados":112, "maxPeriodosMatriculados":7 }\n}`}
                    className="font-mono text-xs h-32"
                    onChange={(e) => {
                      try {
                        setConfigForm(prev => ({
                          ...prev,
                          reglasNivelacionJson: JSON.parse(e.target.value)
                        }));
                      } catch (_) {}
                    }}
                  />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <Label>Electivas requeridas</Label>
                <Input type="number" onChange={(e) => setConfigForm(prev => ({ ...prev, electivasRequeridas: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Créditos totales</Label>
                <Input type="number" onChange={(e) => setConfigForm(prev => ({ ...prev, creditosTotalesPlan: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Créditos T.G.</Label>
                <Input type="number" onChange={(e) => setConfigForm(prev => ({ ...prev, creditosTrabajoGrado: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Archivo de malla (.xls / .xlsx)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <Input 
                    type="file" 
                    accept=".xlsx,.xls" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setExcelFile(e.target.files?.[0] ?? null)}
                  />
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {excelFile ? excelFile.name : "Arrastra o selecciona el archivo aquí"}
                  </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsConfigModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!selectedPlanForConfig || !excelFile) {
                  toast.error("Faltan datos o archivo");
                  return;
                }
                try {
                  setIsUploadingMalla(true);
                  await cargarMalla(
                    selectedPlanForConfig.programaId,
                    selectedPlanForConfig.id,
                    excelFile,
                    configForm
                  );
                  toast.success("Malla cargada y plan activado");
                  setIsConfigModalOpen(false);
                  setExcelFile(null);
                  
                  // Refrescar lista
                  const updated = await listarTodosLosPlanes();
                  setPlanes(updated);

                } catch (err: any) {
                  toast.error(err.message ?? "Error al subir malla");
                } finally {
                  setIsUploadingMalla(false);
                }
              }}
              disabled={isUploadingMalla}
              className="bg-[#003366] hover:bg-[#0d4f8b]"
            >
              {isUploadingMalla ? 'Procesando...' : 'Guardar y Activar Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
<<<<<<< Updated upstream
=======

      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configurar Malla Curricular</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">

      {/* INFORMACIÓN BASE */}
      <div className="grid grid-cols-2 gap-4">

        <div>
          <Label>Cantidad total de semestres *</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={cantidadSemestres ?? ""}
            onChange={(e) => setCantidadSemestres(Number(e.target.value))}
          />
        </div>

        <div>
          <Label>Electivas desde el semestre *</Label>
          <Input
            type="number"
            min={1}
            max={cantidadSemestres ?? 20}
            value={desdeSemestreElectivas ?? ""}
            onChange={(e) => setDesdeSemestreElectivas(Number(e.target.value))}
          />
        </div>

      </div>

      <Button className="mt-2" onClick={generarCamposAutomaticos}>
        Generar campos automáticos
      </Button>

      {/* ELECTIVAS POR SEMESTRE AUTO */}
      {Object.keys(electivasAuto).length > 0 && (
        <div>
          <Label>Electivas por semestre</Label>

          <div className="grid grid-cols-3 gap-4 mt-2">
            {Object.entries(electivasAuto).map(([sem, val]) => (
              <div key={sem}>
                <Label>Semestre {sem}</Label>
                <Input
                  type="number"
                  value={val}
                  onChange={(e) => {
                    const nuevo = { ...electivasAuto };
                    nuevo[sem] = Number(e.target.value);
                    setElectivasAuto(nuevo);

                    setConfigForm(prev => ({
                      ...prev,
                      electivasPorSemestreJson: nuevo
                    }));
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REGLAS DE NIVELACIÓN AUTO */}
      {Object.keys(reglasAuto).length > 0 && (
        <div>
          <Label>Reglas de nivelación</Label>

          <div className="grid grid-cols-2 gap-4 mt-2">
            {Object.entries(reglasAuto).map(([sem, regla]) => (
              <div key={sem} className="border p-3 rounded-md">
                <p className="font-bold mb-2">Semestre {sem}</p>

                <Label>Mínimo créditos aprobados</Label>
                <Input
                  type="number"
                  value={regla.minCreditosAprobados}
                  onChange={(e) => {
                    const nuevo = { ...reglasAuto };
                    nuevo[sem].minCreditosAprobados = Number(e.target.value);
                    setReglasAuto(nuevo);

                    setConfigForm(prev => ({
                      ...prev,
                      reglasNivelacionJson: nuevo
                    }));
                  }}
                />

                <Label className="mt-2">Máx. periodos matriculados</Label>
                <Input
                  type="number"
                  value={regla.maxPeriodosMatriculados}
                  onChange={(e) => {
                    const nuevo = { ...reglasAuto };
                    nuevo[sem].maxPeriodosMatriculados = Number(e.target.value);
                    setReglasAuto(nuevo);

                    setConfigForm(prev => ({
                      ...prev,
                      reglasNivelacionJson: nuevo
                    }));
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OTROS CAMPOS NUMÉRICOS */}
      <div className="grid grid-cols-3 gap-4">

        <div>
          <Label>Electivas requeridas</Label>
          <Input
            type="number"
            onChange={(e) =>
              setConfigForm(prev => ({
                ...prev,
                electivasRequeridas: Number(e.target.value)
              }))
            }
          />
        </div>

        <div>
          <Label>Créditos totales</Label>
          <Input
            type="number"
            onChange={(e) =>
              setConfigForm(prev => ({
                ...prev,
                creditosTotalesPlan: Number(e.target.value)
              }))
            }
          />
        </div>

        <div>
          <Label>Créditos Trabajo de Grado</Label>
          <Input
            type="number"
            onChange={(e) =>
              setConfigForm(prev => ({
                ...prev,
                creditosTrabajoGrado: Number(e.target.value)
              }))
            }
          />
        </div>

      </div>

      {/* ARCHIVO DE MALLA */}
      <div>
        <Label>Archivo de malla (.xls / .xlsx)</Label>
        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setExcelFile(e.target.files?.[0] ?? null)}
        />
      </div>

    </div>


        {/* BOTONES */}
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => setIsConfigModalOpen(false)}>
            Cancelar
          </Button>

          <Button
            onClick={async () => {
              if (!selectedPlanForConfig || !excelFile) {
                toast.error("Faltan datos");
                return;
              }

              try {
                await cargarMalla(
                  selectedPlanForConfig.programaId,
                  selectedPlanForConfig.id,
                  excelFile,
                  configForm
                );

                toast.success("Malla cargada y plan activado");

                setIsConfigModalOpen(false);
                setExcelFile(null);
                setConfigForm({
                  electivasPorSemestreJson: {},
                  reglasNivelacionJson: {},
                  electivasRequeridas: 0,
                  creditosTotalesPlan: 0,
                  creditosTrabajoGrado: 0,
                });

                // Refrescar planes
                const updated = await listarTodosLosPlanes();
                setPlanes(updated);

              } catch (err: any) {
                toast.error(err.message ?? "Error al subir malla");
              }
            }}
          >
            Guardar y Activar Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    
>>>>>>> Stashed changes
    </div>
  );
}