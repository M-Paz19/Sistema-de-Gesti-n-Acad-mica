import { useState, useEffect } from 'react';
import { 
  Upload, Download, AlertCircle, CheckCircle, HelpCircle, 
  FileText, Search, Filter, RefreshCw, ArrowRight, Check, Edit, XCircle, CheckSquare
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
import { toast } from 'sonner';
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
  validarRequisitosGenerales,
  descargarLotesSimca 
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

  // Cargar periodos al inicio
  useEffect(() => {
    loadPeriodos();
  }, []);

  // Cargar datos cuando cambia el periodo seleccionado
  useEffect(() => {
    if (selectedPeriodo) {
      console.log("🔄 Periodo cambiado:", selectedPeriodo.id);
      loadRespuestas(selectedPeriodo.id);
      
      // Estados donde ya debería haber datos académicos cargados
      const estadosAvanzados = [
        'PROCESO_CALCULO_AVANCE', 
        'PROCESO_CALCULO_APTITUD', 
        'EN_PROCESO_ASIGNACION', 
        'PROCESO_REVISION_POTENCIALES_NIVELADOS',
        'PROCESO_CARGA_SIMCA',
        'PROCESO_CONFIRMACION_SIMCA' 
      ];
      
      if (estadosAvanzados.includes(selectedPeriodo.estado)) {
         loadDatosAcademicos(selectedPeriodo.id);
      }
    }
  }, [selectedPeriodo]);

  const loadPeriodos = () => {
    fetchPeriodos().then(data => {
        setPeriodos(data);
        if (data.length > 0 && !selectedPeriodo) {
            const active = data.find(p => p.estado !== 'CONFIGURACION') || data[0];
            setSelectedPeriodo(active);
        } else if (selectedPeriodo) {
            const updated = data.find(p => p.id === selectedPeriodo.id);
            if (updated) setSelectedPeriodo(updated);
        }
    }).catch(() => toast.error("Error al cargar periodos"));
  };

  const loadRespuestas = (id: number) => {
    setIsLoadingRespuestas(true);
    setRespuestas([]); // Limpiar para evitar flash

    fetchRespuestasFormulario(id)
      .then(data => {
        if (Array.isArray(data)) {
            // Filtrar duplicados visuales por ID
            const unique = Array.from(new Map(data.map(item => [item.id, item])).values());
            setRespuestas(unique);
        } else {
            setRespuestas([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setRespuestas([]);
      })
      .finally(() => setIsLoadingRespuestas(false));
  };
  
  const loadDatosAcademicos = (id: number) => {
      fetchDatosAcademicos(id)
        .then(setDatosAcademicos)
        .catch(console.error);
  };

  // --- Acciones ---

  const handleFiltroDuplicados = async () => {
    if (!selectedPeriodo) return;
    try {
      const res = await aplicarFiltroDuplicados(selectedPeriodo.id);
      toast.success(res.mensaje);
      loadPeriodos(); loadRespuestas(selectedPeriodo.id);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleFiltroAntiguedad = async () => {
    if (!selectedPeriodo) return;
    try {
      const res = await aplicarFiltroAntiguedad(selectedPeriodo.id);
      toast.success(res.mensaje);
      loadPeriodos(); loadRespuestas(selectedPeriodo.id);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleConfirmarSimca = async () => {
    if (!selectedPeriodo) return;
    const pendientes = respuestas.filter(r => r.estado === 'FORMATO_INVALIDO');
    if (pendientes.length > 0) {
        toast.error(`Revise ${pendientes.length} respuestas inválidas antes de confirmar.`);
        setFiltroEstado('FORMATO_INVALIDO');
        return;
    }
    try {
      const res = await confirmarListaParaSimca(selectedPeriodo.id);
      toast.success(res.mensaje);
      loadPeriodos(); setActiveTab('simca');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRevisionManual = async (incluir: boolean) => {
    if (!selectedRespuesta || !selectedPeriodo) return;
    if (incluir && (!manualCodigo || manualCodigo.trim() === '')) {
        toast.error("Debe proporcionar un código válido.");
        return;
    }
    try {
      await revisarManualFormatoInvalido(selectedRespuesta.id, incluir, manualCodigo);
      toast.success(incluir ? "Incluido" : "Descartado");
      setIsReviewModalOpen(false);
      setManualCodigo('');
      setSelectedRespuesta(null);
      await loadRespuestas(selectedPeriodo.id); // Recarga crítica
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDescargarLotes = async () => {
    if (!selectedPeriodo) return;
    try {
      const blob = await descargarLotesSimca(selectedPeriodo.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lotes_SIMCA_${selectedPeriodo.semestre}.zip`; 
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Descarga iniciada");
    } catch (err: any) {
      toast.error("Error al descargar lotes: " + err.message);
    }
  };

  const handleCargarSimca = async () => {
     if (!selectedPeriodo || !simcaFiles || simcaFiles.length === 0) return toast.error("Seleccione archivo");
     setIsUploadingSimca(true);
     try {
         const filesArray = Array.from(simcaFiles);
         const res = await cargarDatosSimca(selectedPeriodo.id, filesArray);
         setSimcaResponse(res);
         toast.success(res.mensaje);
         loadPeriodos();
         if(res.registrosCargadosExitosamente > 0) loadDatosAcademicos(selectedPeriodo.id);
     } catch (err: any) { toast.error(err.message); } 
     finally { setIsUploadingSimca(false); }
  };

  const handlePreseleccionarNivelados = async () => {
      if(!selectedPeriodo) return;
      setIsValidating(true);
      try {
          await preseleccionarNivelados(selectedPeriodo.id);
          toast.success("Nivelados identificados");
          loadPeriodos(); loadDatosAcademicos(selectedPeriodo.id);
      } catch(err:any) { toast.error(err.message); }
      finally { setIsValidating(false); }
  };
  const handleCalcularAvance = async () => {
      if(!selectedPeriodo) return;
      setIsValidating(true);
      try {
          const res = await calcularPorcentajeAvance(selectedPeriodo.id);
          toast.success(res.mensaje);
          loadPeriodos(); loadDatosAcademicos(selectedPeriodo.id);
      } catch(err:any) { toast.error(err.message); }
      finally { setIsValidating(false); }
  };
  const handleValidacionFinal = async () => {
      if(!selectedPeriodo) return;
      setIsValidating(true);
      try {
          const res = await validarRequisitosGenerales(selectedPeriodo.id);
          toast.success(res.mensaje);
          loadPeriodos(); loadDatosAcademicos(selectedPeriodo.id);
      } catch(err:any) { toast.error(err.message); }
      finally { setIsValidating(false); }
  };

  // --- UI Helpers ---

  const filteredRespuestas = respuestas.filter(r => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (r.nombreEstudiante?.toLowerCase() || '').includes(searchLower) ||
        (r.codigoEstudiante?.includes(searchTerm));
      const matchesState = filtroEstado === 'TODOS' || r.estado === filtroEstado;
      return matchesSearch && matchesState;
  });

  const getBadgeVariant = (estado: string) => {
     if(['VALIDO', 'CUMPLE', 'INCLUIDO'].includes(estado)) return 'default'; 
     if(['DUPLICADO', 'NO_CUMPLE', 'DESCARTADO'].includes(estado)) return 'destructive'; 
     if(['FORMATO_INVALIDO'].includes(estado)) return 'secondary'; 
     return 'outline';
  };

  const formatEstado = (estado: string) => {
      return estado.replace(/_/g, ' ');
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
            <Select 
              value={selectedPeriodo ? selectedPeriodo.id.toString() : ""} 
              onValueChange={(val) => {
                const p = periodos.find(per => per.id.toString() === val);
                setSelectedPeriodo(p || null);
              }}
            >
              <SelectTrigger className="w-64 bg-white">
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
            <TabsList className="w-fit grid grid-cols-3 bg-white border shadow-sm">
               <TabsTrigger value="respuestas" className="data-[state=active]:bg-[#FDB913] data-[state=active]:text-[#003366]">1. Filtrado y Validación</TabsTrigger>
               <TabsTrigger value="simca" className="data-[state=active]:bg-[#FDB913] data-[state=active]:text-[#003366]">2. Carga SIMCA</TabsTrigger>
               <TabsTrigger value="academica" className="data-[state=active]:bg-[#FDB913] data-[state=active]:text-[#003366]">3. Validación Académica</TabsTrigger>
            </TabsList>

            {/* --- PESTAÑA 1: RESPUESTAS --- */}
            <TabsContent value="respuestas" className="flex-1 overflow-hidden flex flex-col gap-4">
               <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex-1 flex gap-2 w-full md:w-auto">
                      <div className="relative max-w-md w-full">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                          <Input placeholder="Buscar..." className="pl-8" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                      </div>
                      <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                          <SelectTrigger className="w-48"><SelectValue placeholder="Estado"/></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="TODOS">Todos</SelectItem>
                              <SelectItem value="SIN_PROCESAR">Sin Procesar</SelectItem>
                              <SelectItem value="UNICO">Únicos</SelectItem>
                              <SelectItem value="DUPLICADO">Duplicados</SelectItem>
                              <SelectItem value="FORMATO_INVALIDO">Formato Inválido</SelectItem>
                              <SelectItem value="CUMPLE">Cumple</SelectItem>
                              <SelectItem value="NO_CUMPLE">No Cumple</SelectItem>
                              <SelectItem value="INCLUIDO">Incluido Manual</SelectItem>
                              <SelectItem value="DESCARTADO">Descartado</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" onClick={handleFiltroDuplicados} disabled={selectedPeriodo?.estado !== 'CERRADO_FORMULARIO'}>
                         <Filter className="mr-2 h-4 w-4"/> Filtrar Duplicados
                      </Button>
                      <Button variant="outline" onClick={handleFiltroAntiguedad} disabled={selectedPeriodo?.estado !== 'PROCESO_FILTRADO_DUPLICADOS'}>
                         <RefreshCw className="mr-2 h-4 w-4"/> Validar Antigüedad
                      </Button>
                      <Button onClick={handleConfirmarSimca} disabled={selectedPeriodo?.estado !== 'PROCESO_CLASIFICACION_ANTIGUEDAD'}>
                         <ArrowRight className="mr-2 h-4 w-4"/> Confirmar
                      </Button>
                  </div>
               </div>

               <Card className="flex-1 overflow-hidden border shadow-sm">
                  <CardContent className="p-0 h-full overflow-auto">
                     <Table>
                        <TableHeader className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                           <TableRow>
                              <TableHead>Código</TableHead>
                              <TableHead>Estudiante</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Acciones</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {filteredRespuestas.length === 0 ? (
                               <TableRow>
                                   <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                       No se encontraron respuestas que coincidan con los filtros.
                                   </TableCell>
                               </TableRow>
                           ) : (
                               filteredRespuestas.map(r => (
                                   <TableRow key={r.id} className="hover:bg-gray-50">
                                      <TableCell className="font-mono">{r.codigoEstudiante}</TableCell>
                                      <TableCell>
                                          <div className="flex flex-col">
                                              <span>{r.nombreEstudiante} {r.apellidosEstudiante}</span>
                                              <span className="text-xs text-muted-foreground">{r.programaNombre}</span>
                                          </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={getBadgeVariant(r.estado)}>
                                            {formatEstado(r.estado)}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                         {/* RESTRICCIÓN: Botón de edición solo para FORMATO_INVALIDO o INCLUIDO */}
                                         {(r.estado === 'FORMATO_INVALIDO' || r.estado === 'INCLUIDO') && (
                                             <Button size="sm" variant="ghost" onClick={() => {
                                                 setSelectedRespuesta(r);
                                                 setManualCodigo(r.codigoEstudiante);
                                                 setIsReviewModalOpen(true);
                                             }}>
                                                <Edit className="h-4 w-4 text-blue-600"/>
                                             </Button>
                                         )}
                                      </TableCell>
                                   </TableRow>
                               ))
                           )}
                        </TableBody>
                     </Table>
                  </CardContent>
               </Card>
            </TabsContent>

            {/* --- PESTAÑA 2: SIMCA (ACTUALIZADA) --- */}
            <TabsContent value="simca" className="space-y-6 overflow-y-auto h-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Panel Izquierdo: Gestión de Archivos */}
                    <Card className="lg:col-span-1 h-fit">
                       <CardHeader><CardTitle>Gestión de Archivos</CardTitle></CardHeader>
                       <CardContent className="space-y-6">
                          <div className="p-4 border rounded-lg bg-blue-50 border-blue-100">
                              <h3 className="font-semibold text-blue-800 mb-2">1. Descargar Lotes</h3>
                              <p className="text-sm text-blue-600 mb-4">Descarga los archivos ZIP para enviar a SIMCA.</p>
                              <Button 
                                onClick={handleDescargarLotes} 
                                variant="outline" 
                                className="w-full border-blue-200 text-blue-700 hover:bg-blue-100"
                                disabled={selectedPeriodo?.estado === 'CERRADO_FORMULARIO' || selectedPeriodo?.estado === 'PROCESO_FILTRADO_DUPLICADOS'}
                              >
                                 <Download className="mr-2 h-4 w-4"/> Descargar ZIP
                              </Button>
                          </div>
                          
                          <div className="flex flex-col items-center justify-center">
                              <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 my-2 lg:rotate-0 lg:my-0" />
                          </div>

                          <div className="p-4 border-2 border-dashed rounded-lg bg-gray-50 text-center">
                             <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                             <p className="text-sm text-muted-foreground mb-4">2. Subir respuesta de SIMCA (.csv / .xlsx)</p>
                             <Input id="simca_files" type="file" multiple accept=".csv,.xlsx,.xls" onChange={e => setSimcaFiles(e.target.files)} className="cursor-pointer"/>
                          </div>
                          <Button onClick={handleCargarSimca} disabled={isUploadingSimca} className="w-full bg-[#003366]">
                             {isUploadingSimca ? "Procesando..." : "Cargar y Validar"}
                          </Button>
                       </CardContent>
                    </Card>
                    
                    {/* Panel Derecho: Resultados de Carga */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Resultados de Carga</CardTitle></CardHeader>
                            <CardContent>
                                {simcaResponse ? (
                                    <div className="space-y-6">
                                        {/* Tarjetas de Resumen */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-center">
                                                <p className="text-xs font-bold text-green-700 mb-1 uppercase">EXITOSOS</p>
                                                <p className="text-3xl font-bold text-green-900">{simcaResponse.registrosCargadosExitosamente}</p>
                                            </div>
                                            <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-center">
                                                <p className="text-xs font-bold text-red-700 mb-1 uppercase">INCONSISTENCIAS</p>
                                                <p className="text-3xl font-bold text-red-900">{simcaResponse.inconsistenciasEncontradas}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Lista de Inconsistencias */}
                                            <div>
                                                <h4 className="font-bold text-sm mb-3 flex items-center text-red-800">
                                                    <XCircle className="w-4 h-4 mr-2"/> Inconsistencias
                                                </h4>
                                                <div className="border rounded-md max-h-[400px] overflow-auto bg-white">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="w-[100px]">Código</TableHead>
                                                                <TableHead>Estudiante</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {simcaResponse.detalleInconsistencias.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={2} className="text-center text-muted-foreground text-xs py-4">Sin inconsistencias</TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                simcaResponse.detalleInconsistencias.map((inc, idx) => (
                                                                    <TableRow key={idx}>
                                                                        <TableCell className="font-mono text-xs font-medium">{inc.codigoEstudianteCsv}</TableCell>
                                                                        <TableCell className="text-xs">
                                                                            <div className="font-medium">{inc.nombreEstudianteCsv}</div>
                                                                            <div className="text-red-600 mt-1">{inc.error}</div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>

                                            {/* Lista de Exitosos */}
                                            <div>
                                                <h4 className="font-bold text-sm mb-3 flex items-center text-green-800">
                                                    <CheckSquare className="w-4 h-4 mr-2"/> Registros Exitosos
                                                </h4>
                                                <div className="border rounded-md max-h-[400px] overflow-auto bg-white">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="w-[100px]">Código</TableHead>
                                                                <TableHead>Estudiante</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {datosAcademicos.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={2} className="text-center text-muted-foreground text-xs py-4">No hay registros cargados aún</TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                datosAcademicos.map((d) => (
                                                                    <TableRow key={d.id}>
                                                                        <TableCell className="font-mono text-xs font-medium">{d.codigoEstudiante}</TableCell>
                                                                        <TableCell className="text-xs">
                                                                            <div className="font-medium">{d.nombres} {d.apellidos}</div>
                                                                            <div className="text-muted-foreground">{d.programa}</div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                                        <FileText className="h-10 w-10 mb-3 opacity-20"/>
                                        <p className="text-sm">Cargue un archivo para ver el reporte detallado.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>

            {/* --- PESTAÑA 3: ACADEMICA --- */}
            <TabsContent value="academica" className="flex-1 overflow-hidden flex flex-col gap-4">
                 <div className="flex gap-4 bg-white p-4 rounded-lg border shadow-sm flex-wrap items-center">
                     <Button variant="outline" onClick={handlePreseleccionarNivelados} disabled={isValidating || selectedPeriodo?.estado !== 'PROCESO_CARGA_SIMCA'}>
                        <HelpCircle className="mr-2 h-4 w-4"/> 1. Identificar Nivelados
                     </Button>
                     <Button variant="outline" onClick={handleCalcularAvance} disabled={isValidating || selectedPeriodo?.estado !== 'PROCESO_REVISION_POTENCIALES_NIVELADOS'}>
                        <CheckCircle className="mr-2 h-4 w-4"/> 2. Calcular Avance
                     </Button>
                     <Button onClick={handleValidacionFinal} disabled={isValidating || selectedPeriodo?.estado !== 'PROCESO_CALCULO_APTITUD'}>
                        <Check className="mr-2 h-4 w-4"/> 3. Validación Final
                     </Button>
                 </div>
                 <Card className="flex-1 overflow-hidden border shadow-sm">
                    <CardContent className="p-0 h-full overflow-auto">
                        <Table>
                           <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                              <TableRow>
                                 <TableHead>Código</TableHead>
                                 <TableHead>Estudiante</TableHead>
                                 <TableHead className="text-center">Créditos</TableHead>
                                 <TableHead className="text-center">Semestres</TableHead>
                                 <TableHead className="w-[200px]">Avance %</TableHead>
                                 <TableHead>Estado Aptitud</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {datosAcademicos.map(d => (
                                 <TableRow key={d.id}>
                                    <TableCell>{d.codigoEstudiante}</TableCell>
                                    <TableCell>{d.nombres} {d.apellidos}</TableCell>
                                    <TableCell className="text-center">{d.creditosAprobados}</TableCell>
                                    <TableCell className="text-center">{d.periodosMatriculados}</TableCell>
                                    <TableCell>{d.porcentajeAvance}%</TableCell>
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
            <DialogHeader><DialogTitle>Editar / Revisar Estudiante</DialogTitle></DialogHeader>
            <div className="space-y-4">
               <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800">
                  <AlertCircle className="h-4 w-4"/>
                  <AlertDescription>
                     Estado actual: <b>{formatEstado(selectedRespuesta?.estado || '')}</b>. 
                     Puedes corregir el código o forzar su inclusión/exclusión.
                  </AlertDescription>
               </Alert>
               
               <div className="space-y-2">
                  <Label htmlFor="manual-codigo">Código Estudiante</Label>
                  <Input 
                    id="manual-codigo"
                    value={manualCodigo} 
                    onChange={e => setManualCodigo(e.target.value)} 
                    className="font-mono"
                  />
               </div>

               <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleRevisionManual(false)}>
                      Descartar
                  </Button>
                  <Button className="bg-[#003366]" onClick={() => handleRevisionManual(true)}>
                      Guardar Cambios e Incluir
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}