import { useState, useEffect } from 'react';
import { 
  Upload, Download, AlertCircle, CheckCircle, HelpCircle, 
  FileText, Search, Filter, RefreshCw, ArrowRight, Check, Edit, XCircle, CheckSquare, FileUp
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
  descargarLotesSimca,
  generarReporteNivelado,
  registrarDecisionFinal,
  VerificacionNiveladoDTO
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
  
  // Estados Tab Validación (Nivelación)
  const [datosAcademicos, setDatosAcademicos] = useState<DatosAcademicoResponse[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  
  // Estado Modal Revisión Manual (Códigos)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRespuesta, setSelectedRespuesta] = useState<RespuestaFormulario | null>(null);
  const [manualCodigo, setManualCodigo] = useState('');

  // Estado Modal Verificación Nivelado
  const [isNiveladoModalOpen, setIsNiveladoModalOpen] = useState(false);
  const [selectedDatoAcademico, setSelectedDatoAcademico] = useState<DatosAcademicoResponse | null>(null);
  const [historiaFile, setHistoriaFile] = useState<File | null>(null);
  const [reporteNivelacion, setReporteNivelacion] = useState<VerificacionNiveladoDTO | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

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
    setRespuestas([]);

    fetchRespuestasFormulario(id)
      .then(data => {
        if (Array.isArray(data)) {
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

  // --- Acciones Pestaña 1 ---
  // ... (se mantienen igual)
  const handleFiltroDuplicados = async () => {
    if (!selectedPeriodo) return;
    try {
      const res = await aplicarFiltroDuplicados(selectedPeriodo.id);
      toast.success(res.mensaje);
      loadPeriodos(); 
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
    const pendientes = respuestas.filter(r => r.estado === 'FORMATO_INVALIDO');
    if (pendientes.length > 0) {
        toast.error(`Revise ${pendientes.length} respuestas inválidas antes de confirmar.`);
        setFiltroEstado('FORMATO_INVALIDO');
        return;
    }
    try {
      const res = await confirmarListaParaSimca(selectedPeriodo.id);
      toast.success(res.mensaje);
      loadPeriodos(); 
      setActiveTab('simca');
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
      toast.success(incluir ? "Actualizado e incluido" : "Descartado");
      setIsReviewModalOpen(false);
      setManualCodigo('');
      setSelectedRespuesta(null);
      await loadRespuestas(selectedPeriodo.id);
    } catch (err: any) { 
        toast.error(err.message || "Error al actualizar."); 
    }
  };

  // --- Acciones Pestaña 2 ---

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

  // --- Acciones Pestaña 3 (NIVELACIÓN) ---

  const handlePreseleccionarNivelados = async () => {
      if(!selectedPeriodo) return;
      setIsValidating(true);
      try {
          await preseleccionarNivelados(selectedPeriodo.id);
          toast.success("Nivelados identificados");
          loadPeriodos(); 
          loadDatosAcademicos(selectedPeriodo.id);
      } catch(err:any) { toast.error(err.message); }
      finally { setIsValidating(false); }
  };

  const handleVerificarNivelado = (dato: DatosAcademicoResponse) => {
    setSelectedDatoAcademico(dato);
    setHistoriaFile(null);
    setReporteNivelacion(null);
    setIsNiveladoModalOpen(true);
  };

  const handleGenerarReporte = async () => {
    if (!selectedDatoAcademico || !historiaFile) {
      toast.error("Seleccione un archivo de historia académica");
      return;
    }
    setIsGeneratingReport(true);
    try {
      const reporte = await generarReporteNivelado(selectedDatoAcademico.id, historiaFile);
      setReporteNivelacion(reporte);
      toast.success("Reporte generado");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDecisionNivelado = async (nivelado: boolean) => {
    if (!selectedDatoAcademico) return;
    try {
      await registrarDecisionFinal(selectedDatoAcademico.id, nivelado);
      toast.success(nivelado ? "Estudiante marcado como NIVELADO" : "Estudiante NO es nivelado");
      setIsNiveladoModalOpen(false);
      loadDatosAcademicos(selectedPeriodo!.id);
    } catch (err: any) {
      toast.error(err.message);
    }
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
     if(['VALIDO', 'CUMPLE', 'INCLUIDO', 'DATOS_CARGADOS', 'APTO', 'NIVELADO_CONFIRMADO'].includes(estado)) return 'default'; 
     if(['DUPLICADO', 'NO_CUMPLE', 'DESCARTADO', 'NO_APTO', 'INCONSISTENTE_SIMCA', 'NIVELADO_DESCARTADO'].includes(estado)) return 'destructive'; 
     if(['POSIBLE_NIVELADO', 'PENDIENTE_VALIDACION'].includes(estado)) return 'secondary'; // Amarillo/Gris para estados de atención
     return 'outline';
  };
  
  // Helper para color personalizado del badge amarillo en caso de que secondary no sea suficiente
  const getCustomBadgeStyle = (estado: string) => {
      if (estado === 'POSIBLE_NIVELADO' || estado === 'PENDIENTE_VALIDACION') {
          return "bg-[#FDB913] text-[#003366] hover:bg-[#e5a812] border-transparent";
      }
      return "";
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

      <div className="flex-1 overflow-hidden p-6">
         <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col space-y-6">
            <TabsList className="w-fit grid grid-cols-3 bg-white border shadow-sm">
               <TabsTrigger value="respuestas" className="data-[state=active]:bg-[#FDB913] data-[state=active]:text-[#003366]">1. Filtrado y Validación</TabsTrigger>
               <TabsTrigger value="simca" className="data-[state=active]:bg-[#FDB913] data-[state=active]:text-[#003366]">2. Carga SIMCA</TabsTrigger>
               <TabsTrigger value="academica" className="data-[state=active]:bg-[#FDB913] data-[state=active]:text-[#003366]">3. Validación Académica</TabsTrigger>
            </TabsList>

            {/* Pestaña 1 y 2 se omiten por brevedad, se mantienen igual */}
            <TabsContent value="respuestas" className="flex-1 overflow-hidden flex flex-col gap-4">
                {/* ... Contenido Pestaña 1 ... */}
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
                              <SelectItem value="FORMATO_INVALIDO">Formato Inválido</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" onClick={handleFiltroDuplicados} disabled={selectedPeriodo?.estado !== 'CERRADO_FORMULARIO'}>Filtrar Duplicados</Button>
                      <Button variant="outline" onClick={handleFiltroAntiguedad} disabled={selectedPeriodo?.estado !== 'PROCESO_FILTRADO_DUPLICADOS'}>Validar Antigüedad</Button>
                      <Button onClick={handleConfirmarSimca} disabled={selectedPeriodo?.estado !== 'PROCESO_CLASIFICACION_ANTIGUEDAD'}>Confirmar</Button>
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
                           {filteredRespuestas.map(r => (
                               <TableRow key={r.id} className="hover:bg-gray-50">
                                  <TableCell className="font-mono">{r.codigoEstudiante}</TableCell>
                                  <TableCell>{r.nombreEstudiante} {r.apellidosEstudiante}</TableCell>
                                  <TableCell><Badge variant={getBadgeVariant(r.estado)}>{r.estado}</Badge></TableCell>
                                  <TableCell>
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
                           ))}
                        </TableBody>
                     </Table>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="simca" className="space-y-6 overflow-y-auto h-full">
                {/* ... Contenido Pestaña 2 (igual) ... */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 h-fit bg-white shadow-sm">
                       <CardHeader className="pb-2"><CardTitle className="text-lg font-bold text-[#003366]">Gestión de Archivos</CardTitle></CardHeader>
                       <CardContent className="space-y-6 pt-4">
                          <div className="p-4 border rounded-lg bg-blue-50 border-blue-100 space-y-3">
                              <div className="flex items-center gap-2 text-blue-800 font-semibold">
                                  <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
                                  Descargar Lotes
                              </div>
                              <p className="text-sm text-blue-600">Descarga los archivos ZIP con los códigos validados para enviar a SIMCA.</p>
                              <Button 
                                onClick={handleDescargarLotes} 
                                variant="outline" 
                                className="w-full border-blue-200 text-blue-700 hover:bg-blue-100 bg-white"
                                disabled={selectedPeriodo?.estado === 'CERRADO_FORMULARIO' || selectedPeriodo?.estado === 'PROCESO_FILTRADO_DUPLICADOS'}
                              >
                                 <Download className="mr-2 h-4 w-4"/> Descargar ZIP
                              </Button>
                          </div>
                          <div className="p-4 border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative bg-white">
                                <Input id="simca_files" type="file" multiple accept=".csv,.xlsx,.xls" onChange={e => setSimcaFiles(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                                <div className="flex flex-col items-center gap-2 pointer-events-none">
                                    <FileUp className="h-8 w-8 text-muted-foreground/60" />
                                    <p className="text-sm text-muted-foreground">{simcaFiles ? `${simcaFiles.length} archivos` : "Arrastrar archivos aquí"}</p>
                                </div>
                          </div>
                          <Button onClick={handleCargarSimca} disabled={isUploadingSimca} className="w-full bg-[#003366] hover:bg-[#002244]">
                                {isUploadingSimca ? "Procesando..." : "Cargar y Validar"}
                             </Button>
                       </CardContent>
                    </Card>
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-none bg-transparent">
                            <CardHeader className="px-0 pt-0"><CardTitle className="text-xl text-[#003366]">Resultados de Carga</CardTitle></CardHeader>
                            <CardContent className="px-0">
                                {simcaResponse ? (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Card className="bg-green-50/50 border-green-200 shadow-sm">
                                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                                    <div className="bg-green-100 p-2 rounded-full mb-2"><CheckCircle className="h-6 w-6 text-green-600" /></div>
                                                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Exitosos</p>
                                                    <p className="text-3xl font-bold text-green-900">{simcaResponse.registrosCargadosExitosamente}</p>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-red-50/50 border-red-200 shadow-sm">
                                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                                    <div className="bg-red-100 p-2 rounded-full mb-2"><AlertCircle className="h-6 w-6 text-red-600" /></div>
                                                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Inconsistencias</p>
                                                    <p className="text-3xl font-bold text-red-900">{simcaResponse.inconsistenciasEncontradas}</p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                        {simcaResponse.detalleInconsistencias.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="font-bold text-sm flex items-center text-red-800"><XCircle className="w-4 h-4 mr-2 fill-red-100 text-red-600"/> Detalle de Inconsistencias</h4>
                                                <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                                                    <Table>
                                                        <TableHeader className="bg-red-50/30">
                                                            <TableRow>
                                                                <TableHead className="w-[120px]">Código</TableHead>
                                                                <TableHead>Estudiante</TableHead>
                                                                <TableHead>Error Detectado</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {simcaResponse.detalleInconsistencias.map((inc, idx) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell className="font-mono text-xs font-medium">{inc.codigoEstudianteCsv}</TableCell>
                                                                    <TableCell className="text-xs text-muted-foreground">{inc.nombreEstudianteCsv}</TableCell>
                                                                    <TableCell className="text-xs text-red-600 font-medium">{inc.error}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        )}
                                        {datosAcademicos.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="font-bold text-sm flex items-center text-green-800"><CheckSquare className="w-4 h-4 mr-2 fill-green-100 text-green-600"/> Estudiantes Cargados ({datosAcademicos.length})</h4>
                                                <div className="border rounded-lg overflow-hidden bg-white shadow-sm max-h-[400px] overflow-y-auto">
                                                    <Table>
                                                        <TableHeader className="bg-green-50/30 sticky top-0 z-10">
                                                            <TableRow>
                                                                <TableHead className="w-[120px]">Código</TableHead>
                                                                <TableHead>Estudiante</TableHead>
                                                                <TableHead>Programa</TableHead>
                                                                <TableHead className="text-center">Créditos</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {datosAcademicos.map((d) => (
                                                                <TableRow key={d.id}>
                                                                    <TableCell className="font-mono text-xs font-medium text-[#003366]">{d.codigoEstudiante}</TableCell>
                                                                    <TableCell className="text-xs font-medium">{d.nombres} {d.apellidos}</TableCell>
                                                                    <TableCell className="text-xs text-muted-foreground">{d.programa}</TableCell>
                                                                    <TableCell className="text-xs text-center">{d.creditosAprobados}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-gray-50/50 text-muted-foreground">
                                        <div className="bg-white p-4 rounded-full shadow-sm mb-4"><FileText className="h-8 w-8 text-gray-300"/></div>
                                        <p className="font-medium text-gray-900">Esperando archivo de SIMCA</p>
                                        <p className="text-sm text-center max-w-xs mt-1">Cargue el archivo Excel (.xlsx) descargado de SIMCA.</p>
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
                     {/* Botones de Acciones Globales */}
                     <Button 
                        variant="outline" 
                        onClick={handlePreseleccionarNivelados} 
                        disabled={isValidating || selectedPeriodo?.estado !== 'PROCESO_CARGA_SIMCA'}
                        className={selectedPeriodo?.estado === 'PROCESO_CARGA_SIMCA' ? 'border-blue-500 bg-blue-50' : ''}
                     >
                        <HelpCircle className="mr-2 h-4 w-4"/> 1. Identificar Nivelados
                     </Button>
                     <ArrowRight className="h-4 w-4 text-muted-foreground" />
                     <Button 
                        variant="outline" 
                        onClick={handleCalcularAvance} 
                        disabled={isValidating || selectedPeriodo?.estado !== 'PROCESO_REVISION_POTENCIALES_NIVELADOS'}
                        className={selectedPeriodo?.estado === 'PROCESO_REVISION_POTENCIALES_NIVELADOS' ? 'border-blue-500 bg-blue-50' : ''}
                     >
                        <CheckCircle className="mr-2 h-4 w-4"/> 2. Calcular Avance
                     </Button>
                     <ArrowRight className="h-4 w-4 text-muted-foreground" />
                     <Button 
                        onClick={handleValidacionFinal} 
                        disabled={isValidating || selectedPeriodo?.estado !== 'PROCESO_CALCULO_APTITUD'}
                        className="bg-green-600 hover:bg-green-700 text-white"
                     >
                        <Check className="mr-2 h-4 w-4"/> 3. Validación Final
                     </Button>
                 </div>
                 
                 <Card className="flex-1 overflow-hidden border shadow-sm">
                    <CardHeader className="pb-2 bg-gray-50/50 border-b">
                        <div className="flex justify-between items-center">
                            <CardTitle>Resultados Académicos</CardTitle>
                            <Badge variant="outline" className="bg-white">
                                Total: {datosAcademicos.length}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 h-full overflow-auto">
                        <Table>
                           <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                              <TableRow>
                                 <TableHead>Código</TableHead>
                                 <TableHead>Estudiante</TableHead>
                                 <TableHead className="text-center">Créditos</TableHead>
                                 <TableHead className="text-center">Semestres</TableHead>
                                 <TableHead className="text-center w-[100px]">% Avance</TableHead>
                                 <TableHead className="w-[150px]">Barra Avance</TableHead>
                                 <TableHead>Estado Aptitud</TableHead>
                                 <TableHead>Acciones</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {datosAcademicos.map(d => (
                                 <TableRow key={d.id}>
                                    <TableCell className="font-mono text-xs">{d.codigoEstudiante}</TableCell>
                                    <TableCell className="text-xs">{d.nombres} {d.apellidos}</TableCell>
                                    <TableCell className="text-center text-xs">{d.creditosAprobados}</TableCell>
                                    <TableCell className="text-center text-xs">{d.periodosMatriculados}</TableCell>
                                    
                                    {/* DATO NUMÉRICO % */}
                                    <TableCell className="text-center font-bold text-[#003366] text-xs">
                                        {d.porcentajeAvance ? `${d.porcentajeAvance}%` : '-'}
                                    </TableCell>
                                    
                                    {/* BARRA VISUAL */}
                                    <TableCell>
                                       <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden border">
                                            <div 
                                                className={cn(
                                                    "h-full transition-all duration-500",
                                                    (d.porcentajeAvance || 0) >= 100 ? "bg-blue-600" :
                                                    (d.porcentajeAvance || 0) >= 65 ? "bg-green-500" : "bg-yellow-500"
                                                )}
                                                style={{width: `${Math.min(d.porcentajeAvance || 0, 100)}%`}}
                                            ></div>
                                       </div>
                                    </TableCell>
                                    
                                    <TableCell>
                                        <Badge className={cn("whitespace-nowrap text-[10px]", getCustomBadgeStyle(d.estadoAptitud))} variant={getBadgeVariant(d.estadoAptitud)}>
                                            {d.estadoAptitud.replace(/_/g, ' ')}
                                        </Badge>
                                    </TableCell>
                                    
                                    <TableCell>
                                        {/* BOTÓN AÑADIR PROCESO DE NIVELACIÓN */}
                                        {d.estadoAptitud === 'POSIBLE_NIVELADO' && (
                                            <Button size="sm" className="h-7 text-xs bg-[#FDB913] text-[#003366] hover:bg-[#e5a812]" onClick={() => handleVerificarNivelado(d)}>
                                                Añadir proceso de nivelación
                                            </Button>
                                        )}
                                    </TableCell>
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
            <DialogHeader><DialogTitle>Corregir Código Estudiante</DialogTitle></DialogHeader>
            <div className="space-y-4">
               <Input value={manualCodigo} onChange={e => setManualCodigo(e.target.value)} placeholder="Nuevo Código"/>
               <div className="flex justify-end gap-2">
                  <Button variant="destructive" onClick={() => handleRevisionManual(false)}>Descartar</Button>
                  <Button onClick={() => handleRevisionManual(true)}>Guardar</Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>

      {/* MODAL DE VERIFICACIÓN NIVELADO */}
      <Dialog open={isNiveladoModalOpen} onOpenChange={setIsNiveladoModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
           <DialogHeader><DialogTitle>Verificación de Nivelación - {selectedDatoAcademico?.codigoEstudiante}</DialogTitle></DialogHeader>
           <div className="space-y-6">
              {!reporteNivelacion ? (
                  <div className="space-y-4 border p-4 rounded bg-muted/20">
                      <Label>1. Subir Historia Académica (Excel)</Label>
                      <Input type="file" accept=".xlsx" onChange={e => setHistoriaFile(e.target.files?.[0] || null)} />
                      <Button onClick={handleGenerarReporte} disabled={!historiaFile || isGeneratingReport}>
                          {isGeneratingReport ? "Generando..." : "Generar Reporte"}
                      </Button>
                  </div>
              ) : (
                  <div className="space-y-4">
                      <Alert className={reporteNivelacion.nivelado ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
                          <AlertDescription className="text-base font-medium">
                              Resultado: {reporteNivelacion.nivelado ? "CUMPLE CRITERIOS (NIVELADO)" : "NO CUMPLE CRITERIOS"}
                          </AlertDescription>
                      </Alert>
                      <p className="text-sm text-muted-foreground">{reporteNivelacion.mensajeResumen}</p>
                      
                      <div className="border rounded-md max-h-[300px] overflow-auto">
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Materia Plan</TableHead>
                                      <TableHead>Semestre</TableHead>
                                      <TableHead>Estado</TableHead>
                                      <TableHead>Observación</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {reporteNivelacion.comparacionMaterias.map((mat, idx) => (
                                      <TableRow key={idx}>
                                          <TableCell className="text-xs">{mat.nombre}</TableCell>
                                          <TableCell className="text-center">{mat.semestre}</TableCell>
                                          <TableCell>
                                              {mat.aprobada 
                                                ? <Badge className="bg-green-600">Aprobada</Badge> 
                                                : <Badge variant="outline" className="text-red-600 border-red-200">Pendiente</Badge>
                                              }
                                          </TableCell>
                                          <TableCell className="text-xs text-muted-foreground">{mat.observacion}</TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>

                      <div className="flex justify-end gap-4 pt-4 border-t">
                          <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleDecisionNivelado(false)}>
                              Confirmar NO NIVELADO
                          </Button>
                          <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleDecisionNivelado(true)}>
                              Confirmar NIVELADO
                          </Button>
                      </div>
                  </div>
              )}
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}