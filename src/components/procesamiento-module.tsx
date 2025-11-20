import { useState, useEffect } from 'react';
import { 
  Upload, Download, Users, AlertCircle, CheckCircle, HelpCircle, 
  FileText, Search, Filter, RefreshCw, ArrowRight, Check 
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import { cn } from './ui/utils';

// Servicios
import { 
  Periodo, 
  fetchPeriodos, 
  RespuestaFormulario, 
  fetchRespuestasFormulario,
  aplicarFiltroDuplicados,
  aplicarFiltroAntiguedad,
  confirmarListaParaSimca,
  revisarManualFormatoInvalido,
  cargarDatosSimca,
  SimcaCargaResponse,
  DatosAcademicoResponse,
  fetchDatosAcademicos,
  preseleccionarNivelados,
  calcularPorcentajeAvance,
  validarRequisitosGenerales
} from '../services/api';

export function ProcesamientoModule() {
  // Estados Globales
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<Periodo | null>(null);
  const [activeTab, setActiveTab] = useState('respuestas');
  
  // Estados Tab Respuestas
  const [respuestas, setRespuestas] = useState<RespuestaFormulario[]>([]);
  const [isLoadingRespuestas, setIsLoadingRespuestas] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  
  // Estados Tab SIMCA
  const [simcaFiles, setSimcaFiles] = useState<FileList | null>(null);
  const [isUploadingSimca, setIsUploadingSimca] = useState(false);
  const [simcaResponse, setSimcaResponse] = useState<SimcaCargaResponse | null>(null);
  
  // Estados Tab Validación
  const [datosAcademicos, setDatosAcademicos] = useState<DatosAcademicoResponse[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Estado Modal Revisión Manual
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRespuesta, setSelectedRespuesta] = useState<RespuestaFormulario | null>(null);
  const [manualCodigo, setManualCodigo] = useState('');

  useEffect(() => {
    loadPeriodos();
  }, []);

  useEffect(() => {
    if (selectedPeriodo) {
      loadRespuestas(selectedPeriodo.id);
      // Si estamos en etapas avanzadas, cargar datos académicos
      if (['PROCESO_CALCULO_AVANCE', 'PROCESO_CALCULO_APTITUD', 'EN_PROCESO_ASIGNACION', 'PROCESO_REVISION_POTENCIALES_NIVELADOS'].includes(selectedPeriodo.estado)) {
         loadDatosAcademicos(selectedPeriodo.id);
      }
    }
  }, [selectedPeriodo]);

  const loadPeriodos = () => {
    fetchPeriodos().then(data => {
        setPeriodos(data);
        if (data.length > 0 && !selectedPeriodo) {
            setSelectedPeriodo(data[0]);
        } else if (selectedPeriodo) {
            // Actualizar el objeto seleccionado con los nuevos datos del servidor
            const updated = data.find(p => p.id === selectedPeriodo.id);
            if (updated) setSelectedPeriodo(updated);
        }
    }).catch(() => toast.error("Error al cargar periodos"));
  };

  const loadRespuestas = (id: number) => {
    setIsLoadingRespuestas(true);
    fetchRespuestasFormulario(id)
      .then(setRespuestas)
      .catch(() => setRespuestas([]))
      .finally(() => setIsLoadingRespuestas(false));
  };
  
  const loadDatosAcademicos = (id: number) => {
      fetchDatosAcademicos(id)
        .then(setDatosAcademicos)
        .catch(console.error);
  };

  // --- Acciones de Filtrado ---

  const handleFiltroDuplicados = async () => {
    if (!selectedPeriodo) return;
    try {
      const res = await aplicarFiltroDuplicados(selectedPeriodo.id);
      toast.success(res.mensaje);
      loadPeriodos(); // Actualiza estado del periodo
      loadRespuestas(selectedPeriodo.id);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleFiltroAntiguedad = async () => {
    if (!selectedPeriodo) return;
    try {
      const res = await aplicarFiltroAntiguedad(selectedPeriodo.id);
      toast.success(res.mensaje);
      loadPeriodos();
      loadRespuestas(selectedPeriodo.id);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleConfirmarSimca = async () => {
    if (!selectedPeriodo) return;
    try {
      const res = await confirmarListaParaSimca(selectedPeriodo.id);
      toast.success(res.mensaje);
      loadPeriodos();
      setActiveTab('simca'); // Mover a la siguiente pestaña
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRevisionManual = async (incluir: boolean) => {
    if (!selectedRespuesta) return;
    try {
      await revisarManualFormatoInvalido(selectedRespuesta.id, incluir, manualCodigo);
      toast.success(incluir ? "Estudiante incluido manualmente" : "Estudiante descartado");
      setIsReviewModalOpen(false);
      setManualCodigo('');
      loadRespuestas(selectedPeriodo!.id);
    } catch (err: any) { toast.error(err.message); }
  };

  // --- Acciones SIMCA ---

  const handleCargarSimca = async () => {
     if (!selectedPeriodo || !simcaFiles || simcaFiles.length === 0) {
         toast.error("Seleccione al menos un archivo");
         return;
     }
     setIsUploadingSimca(true);
     try {
         const filesArray = Array.from(simcaFiles);
         const res = await cargarDatosSimca(selectedPeriodo.id, filesArray);
         setSimcaResponse(res);
         toast.success(res.mensaje);
         loadPeriodos();
     } catch (err: any) {
         toast.error(err.message);
     } finally {
         setIsUploadingSimca(false);
     }
  };

  // --- Acciones Validación Académica ---

  const handlePreseleccionarNivelados = async () => {
      if(!selectedPeriodo) return;
      setIsValidating(true);
      try {
          await preseleccionarNivelados(selectedPeriodo.id);
          toast.success("Posibles nivelados identificados");
          loadPeriodos();
          loadDatosAcademicos(selectedPeriodo.id);
      } catch(err:any) { toast.error(err.message); }
      finally { setIsValidating(false); }
  };

  const handleCalcularAvance = async () => {
      if(!selectedPeriodo) return;
      setIsValidating(true);
      try {
          const res = await calcularPorcentajeAvance(selectedPeriodo.id);
          toast.success(res.mensaje);
          loadPeriodos();
          loadDatosAcademicos(selectedPeriodo.id);
      } catch(err:any) { toast.error(err.message); }
      finally { setIsValidating(false); }
  };

  const handleValidacionFinal = async () => {
      if(!selectedPeriodo) return;
      setIsValidating(true);
      try {
          const res = await validarRequisitosGenerales(selectedPeriodo.id);
          toast.success(res.mensaje);
          loadPeriodos();
          loadDatosAcademicos(selectedPeriodo.id);
      } catch(err:any) { toast.error(err.message); }
      finally { setIsValidating(false); }
  };

  // --- UI Helpers ---

  const filteredRespuestas = respuestas.filter(r => {
      const matchesSearch = r.nombreEstudiante.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.codigoEstudiante.includes(searchTerm);
      const matchesState = filtroEstado === 'TODOS' || r.estado === filtroEstado;
      return matchesSearch && matchesState;
  });

  const getBadgeVariant = (estado: string) => {
     if(['VALIDO', 'CUMPLE', 'INCLUIDO', 'DATOS_CARGADOS', 'APTO'].includes(estado)) return 'default'; // Verde (o primary)
     if(['DUPLICADO', 'NO_CUMPLE', 'DESCARTADO', 'NO_APTO'].includes(estado)) return 'destructive'; // Rojo
     if(['FORMATO_INVALIDO', 'INCONSISTENTE_SIMCA', 'POSIBLE_NIVELADO'].includes(estado)) return 'secondary'; // Amarillo/Gris
     return 'outline';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* HEADER */}
      <div className="p-6 border-b bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#003366] text-2xl font-bold">Procesamiento de Estudiantes</h1>
            <p className="text-muted-foreground">Flujo de validación y clasificación académica</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Periodo Activo:</span>
            <Select value={selectedPeriodo?.id.toString()} onValueChange={(val) => {
                const p = periodos.find(per => per.id.toString() === val);
                setSelectedPeriodo(p || null);
            }}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Seleccionar periodo"/>
              </SelectTrigger>
              <SelectContent>
                {periodos.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                        {p.semestre} - {p.estado.replace(/_/g, ' ')}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 overflow-hidden p-6">
         <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col space-y-6">
            <TabsList className="w-fit grid grid-cols-3 bg-white border">
               <TabsTrigger value="respuestas">1. Filtrado y Validación</TabsTrigger>
               <TabsTrigger value="simca">2. Carga SIMCA</TabsTrigger>
               <TabsTrigger value="academica">3. Validación Académica</TabsTrigger>
            </TabsList>

            {/* --- PESTAÑA 1: RESPUESTAS --- */}
            <TabsContent value="respuestas" className="flex-1 overflow-hidden flex flex-col gap-4">
               <div className="flex gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex-1 flex gap-2">
                      <div className="relative max-w-md w-full">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                          <Input placeholder="Buscar estudiante..." className="pl-8" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                      </div>
                      <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                          <SelectTrigger className="w-48"><SelectValue placeholder="Estado"/></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="TODOS">Todos</SelectItem>
                              <SelectItem value="SIN_PROCESAR">Sin Procesar</SelectItem>
                              <SelectItem value="UNICO">Únicos</SelectItem>
                              <SelectItem value="DUPLICADO">Duplicados</SelectItem>
                              <SelectItem value="FORMATO_INVALIDO">Formato Inválido</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="flex gap-2">
                      <Button variant="outline" onClick={handleFiltroDuplicados} disabled={selectedPeriodo?.estado !== 'CERRADO_FORMULARIO'}>
                         <Filter className="mr-2 h-4 w-4"/> 1. Filtrar Duplicados
                      </Button>
                      <Button variant="outline" onClick={handleFiltroAntiguedad} disabled={selectedPeriodo?.estado !== 'PROCESO_FILTRADO_DUPLICADOS'}>
                         <RefreshCw className="mr-2 h-4 w-4"/> 2. Validar Antigüedad
                      </Button>
                      <Button onClick={handleConfirmarSimca} disabled={selectedPeriodo?.estado !== 'PROCESO_CLASIFICACION_ANTIGUEDAD'}>
                         <ArrowRight className="mr-2 h-4 w-4"/> 3. Confirmar para SIMCA
                      </Button>
                  </div>
               </div>

               <Card className="flex-1 overflow-hidden">
                  <CardContent className="p-0 h-full overflow-auto">
                     <Table>
                        <TableHeader className="sticky top-0 bg-white z-10">
                           <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Código</TableHead>
                              <TableHead>Estudiante</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Acciones</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {filteredRespuestas.map(r => (
                               <TableRow key={r.id}>
                                  <TableCell className="text-xs">{new Date(r.timestampRespuesta).toLocaleString()}</TableCell>
                                  <TableCell className="font-medium">{r.codigoEstudiante}</TableCell>
                                  <TableCell>
                                     <div className="flex flex-col">
                                        <span className="font-medium">{r.nombreEstudiante} {r.apellidosEstudiante}</span>
                                        <span className="text-xs text-muted-foreground">{r.programaNombre}</span>
                                     </div>
                                  </TableCell>
                                  <TableCell><Badge variant={getBadgeVariant(r.estado)}>{r.estado}</Badge></TableCell>
                                  <TableCell>
                                     {r.estado === 'FORMATO_INVALIDO' && (
                                         <Button size="sm" variant="secondary" onClick={() => {
                                             setSelectedRespuesta(r);
                                             setManualCodigo(r.codigoEstudiante);
                                             setIsReviewModalOpen(true);
                                         }}>Revisar</Button>
                                     )}
                                  </TableCell>
                               </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  </CardContent>
               </Card>
            </TabsContent>

            {/* --- PESTAÑA 2: SIMCA --- */}
            <TabsContent value="simca" className="space-y-6 overflow-y-auto">
                <Card>
                   <CardHeader><CardTitle>Carga de Datos SIMCA</CardTitle></CardHeader>
                   <CardContent>
                      <Alert className="mb-4">
                         <AlertDescription>
                            Sube los archivos .CSV exportados de SIMCA correspondientes a los lotes generados.
                            El sistema cruzará la información para validar la inscripción de los estudiantes.
                         </AlertDescription>
                      </Alert>
                      <div className="flex gap-4 items-end">
                          <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="simca_files">Archivos CSV</Label>
                            <Input id="simca_files" type="file" multiple accept=".csv,.xlsx" onChange={e => setSimcaFiles(e.target.files)} />
                          </div>
                          <Button onClick={handleCargarSimca} disabled={isUploadingSimca}>
                             {isUploadingSimca ? "Cargando..." : "Cargar y Validar"} <Upload className="ml-2 h-4 w-4"/>
                          </Button>
                      </div>
                   </CardContent>
                </Card>

                {simcaResponse && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <Card>
                          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Procesados</CardTitle></CardHeader>
                          <CardContent><div className="text-2xl font-bold">{simcaResponse.archivosProcesados} Archivos</div></CardContent>
                       </Card>
                       <Card>
                          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-600">Exitosos</CardTitle></CardHeader>
                          <CardContent><div className="text-2xl font-bold text-green-600">{simcaResponse.registrosCargadosExitosamente}</div></CardContent>
                       </Card>
                       <Card>
                          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-600">Inconsistencias</CardTitle></CardHeader>
                          <CardContent><div className="text-2xl font-bold text-red-600">{simcaResponse.inconsistenciasEncontradas}</div></CardContent>
                       </Card>
                    </div>
                )}
            </TabsContent>

            {/* --- PESTAÑA 3: VALIDACIÓN ACADÉMICA --- */}
            <TabsContent value="academica" className="flex-1 overflow-hidden flex flex-col gap-4">
                 <div className="flex gap-4 bg-white p-4 rounded-lg border shadow-sm flex-wrap">
                     <Button variant="outline" onClick={handlePreseleccionarNivelados} disabled={isValidating || selectedPeriodo?.estado !== 'PROCESO_CARGA_SIMCA'}>
                        <HelpCircle className="mr-2 h-4 w-4"/> 1. Identificar Nivelados
                     </Button>
                     <Button variant="outline" onClick={handleCalcularAvance} disabled={isValidating || selectedPeriodo?.estado !== 'PROCESO_REVISION_POTENCIALES_NIVELADOS'}>
                        <CheckCircle className="mr-2 h-4 w-4"/> 2. Calcular Avance
                     </Button>
                     <Button onClick={handleValidacionFinal} disabled={isValidating || selectedPeriodo?.estado !== 'PROCESO_CALCULO_APTITUD'}>
                        <Check className="mr-2 h-4 w-4"/> 3. Validación Final (Apto/No Apto)
                     </Button>
                 </div>

                 <Card className="flex-1 overflow-hidden">
                    <CardHeader><CardTitle>Resultados Académicos ({datosAcademicos.length})</CardTitle></CardHeader>
                    <CardContent className="p-0 h-full overflow-auto">
                        <Table>
                           <TableHeader className="sticky top-0 bg-white z-10">
                              <TableRow>
                                 <TableHead>Código</TableHead>
                                 <TableHead>Estudiante</TableHead>
                                 <TableHead>Créditos</TableHead>
                                 <TableHead>Semestres</TableHead>
                                 <TableHead>Avance %</TableHead>
                                 <TableHead>Estado Aptitud</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {datosAcademicos.map(d => (
                                 <TableRow key={d.id}>
                                    <TableCell>{d.codigoEstudiante}</TableCell>
                                    <TableCell>
                                       <div className="flex flex-col">
                                          <span className="font-medium">{d.nombres} {d.apellidos}</span>
                                          <span className="text-xs text-muted-foreground">{d.programa}</span>
                                       </div>
                                    </TableCell>
                                    <TableCell>{d.creditosAprobados}</TableCell>
                                    <TableCell>{d.periodosMatriculados}</TableCell>
                                    <TableCell>
                                       <div className="flex items-center gap-2">
                                          <div className="h-2 w-16 bg-gray-100 rounded-full overflow-hidden">
                                             <div className="h-full bg-blue-600" style={{width: `${d.porcentajeAvance}%`}}></div>
                                          </div>
                                          <span className="text-xs">{d.porcentajeAvance}%</span>
                                       </div>
                                    </TableCell>
                                    <TableCell><Badge variant={getBadgeVariant(d.estadoAptitud)}>{d.estadoAptitud}</Badge></TableCell>
                                 </TableRow>
                              ))}
                           </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
            </TabsContent>
         </Tabs>
      </div>

      {/* MODAL DE REVISIÓN MANUAL */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
         <DialogContent>
            <DialogHeader><DialogTitle>Revisión Manual de Estudiante</DialogTitle></DialogHeader>
            <div className="space-y-4">
               <Alert>
                  <AlertDescription>
                     El código <b>{selectedRespuesta?.codigoEstudiante}</b> tiene un formato desconocido. 
                     Puede corregirlo manualmente o descartar la respuesta.
                  </AlertDescription>
               </Alert>
               <div>
                  <Label>Código Corregido (para SIMCA)</Label>
                  <Input value={manualCodigo} onChange={e => setManualCodigo(e.target.value)} />
               </div>
               <div className="flex justify-end gap-2">
                  <Button variant="destructive" onClick={() => handleRevisionManual(false)}>Descartar</Button>
                  <Button onClick={() => handleRevisionManual(true)}>Incluir y Corregir</Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}