import { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
    Download, RefreshCcw, Search, User, FileBarChart, PieChart as PieIcon, History, Filter, ArrowRight 
} from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

import { 
    Periodo, fetchPeriodos,
    fetchDistribucionAsignaciones, fetchDistribucionPorPrograma, fetchResumenProcesamiento,
    fetchPopularidadElectivas, descargarReporteDistribucionExcel, descargarReportePopularidadExcel,
    buscarEstudiantes, fetchHistorialEstudiante,
    DistribucionAsignacionesResponse, DistribucionAsignacionesPorProgramaResponse, 
    ResumenProcesamientoPeriodoResponse, PopularidadElectivasResponse, EstudianteBusquedaResponse, HistorialEstudiantePeriodoResponse
} from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#003366', '#FDB913'];

export function ReportesModule() {
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [selectedPeriodo, setSelectedPeriodo] = useState<Periodo | null>(null);
    const [activeTab, setActiveTab] = useState('general');
    const estadosConReportes = ['ASIGNACION_PROCESADA', 'CERRADO', 'GENERACION_REPORTE_DETALLADO'];
    const reportesDisponibles = selectedPeriodo && estadosConReportes.includes(selectedPeriodo.estado);

    // Estado de datos
    const [distribucionData, setDistribucionData] = useState<DistribucionAsignacionesResponse | null>(null);
    const [programaData, setProgramaData] = useState<DistribucionAsignacionesPorProgramaResponse | null>(null);
    const [resumenData, setResumenData] = useState<ResumenProcesamientoPeriodoResponse | null>(null);
    const [popularidadData, setPopularidadData] = useState<PopularidadElectivasResponse | null>(null);
    const [incluirDescartados, setIncluirDescartados] = useState(false);

    // Estado Historial
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<EstudianteBusquedaResponse[]>([]);
    const [selectedEstudiante, setSelectedEstudiante] = useState<HistorialEstudiantePeriodoResponse[] | null>(null);
    const [selectedEstudianteInfo, setSelectedEstudianteInfo] = useState<EstudianteBusquedaResponse | null>(null);

    useEffect(() => { loadPeriodos(); }, []);

    useEffect(() => {
        if (selectedPeriodo) {
            setDistribucionData(null);
            setProgramaData(null);
            setResumenData(null);
            setPopularidadData(null);
            
            if (reportesDisponibles) {
                loadDashboardData(selectedPeriodo.id);
            }
        }
    }, [selectedPeriodo, incluirDescartados]);

    const loadPeriodos = async () => {
        try {
            const data = await fetchPeriodos();
            setPeriodos(data);
            if (data.length > 0 && !selectedPeriodo) setSelectedPeriodo(data[0]);
        } catch (e) { toast.error("Error cargando periodos"); }
    };

    const loadDashboardData = async (periodoId: number) => {
        try {
            const [dist, prog, res, pop] = await Promise.all([
                fetchDistribucionAsignaciones(periodoId),
                fetchDistribucionPorPrograma(periodoId),
                fetchResumenProcesamiento(periodoId),
                fetchPopularidadElectivas(periodoId, incluirDescartados)
            ]);
            setDistribucionData(dist);
            setProgramaData(prog);
            setResumenData(res);
            setPopularidadData(pop);
        } catch (error) {
            console.error(error);
            toast.error("Error actualizando gráficas");
        }
    };

    // --- Descargas Excel ---
    const handleDownloadDistribucion = async () => {
        if(!selectedPeriodo) return;
        try {
            const blob = await descargarReporteDistribucionExcel(selectedPeriodo.id);
            downloadBlob(blob, `Distribucion_${selectedPeriodo.semestre}.xlsx`);
            toast.success("Reporte descargado");
        } catch(e) { toast.error("Error en descarga"); }
    };

    const handleDownloadPopularidad = async () => {
        if(!selectedPeriodo) return;
        try {
            const blob = await descargarReportePopularidadExcel(selectedPeriodo.id);
            downloadBlob(blob, `Popularidad_${selectedPeriodo.semestre}.xlsx`);
            toast.success("Reporte descargado");
        } catch(e) { toast.error("Error en descarga"); }
    };

    const downloadBlob = (blob: Blob, name: string) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    // --- Historial ---
    const handleSearch = async () => {
        if(!searchTerm) return;
        try {
            const res = await buscarEstudiantes(searchTerm);
            setSearchResults(res);
        } catch(e) { toast.error("Error buscando estudiante"); }
    };

    const handleSelectEstudiante = async (est: EstudianteBusquedaResponse) => {
        setSelectedEstudianteInfo(est);
        try {
            const historial = await fetchHistorialEstudiante(est.codigo);
            setSelectedEstudiante(historial);
            setSearchResults([]);
            setSearchTerm('');
        } catch(e) { toast.error("Error cargando historial"); }
    };

    const resumenChartData = resumenData ? [
        ...(resumenData.resumenAptitud || []).map(i => ({ name: i.titulo, value: i.cantidad })),
        ...(resumenData.resumenFormulario || []).map(i => ({ name: i.titulo, value: i.cantidad }))
    ] : [];

    return (
        <div className="flex flex-col h-full w-full bg-gray-50/50">
            {/* Header */}
            <div className="p-6 border-b bg-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-[#003366] text-2xl font-bold">Reportes y Estadísticas</h1>
                    <p className="text-muted-foreground">Análisis de asignación y métricas del sistema</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Periodo:</span>
                    <Select value={selectedPeriodo?.id.toString()} onValueChange={(val) => {
                        const p = periodos.find(x => x.id.toString() === val);
                        if(p) setSelectedPeriodo(p);
                    }}>
                        <SelectTrigger className="w-[180px] bg-white"><SelectValue/></SelectTrigger>
                        <SelectContent>
                            {periodos.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.semestre}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" onClick={() => selectedPeriodo && loadDashboardData(selectedPeriodo.id)}><RefreshCcw className="h-4 w-4"/></Button>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-hidden w-full">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col gap-6 w-full">
                    <TabsList className="w-fit bg-white border shadow-sm">
                        <TabsTrigger value="general" className="gap-2 px-6"><PieIcon className="w-4 h-4"/> General</TabsTrigger>
                        <TabsTrigger value="popularidad" className="gap-2 px-6"><FileBarChart className="w-4 h-4"/> Popularidad</TabsTrigger>
                    </TabsList>

                   {!reportesDisponibles ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-muted-foreground animate-in fade-in zoom-in duration-300">
                            <div className="bg-yellow-100 p-6 rounded-full mb-4">
                                <AlertTriangle className="w-12 h-12 text-yellow-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Reportes no disponibles</h2>
                            <p className="max-w-md mx-auto">
                                Las estadísticas y gráficas solo se generan una vez que la asignación de cupos ha sido procesada exitosamente.
                            </p>
                            {selectedPeriodo && (
                                <Badge variant="outline" className="mt-4 text-lg py-1 px-4 border-yellow-200 bg-yellow-50 text-yellow-800">
                                    Estado actual: {selectedPeriodo.estado.replace(/_/g, ' ')}
                                </Badge>
                            )}
                        </div>
                    ) : (
                      <>

                    {/* --- TAB 1: GENERAL --- */}
                    <TabsContent value="general" className="flex-1 overflow-y-auto w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
                            
                            {/* Distribución por Programa */}
                            <Card className="col-span-1 xl:col-span-2 shadow-sm h-[400px]">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Asignaciones por Programa</CardTitle>
                                        <CardDescription>Total de cupos ocupados por carrera</CardDescription>
                                    </div>
                                    <Button size="sm" variant="outline" className="border-green-200 text-green-700 bg-green-50" onClick={handleDownloadDistribucion}>
                                        <Download className="w-4 h-4 mr-2"/> Excel
                                    </Button>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={programaData?.distribucion || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="programa" tick={{fontSize: 10}} height={50} />
                                            <YAxis />
                                            <Tooltip cursor={{fill: '#f3f4f6'}} />
                                            <Bar dataKey="cantidadAsignadas" name="Cupos Asignados" fill="#003366" radius={[4, 4, 0, 0]} barSize={50} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* --- TAB 2: POPULARIDAD (Full Screen) --- */}
                    <TabsContent value="popularidad" className="flex-1 overflow-y-auto w-full">
                        <Card className="shadow-sm w-full min-h-[600px] flex flex-col">
                            <CardHeader className="flex flex-row items-center justify-between shrink-0">
                                <div>
                                    <CardTitle>Popularidad de Electivas</CardTitle>
                                    <CardDescription>Top electivas más solicitadas por los estudiantes</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setIncluirDescartados(!incluirDescartados)}
                                        className={incluirDescartados ? "bg-red-50 text-red-700" : ""}
                                    >
                                        <Filter className="w-4 h-4 mr-2"/> 
                                        {incluirDescartados ? "Incluyendo Descartados" : "Solo Válidos"}
                                    </Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleDownloadPopularidad}>
                                        <Download className="w-4 h-4 mr-2"/> Descargar Reporte
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-[500px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={(popularidadData?.ranking || []).slice(0, 20)} margin={{top: 20, right: 30, left: 20, bottom: 80}}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="nombreElectiva" angle={-45} textAnchor="end" interval={0} fontSize={11} height={100}/>
                                        <YAxis />
                                        <Tooltip cursor={{fill: '#f3f4f6'}} />
                                        <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px'}}/>
                                        <Bar dataKey="opcion1" name="1ra Opción" stackId="a" fill="#003366" />
                                        <Bar dataKey="opcion2" name="2da Opción" stackId="a" fill="#2563eb" />
                                        <Bar dataKey="opcion3" name="3ra Opción" stackId="a" fill="#60a5fa" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>
                  </>
                )}
                </Tabs>
            </div>
        </div>
    );
}