import { useState, useEffect } from 'react';
import {
  Upload, Download, AlertCircle, CheckCircle, HelpCircle,
  FileText, Search, Filter, RefreshCw, ArrowRight, Check, Edit, XCircle, CheckSquare, FileUp, Ban,
  Users, Award, Play, FileSpreadsheet, RefreshCcw, UserMinus, Archive
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from './ui/utils';
import * as XLSX from 'xlsx';

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
  generarReporteRanking,
  registrarDecisionFinal,
  cerrarPeriodoAcademico, 
  VerificacionNiveladoDTO,
  procesarAsignacionMasiva,
  obtenerAptosOrdenados, 
  generarReporteTecnico, 
  generarReportePublico,
  filtrarEstudiantesNoElegibles,
  EstudianteOrdenamientoResponse,
} from '../services/api';

export function ProcesamientoModule() {
  // --- Estados Globales ---
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<Periodo | null>(null);
  const [activeTab, setActiveTab] = useState('respuestas');
  
  // --- Estados Tab 1, 2, 3 ---
  const [respuestas, setRespuestas] = useState<RespuestaFormulario[]>([]);
  const [isLoadingRespuestas, setIsLoadingRespuestas] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [simcaFiles, setSimcaFiles] = useState<FileList | null>(null);
  const [isUploadingSimca, setIsUploadingSimca] = useState(false);
  const [simcaResponse, setSimcaResponse] = useState<SimcaCargaResponse | null>(null);
  const [datosAcademicos, setDatosAcademicos] = useState<DatosAcademicoResponse[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  
  // --- Modales ---
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRespuesta, setSelectedRespuesta] = useState<RespuestaFormulario | null>(null);
  const [manualCodigo, setManualCodigo] = useState('');
  const [isNiveladoModalOpen, setIsNiveladoModalOpen] = useState(false);
  const [selectedDatoAcademico, setSelectedDatoAcademico] = useState<DatosAcademicoResponse | null>(null);
  const [historiaFile, setHistoriaFile] = useState<File | null>(null);
  const [reporteNivelacion, setReporteNivelacion] = useState<VerificacionNiveladoDTO | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // --- Estados Tab 4 (Asignación) ---
  const [estudiantesOrdenados, setEstudiantesOrdenados] = useState<EstudianteOrdenamientoResponse[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Carga inicial
  useEffect(() => { loadPeriodos(); }, []);

  // Efecto cuando cambia el periodo seleccionado
  useEffect(() => {
    if (selectedPeriodo) {
      recargarDatos(selectedPeriodo);
    }
  }, [selectedPeriodo]); 


  const recargarDatos = async (periodo: Periodo) => {
    if (!periodo) return;
    const pid = periodo.id;
    setIsLoadingRespuestas(true);
    try {
        const data = await fetchRespuestasFormulario(pid);
        if (Array.isArray(data)) {
            const unique = Array.from(new Map(data.map(item => [item.id, item])).values());
            setRespuestas(unique);
        } else {
            setRespuestas([]);
        }
    } catch (error) {
        console.error("Error cargando respuestas:", error);
    } finally {
        setIsLoadingRespuestas(false);
    }

    const estadosConAcademicos = [
        'PROCESO_CALCULO_AVANCE', 
        'PROCESO_CALCULO_APTITUD', 
        'PROCESO_FILTRADO_NO_ELEGIBLES',
        'EN_PROCESO_ASIGNACION', 
        'PROCESO_REVISION_POTENCIALES_NIVELADOS', 
        'PROCESO_CARGA_SIMCA', 
        'PROCESO_CONFIRMACION_SIMCA', 
        'ASIGNACION_PROCESADA',
        'CERRADO' 
    ];
    
    if (estadosConAcademicos.includes(periodo.estado)) {
        try {
            const dataAcademica = await fetchDatosAcademicos(pid);
            setDatosAcademicos(dataAcademica);
        } catch (error) {
            console.warn("Error silencioso cargando datos académicos:", error);
        }
    }

    if (periodo.estado === 'EN_PROCESO_ASIGNACION') {
        // CASO A: Estamos listos para asignar, traemos los Aptos.
        try {
            const dataRanking = await obtenerAptosOrdenados(pid);
            const sorted = [...dataRanking].sort((a, b) => (b.avance || 0) - (a.avance || 0));
            setEstudiantesOrdenados(sorted);
        } catch (error) {
            setEstudiantesOrdenados([]); 
        }
    } else if (periodo.estado === 'ASIGNACION_PROCESADA' || periodo.estado === 'CERRADO') {
        // CASO B: Ya se asignó o está cerrado.
        try {
            const resultados = await generarReporteRanking(pid);
            if (Array.isArray(resultados)) {
                 const mapeados: EstudianteOrdenamientoResponse[] = resultados.map((r: any, index: number) => ({
                    codigoEstudiante: r.codigo,
                    nombreCompleto: r.nombre,
                    programa: r.programa,
                    promedio: r.promedio || 0,
                    avance: r.avance || 0,
                    electivasFaltantes: 0, 
                    puesto: index + 1
                }));
                setEstudiantesOrdenados(mapeados);
            } else {
                setEstudiantesOrdenados([]);
            }
        } catch (error) {
            setEstudiantesOrdenados([]);
        }
    } else {
        setEstudiantesOrdenados([]);
    }
  };

  const loadPeriodos = async () => {
    try {
        const data = await fetchPeriodos();
        setPeriodos(data);
        
        if (selectedPeriodo) {
            const actualizado = data.find(p => p.id === selectedPeriodo.id);
            if (actualizado) setSelectedPeriodo({ ...actualizado });
        } else if (data.length > 0) {
            const active = data.find(p => p.estado !== 'CONFIGURACION') || data[0];
            setSelectedPeriodo(active);
        }
    } catch (error) {
        toast.error("Error sincronizando periodos");
    }
  };

  // --- Handlers Tabs 1, 2, 3 ---
  const handleFiltroDuplicados = async () => { try { await aplicarFiltroDuplicados(selectedPeriodo!.id); toast.success("Filtrado OK"); await loadPeriodos(); if(selectedPeriodo) recargarDatos(selectedPeriodo); } catch(e:any){toast.error(e.message)} };
  const handleFiltroAntiguedad = async () => { try { await aplicarFiltroAntiguedad(selectedPeriodo!.id); toast.success("Validado OK"); await loadPeriodos(); } catch(e:any){toast.error(e.message)} };
  const handleConfirmarSimca = async () => { try { await confirmarListaParaSimca(selectedPeriodo!.id); toast.success("Confirmado OK"); await loadPeriodos(); setActiveTab('simca'); } catch(e:any){toast.error(e.message)} };
  
  const handleRevisionManual = async (incluir: boolean) => {
    if (!selectedRespuesta || !selectedPeriodo) return;
    try {
      await revisarManualFormatoInvalido(selectedRespuesta.id, incluir, manualCodigo);
      toast.success(incluir ? "Incluido" : "Descartado");
      setIsReviewModalOpen(false); setManualCodigo(''); setSelectedRespuesta(null);
      recargarDatos(selectedPeriodo);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDescargarLotes = async () => { if (!selectedPeriodo) return; try { const blob = await descargarLotesSimca(selectedPeriodo.id); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Lotes.zip`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a); } catch (err: any) { toast.error(err.message); } };
  const handleCargarSimca = async () => { if (!selectedPeriodo || !simcaFiles) return toast.error("Seleccione archivo"); setIsUploadingSimca(true); try { const res = await cargarDatosSimca(selectedPeriodo.id, Array.from(simcaFiles)); setSimcaResponse(res); toast.success(res.mensaje); await loadPeriodos(); if(selectedPeriodo) recargarDatos(selectedPeriodo); } catch (err: any) { toast.error(err.message); } finally { setIsUploadingSimca(false); } };

  // --- HANDLERS PESTAÑA 3 ---
  const handlePreseleccionarNivelados = async () => {
      if(!selectedPeriodo) return; setIsValidating(true);
      try { await preseleccionarNivelados(selectedPeriodo.id); toast.success("Nivelados identificados"); await loadPeriodos(); } catch(err:any) { toast.error(err.message); } finally { setIsValidating(false); }
  };
  const handleCalcularAvance = async () => {
      if(!selectedPeriodo) return; setIsValidating(true);
      try { const res = await calcularPorcentajeAvance(selectedPeriodo.id); toast.success(res.mensaje); await loadPeriodos(); } catch(err:any) { toast.error(err.message); } finally { setIsValidating(false); }
  };
  const handleVerificarAptitud = async () => {
      if(!selectedPeriodo) return; setIsValidating(true);
      try { const res = await validarRequisitosGenerales(selectedPeriodo.id); toast.success(res.mensaje); await loadPeriodos(); } catch(err:any) { toast.error(err.message); } finally { setIsValidating(false); }
  };
  
  const handleFiltrarNoElegibles = async () => {
      if(!selectedPeriodo) return; setIsValidating(true);
      try {
          const res = await filtrarEstudiantesNoElegibles(selectedPeriodo.id);
          toast.success(res.mensaje || "Filtrado completado.");
          
          await loadPeriodos();
          
          setActiveTab('asignacion');
      } catch(err:any) { toast.error(err.message); } finally { setIsValidating(false); }
  };

  // --- HANDLERS REPORTES ---
  const handleProcesarAsignacion = async () => {
      if (!selectedPeriodo) return;
      
      setIsAssigning(true);
      try {

          const response = await procesarAsignacionMasiva(selectedPeriodo.id);
          toast.success(response.mensaje || "Asignación completada exitosamente.");
          const periodoActualizado = { 
              ...selectedPeriodo, 
              estado: 'ASIGNACION_PROCESADA' 
          };
          
          setSelectedPeriodo(periodoActualizado);
          await recargarDatos(periodoActualizado);
          await loadPeriodos();
          
      } catch (err: any) {
          console.error(err);
          toast.error(err.message || "Error al procesar la asignación.");
      } finally {
          setIsAssigning(false);
      }
  };

  // --- NUEVO: CERRAR PERIODO ---
  const handleCerrarPeriodoDefinitivamente = async () => {
    if (!selectedPeriodo) return;
    try {
        await cerrarPeriodoAcademico(selectedPeriodo.id);
        toast.success('Periodo cerrado exitosamente. El proceso ha finalizado.');
        
        // Actualizamos estado local
        const periodoActualizado = { ...selectedPeriodo, estado: 'CERRADO' };
        setSelectedPeriodo(periodoActualizado);
        await loadPeriodos();
        await recargarDatos(periodoActualizado);
    } catch (err: any) {
        toast.error(err.message || "Error al cerrar el periodo");
    }
  };

  const handleDescargarReporteTecnico = async () => {
      if (!selectedPeriodo) return;
      
      try {
          toast.info("Generando y descargando Reporte Técnico...");
          
          const blob = await generarReporteTecnico(selectedPeriodo.id);
          
          const url = window.URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = `Reporte_Tecnico_${selectedPeriodo.semestre}.xlsx`; 
          document.body.appendChild(a);
          a.click();
          
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          toast.success("Reporte Técnico descargado correctamente.");

      } catch (error: any) { 
          console.error("Error descarga reporte técnico:", error);
          toast.error("Error: " + (error.message || "No se pudo descargar el reporte")); 
      }
  };

  const handleDescargarReportePublico = async () => {
      if (!selectedPeriodo) return;

      try {
          toast.info("Generando y descargando Reporte Público...");
          
          const blob = await generarReportePublico(selectedPeriodo.id);

          const url = window.URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = `Reporte_Publico_${selectedPeriodo.semestre}.xlsx`;
          document.body.appendChild(a);
          a.click();

          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          toast.success("Reporte Público descargado correctamente.");

      } catch (error: any) { 
          console.error("Error descarga reporte público:", error);
          toast.error("Error: " + (error.message || "No se pudo descargar el reporte")); 
      }
  };

  // --- Modales ---
  const handleVerificarNivelado = (dato: DatosAcademicoResponse) => { setSelectedDatoAcademico(dato); setHistoriaFile(null); setReporteNivelacion(null); setIsNiveladoModalOpen(true); };
  const handleGenerarReporte = async () => {
    if (!selectedDatoAcademico || !historiaFile) return toast.error("Seleccione archivo");
    setIsGeneratingReport(true);
    try { const reporte = await generarReporteNivelado(selectedDatoAcademico.id, historiaFile); setReporteNivelacion(reporte); } catch (err: any) { toast.error(err.message); } finally { setIsGeneratingReport(false); }
  };
  const handleDecisionNivelado = async (nivelado: boolean) => {
    if (!selectedDatoAcademico) return;
    try { await registrarDecisionFinal(selectedDatoAcademico.id, nivelado); toast.success("Decisión registrada"); setIsNiveladoModalOpen(false); recargarDatos(selectedPeriodo!); } catch (err: any) { toast.error(err.message); }
  };

  // --- UI Helpers ---
  const filteredRespuestas = respuestas.filter(r => {
      const searchLower = searchTerm.toLowerCase();
      return ((r.nombreEstudiante?.toLowerCase() || '').includes(searchLower) || (r.codigoEstudiante?.includes(searchTerm))) && (filtroEstado === 'TODOS' || r.estado === filtroEstado);
  });
  const getBadgeVariant = (estado: string) => {
     if(['VALIDO', 'CUMPLE', 'INCLUIDO', 'DATOS_CARGADOS', 'APTO', 'NIVELADO_CONFIRMADO'].includes(estado)) return 'default';
     if(['DUPLICADO', 'NO_CUMPLE', 'DESCARTADO', 'NO_APTO', 'INCONSISTENTE_SIMCA', 'NIVELADO_DESCARTADO', 'EXCLUIDO_POR_ELECTIVAS'].includes(estado)) return 'destructive';
     if(['POSIBLE_NIVELADO', 'PENDIENTE_VALIDACION'].includes(estado)) return 'secondary';
     return 'outline';
  };
  const getCustomBadgeStyle = (estado: string) => {
      if (estado === 'POSIBLE_NIVELADO' || estado === 'PENDIENTE_VALIDACION') return "bg-[#FDB913] text-[#003366] hover:bg-[#e5a812] border-transparent";
      return "";
  };


  // --- RENDER ---
  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* HEADER */}
      <div className="p-6 border-b bg-white shadow-sm shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#003366] text-2xl font-bold">Procesamiento de Estudiantes</h1>
            <p className="text-muted-foreground">Flujo de validación y clasificación académica</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedPeriodo && (
                <Badge variant="outline" className="mr-2 border-blue-200 text-blue-700 bg-blue-50">
                    Estado: {selectedPeriodo.estado.replace(/_/g, ' ')}
                </Badge>
            )}
            <span className="text-sm font-medium text-muted-foreground">Periodo:</span>
            <div className="flex items-center gap-1">
                <Select
                value={selectedPeriodo ? selectedPeriodo.id.toString() : ""}
                onValueChange={(val) => {
                    const p = periodos.find(per => per.id.toString() === val);
                    setSelectedPeriodo(p || null);
                }}
                >
                <SelectTrigger className="w-56 bg-white">
                    <SelectValue placeholder="Seleccionar periodo"/>
                </SelectTrigger>
                <SelectContent>
                    {periodos.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                            {p.semestre}
                        </SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={loadPeriodos} title="Actualizar estado">
                    <RefreshCcw className="h-4 w-4 text-gray-500" />
                </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
         <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col space-y-6">
            {/* TABS NAVIGATION */}
            <div className="shrink-0">
              <TabsList className="flex w-full h-auto p-1 bg-white border border-gray-200 shadow-sm rounded-xl gap-1">
                 <TabsTrigger
                  value="respuestas"
                  className="flex-1 data-[state=active]:bg-[#FDB913] data-[state=active]:text-[#003366] data-[state=active]:shadow-md font-semibold rounded-lg py-2.5 transition-all"
                 >
                  1. Filtrado y Validación
                 </TabsTrigger>
                 <TabsTrigger
                  value="simca"
                  className="flex-1 data-[state=active]:bg-[#FDB913] data-[state=active]:text-[#003366] data-[state=active]:shadow-md font-semibold rounded-lg py-2.5 transition-all"
                 >
                  2. Carga SIMCA
                 </TabsTrigger>
                 <TabsTrigger
                  value="academica"
                  className="flex-1 data-[state=active]:bg-[#FDB913] data-[state=active]:text-[#003366] data-[state=active]:shadow-md font-semibold rounded-lg py-2.5 transition-all"
                 >
                  3. Validación Académica
                 </TabsTrigger>
                 <TabsTrigger
                  value="asignacion"
                  className="flex-1 data-[state=active]:bg-[#FDB913] data-[state=active]:text-[#003366] data-[state=active]:shadow-md font-semibold rounded-lg py-2.5 transition-all"
                 >
                  4. Asignación de Cupos
                 </TabsTrigger>
              </TabsList>
            </div>

            {/* Pestaña 1: Respuestas */}
            <TabsContent value="respuestas" className="flex-1 overflow-hidden flex flex-col gap-4 data-[state=inactive]:hidden">
               <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-white p-4 rounded-lg border shadow-sm shrink-0">
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
                      <Button onClick={handleFiltroDuplicados} className="bg-[#003366]" disabled={selectedPeriodo?.estado !== 'CERRADO_FORMULARIO'}>Filtrar Duplicados</Button>
                      <Button onClick={handleFiltroAntiguedad} className="bg-[#003366]" disabled={selectedPeriodo?.estado !== 'PROCESO_FILTRADO_DUPLICADOS'}>Validar Antigüedad</Button>
                      <Button onClick={handleConfirmarSimca} className="bg-[#003366]" disabled={selectedPeriodo?.estado !== 'PROCESO_CLASIFICACION_ANTIGUEDAD'}>Confirmar</Button>
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
                             {isLoadingRespuestas ? (
                                 <TableRow>
                                     <TableCell colSpan={4} className="text-center py-10">Cargando datos...</TableCell>
                                 </TableRow>
                             ) : filteredRespuestas.map(r => (
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

            {/* Pestaña 2: SIMCA */}
            <TabsContent value="simca" className="flex-1 overflow-hidden flex flex-col gap-4 data-[state=inactive]:hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
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
                    <div className="lg:col-span-2 h-full overflow-y-auto">
                        <Card className="border-none shadow-none bg-transparent h-full">
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
                                            <p className="text-sm text-center max-w-xs mt-1">Cargue el archivo Excel (.xlsx) descargado de SIMCA para visualizar el reporte de validación aquí.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>

            {/* --- PESTAÑA 3: ACADEMICA --- */}
            <TabsContent value="academica" className="flex-1 overflow-hidden flex flex-col gap-4 data-[state=inactive]:hidden">
                 <div className="flex gap-4 bg-white p-4 rounded-lg border shadow-sm flex-wrap items-center shrink-0">
                      
                      {/* PASO 1: Identificar Nivelados */}
                      <Button 
                        variant="outline" 
                        onClick={handlePreseleccionarNivelados} 
                        disabled={isValidating || !['PROCESO_CARGA_SIMCA', 'PROCESO_CONFIRMACION_SIMCA', 'PROCESO_REVISION_POTENCIALES_NIVELADOS'].includes(selectedPeriodo?.estado || '')}
                        className={cn(['PROCESO_CARGA_SIMCA', 'PROCESO_CONFIRMACION_SIMCA', 'PROCESO_REVISION_POTENCIALES_NIVELADOS'].includes(selectedPeriodo?.estado || '') ? "border-blue-500 text-blue-700 bg-blue-50" : "")}
                      >
                         <HelpCircle className="mr-2 h-4 w-4"/> 1. Identificar Nivelados
                      </Button>
                      
                      {/* PASO 2: Calcular Avance */}
                      <Button 
                        variant="outline" 
                        onClick={handleCalcularAvance} 
                        disabled={isValidating || !['PROCESO_CALCULO_AVANCE', 'PROCESO_REVISION_POTENCIALES_NIVELADOS'].includes(selectedPeriodo?.estado || '')}
                        className={cn(['PROCESO_CALCULO_AVANCE', 'PROCESO_REVISION_POTENCIALES_NIVELADOS'].includes(selectedPeriodo?.estado || '') ? "border-blue-500 text-blue-700 bg-blue-50 shadow-md ring-1 ring-blue-200" : "")}
                      >
                         <CheckCircle className="mr-2 h-4 w-4"/> 2. Calcular Avance
                      </Button>
                      
                      {/* PASO 3: Verificar Aptitud */}
                      <Button
                        onClick={handleVerificarAptitud}
                        disabled={isValidating || selectedPeriodo?.estado !== 'PROCESO_CALCULO_APTITUD'}
                        className={cn("bg-white text-gray-700 border hover:bg-gray-100", selectedPeriodo?.estado === 'PROCESO_CALCULO_APTITUD' ? "border-blue-500 text-blue-700 bg-blue-50 shadow-md ring-1 ring-blue-200" : "")}
                        variant="outline"
                      >
                         <Check className="mr-2 h-4 w-4"/> 3. Verificar Aptitud
                      </Button>

                      {/* PASO 4: Filtrar No Elegibles */}
                      <Button
                        onClick={handleFiltrarNoElegibles}
                        disabled={isValidating || selectedPeriodo?.estado !== 'PROCESO_FILTRADO_NO_ELEGIBLES'}
                        className={cn(
                            "bg-white text-gray-700 border hover:bg-gray-100", 
                            selectedPeriodo?.estado === 'PROCESO_FILTRADO_NO_ELEGIBLES' 
                                ? "bg-blue-600 text-white hover:bg-blue-700 border-transparent shadow-md" 
                                : ""
                        )}
                      >
                         <UserMinus className="mr-2 h-4 w-4"/> 4. Filtrar No Elegibles
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
                                 <TableHead className="text-center w-[100px]">% Avance</TableHead>
                                 <TableHead>Estado Aptitud</TableHead>
                                 <TableHead>Acciones</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {datosAcademicos.map((d) => (
                                    <TableRow key={d.id}>
                                       <TableCell className="font-mono text-xs">{d.codigoEstudiante}</TableCell>
                                       <TableCell className="text-xs">
                                            <div className="font-medium">{d.nombres} {d.apellidos}</div>
                                            <div className="text-muted-foreground">{d.programa}</div>
                                       </TableCell>
                                       <TableCell className="text-center text-xs">{d.creditosAprobados}</TableCell>
                                       <TableCell className="text-center font-bold text-[#003366] text-xs">
                                            {d.porcentajeAvance ? `${d.porcentajeAvance}%` : '-'}
                                       </TableCell>
                                       <TableCell>
                                            <Badge
                                                 variant={getBadgeVariant(d.estadoAptitud)}
                                                 className={cn("whitespace-nowrap text-[10px]", getCustomBadgeStyle(d.estadoAptitud), d.estadoAptitud === 'EXCLUIDO_POR_ELECTIVAS' ? 'bg-red-100 text-red-800 border-red-200' : '')}
                                            >
                                                 {d.estadoAptitud.replace(/_/g, ' ')}
                                            </Badge>
                                       </TableCell>
                                       <TableCell>
                                            {(d.estadoAptitud === 'POSIBLE_NIVELADO' || d.estadoAptitud === 'PENDIENTE_VALIDACION') && (
                                                <Button size="sm" className="h-7 text-xs bg-[#FDB913] text-[#003366] hover:bg-[#e5a812]" onClick={() => handleVerificarNivelado(d)}>
                                                     Nivelación
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

{/* --- PESTAÑA 4: ASIGNACIÓN --- */}
            <TabsContent value="asignacion" className="flex-1 overflow-hidden flex flex-col gap-4 data-[state=inactive]:hidden">
                
                {/* BARRA DE CONTROL HORIZONTAL */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-lg border shadow-sm shrink-0 justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <div className="bg-[#FDB913]/20 p-2 rounded-lg">
                                <Award className="w-5 h-5 text-[#003366]" />
                             </div>
                             <div>
                                <h3 className="font-bold text-[#003366]">Ranking de Estudiantes</h3>
                                <p className="text-xs text-muted-foreground">Estudiantes aptos ordenados por mérito (% Avance)</p>
                             </div>
                        </div>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-800 text-xs px-2 py-1">
                            {estudiantesOrdenados.length} Estudiantes Aptos
                        </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                         {/* Botón Asignación Masiva */}
                         <Button
                            onClick={handleProcesarAsignacion}
                            disabled={isAssigning || selectedPeriodo?.estado !== 'EN_PROCESO_ASIGNACION'}
                            className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                        >
                            <Play className="w-4 h-4 mr-2 fill-current" />
                            {isAssigning ? "Asignando..." : "Ejecutar Asignación"}
                        </Button>

                        <div className="h-8 w-px bg-gray-200 mx-1"></div> {/* Separador */}

                        {/* Botones Descarga */}
                        <div className="flex gap-2">
                             <Button onClick={handleDescargarReporteTecnico} variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
                                <FileSpreadsheet className="w-4 h-4 mr-2"/> R. Técnico
                             </Button>
                             <Button onClick={handleDescargarReportePublico} variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
                                <FileSpreadsheet className="w-4 h-4 mr-2"/> R. Público
                             </Button>
                        </div>


                     {/* --- BOTÓN CERRAR PERIODO --- */}
                        {['ASIGNACION_PROCESADA', 'GENERACION_REPORTE_DETALLADO', 'EN_PROCESO_ASIGNACION'].includes(selectedPeriodo?.estado || '') && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        className="ml-2 border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                                    >
                                        <Archive className="w-4 h-4 mr-2" /> Cerrar Periodo
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Cerrar Periodo Definitivamente?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción finalizará el ciclo académico actual. Las ofertas se marcarán como cerradas y no se podrán realizar más cambios en la asignación. Solo estará disponible para consulta.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={handleCerrarPeriodoDefinitivamente}
                                            className="ml-2 border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                                        >
                                            Sí, Cerrar Periodo
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        {selectedPeriodo?.estado === 'CERRADO' && (
                             <Badge className="ml-2 border-red-200 text-red-700 bg-red-50 hover:bg-red-100">
                                <Archive className="w-4 h-4 mr-2" /> Periodo Cerrado
                             </Badge>
                        )}
                    </div>
                </div>

                {/* TABLA OCUPANDO EL RESTO */}
                <Card className="flex-1 overflow-hidden border shadow-sm">
                    <CardContent className="p-0 h-full overflow-auto relative">
                        <div className="absolute inset-0 overflow-auto">
                            <Table>
                                <TableHeader className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead className="w-[60px] font-bold text-center bg-gray-100">#</TableHead>
                                        <TableHead className="font-semibold bg-gray-100">Estudiante</TableHead>
                                        <TableHead className="font-semibold bg-gray-100">Programa</TableHead>
                                        <TableHead className="text-center font-semibold bg-gray-100">Avance</TableHead>
                                        <TableHead className="text-center font-semibold bg-gray-100">Promedio</TableHead>
                                        <TableHead className="text-center font-semibold bg-gray-100">Faltantes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {estudiantesOrdenados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-3 opacity-60">
                                                    <Users className="w-10 h-10 text-gray-300" />
                                                    <div className="space-y-1">
                                                        <p className="font-medium">Aún no se ha generado el ranking</p>
                                                        <p className="text-xs">Vaya a la Pestaña 3 y ejecute "Verificar Aptitud" para generar la lista.</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        estudiantesOrdenados.map((est) => (
                                            <TableRow key={est.codigoEstudiante} className="hover:bg-blue-50/30 transition-colors border-b last:border-0">
                                                <TableCell className="font-bold text-center text-[#003366] bg-gray-50/20 text-xs">#{est.puesto}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-sm text-gray-900">{est.nombreCompleto}</div>
                                                    <div className="text-[10px] text-muted-foreground font-mono">{est.codigoEstudiante}</div>
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-600 max-w-[180px] truncate" title={est.programa}>
                                                    {est.programa}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold">
                                                        {est.avance}%
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center text-xs font-medium text-gray-700">{est.promedio}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                                                        {est.electivasFaltantes}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
         </Tabs>
      </div>

      {/* Modales */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
         <DialogContent>
            <DialogHeader>
                <DialogTitle>Corregir Código Estudiante</DialogTitle>
                <DialogDescription>Edite el código para que cumpla con el formato.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
               <Input value={manualCodigo} onChange={e => setManualCodigo(e.target.value)} placeholder="Nuevo Código"/>
               <div className="flex justify-end gap-2">
                  <Button variant="destructive" onClick={() => handleRevisionManual(false)}>Descartar</Button>
                  <Button onClick={() => handleRevisionManual(true)}>Guardar</Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
      <Dialog open={isNiveladoModalOpen} onOpenChange={setIsNiveladoModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
               <DialogTitle>Verificación Nivelación</DialogTitle>
               <DialogDescription>Suba la historia académica para validar las materias.</DialogDescription>
           </DialogHeader>
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
                          <AlertDescription>Resultado: {reporteNivelacion.nivelado ? "CUMPLE" : "NO CUMPLE"}</AlertDescription>
                      </Alert>
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
                          <Button variant="outline" onClick={() => handleDecisionNivelado(false)}>Confirmar NO NIVELADO</Button>
                          <Button className="bg-green-600" onClick={() => handleDecisionNivelado(true)}>Confirmar NIVELADO</Button>
                      </div>
                  </div>
              )}
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}