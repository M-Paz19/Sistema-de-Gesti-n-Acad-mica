import { useState, useEffect } from 'react';
import { Upload, Download, Users, AlertCircle, CheckCircle, HelpCircle, FileText, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { toast } from 'sonner@2.0.3';

// Importar servicios
import { 
  Periodo, 
  fetchPeriodos, 
  RespuestaFormulario, 
  fetchRespuestasFormulario 
} from '../services/api';

export function ProcesamientoModule() {
  // Estados para periodos
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<string>('');
  
  // Estados para respuestas del formulario
  const [respuestas, setRespuestas] = useState<RespuestaFormulario[]>([]);
  const [isLoadingRespuestas, setIsLoadingRespuestas] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados existentes (mock) para otras funcionalidades
  const [activeTab, setActiveTab] = useState('respuestas'); // Cambiado default a 'respuestas'
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Cargar periodos al inicio
  useEffect(() => {
    fetchPeriodos()
      .then(data => {
        setPeriodos(data);
        // Seleccionar automáticamente el primer periodo si existe
        if (data.length > 0) {
          setSelectedPeriodoId(String(data[0].id));
        }
      })
      .catch(err => toast.error("Error al cargar periodos"));
  }, []);

  // Cargar respuestas cuando cambia el periodo seleccionado
  useEffect(() => {
    if (selectedPeriodoId) {
      setIsLoadingRespuestas(true);
      fetchRespuestasFormulario(Number(selectedPeriodoId))
        .then(setRespuestas)
        .catch(err => {
          console.error(err);
          toast.error("No se pudieron cargar las respuestas del formulario");
          setRespuestas([]);
        })
        .finally(() => setIsLoadingRespuestas(false));
    }
  }, [selectedPeriodoId]);

  // Filtrar respuestas
  const filteredRespuestas = respuestas.filter(r => 
    r.nombreEstudiante.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.apellidosEstudiante.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.codigoEstudiante.includes(searchTerm) ||
    r.programaNombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'SIN_PROCESAR': return 'secondary';
      case 'VALIDO': return 'default';
      case 'DUPLICADO': return 'destructive';
      case 'FORMATO_INVALIDO': return 'outline';
      default: return 'secondary';
    }
  };

  // Funciones mock existentes (mantener o adaptar según necesidad)
  const handleFileUpload = () => {
    setIsProcessing(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          toast.success('Archivo procesado exitosamente');
          return 100;
        }
        return prev + 20;
      });
    }, 500);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b bg-gradient-to-r from-[#003366]/5 to-[#FDB913]/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#003366]">Procesamiento de Estudiantes</h1>
            <p className="text-muted-foreground">Validación de respuestas y clasificación de estudiantes</p>
          </div>
          
          {/* Selector de Periodo Global para el Módulo */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Periodo:</span>
            <Select value={selectedPeriodoId} onValueChange={setSelectedPeriodoId}>
              <SelectTrigger className="w-48 bg-white">
                <SelectValue placeholder="Seleccione periodo" />
              </SelectTrigger>
              <SelectContent>
                {periodos.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.semestre} ({p.estado})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-6 pt-6 border-b">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl">
              <TabsTrigger value="respuestas">Respuestas del Formulario</TabsTrigger>
              <TabsTrigger value="clasificacion">Clasificación</TabsTrigger>
              <TabsTrigger value="simca">Lotes SIMCA</TabsTrigger>
            </TabsList>
          </div>

          {/* PESTAÑA 1: RESPUESTAS DEL FORMULARIO (NUEVO) */}
          <TabsContent value="respuestas" className="flex-1 overflow-hidden p-6 space-y-4">
             <Card className="h-full flex flex-col overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>Respuestas Recibidas ({filteredRespuestas.length})</CardTitle>
                    <div className="relative w-72">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre, código o programa..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {isLoadingRespuestas ? (
                    <div className="flex justify-center items-center h-40">
                      <p className="text-muted-foreground">Cargando respuestas...</p>
                    </div>
                  ) : filteredRespuestas.length === 0 ? (
                    <div className="text-center py-10">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No se encontraron respuestas para este periodo o búsqueda.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead>Estudiante</TableHead>
                          <TableHead>Programa</TableHead>
                          <TableHead>Opciones Seleccionadas</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRespuestas.map((respuesta) => (
                          <TableRow key={respuesta.id}>
                            <TableCell className="whitespace-nowrap text-xs">
                              {new Date(respuesta.timestampRespuesta).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-medium">{respuesta.codigoEstudiante}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{respuesta.nombreEstudiante} {respuesta.apellidosEstudiante}</span>
                                <span className="text-xs text-muted-foreground">{respuesta.correoEstudiante}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{respuesta.programaNombre || 'Sin programa'}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {respuesta.electivasSeleccionadas.map((op, idx) => (
                                  <div key={idx} className="text-xs flex gap-1">
                                    <span className="font-semibold text-muted-foreground">{op.opcionNum}.</span>
                                    <span>{op.nombreElectiva}</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getEstadoBadgeVariant(respuesta.estado)}>
                                {respuesta.estado}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
             </Card>
          </TabsContent>

          {/* PESTAÑA 2: CLASIFICACIÓN (MANTENIDO/MOCK) */}
          <TabsContent value="clasificacion" className="flex-1 overflow-y-auto p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cargar Archivo de Estudiantes (SIMCA)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      Sube un archivo Excel con la información de los estudiantes para cruzar con las respuestas.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleFileUpload}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isProcessing ? 'Procesando...' : 'Cargar Archivo SIMCA'}
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Plantilla
                    </Button>
                  </div>
                  
                  {isProcessing && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="w-full" />
                      <p className="text-sm text-muted-foreground text-center">
                        Procesando archivo... {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Aquí irían los mocks de estadísticas de clasificación que tenías antes */}
          </TabsContent>

          {/* PESTAÑA 3: LOTES SIMCA (MANTENIDO/MOCK) */}
          <TabsContent value="simca" className="flex-1 overflow-y-auto p-6">
             <div className="text-center py-10 text-muted-foreground">
                Funcionalidad de generación de lotes en desarrollo...
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}