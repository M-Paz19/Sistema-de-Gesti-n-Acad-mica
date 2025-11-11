import { useState } from 'react';
import { Upload, Download, Users, AlertCircle, CheckCircle, HelpCircle, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';

interface Estudiante {
  id: string;
  codigo: string;
  nombre: string;
  programa: string;
  creditos: number;
  semestreActual: number;
  promedio: number;
  clasificacion: 'CUMPLE' | 'NO_CUMPLE' | 'POSIBLE_NIVELADO' | 'FORMATO_DESCONOCIDO';
  razon?: string;
}

interface LoteSIMCA {
  id: string;
  nombre: string;
  programa: string;
  estudiantes: number;
  fechaGeneracion: string;
  estado: 'GENERADO' | 'DESCARGADO';
}

const mockEstudiantes: Estudiante[] = [
  {
    id: '1',
    codigo: '20201001',
    nombre: 'Juan Carlos Pérez',
    programa: 'Ingeniería de Sistemas',
    creditos: 120,
    semestreActual: 8,
    promedio: 4.2,
    clasificacion: 'CUMPLE'
  },
  {
    id: '2',
    codigo: '20191002',
    nombre: 'María Elena García',
    programa: 'Ingeniería Civil',
    creditos: 95,
    semestreActual: 6,
    promedio: 3.8,
    clasificacion: 'CUMPLE'
  },
  {
    id: '3',
    codigo: '20211003',
    nombre: 'Pedro Alejandro López',
    programa: 'Ingeniería Industrial',
    creditos: 45,
    semestreActual: 3,
    promedio: 3.1,
    clasificacion: 'NO_CUMPLE',
    razon: 'Créditos insuficientes para electiva'
  },
  {
    id: '4',
    codigo: '20201004',
    nombre: 'Ana Sofía Martínez',
    programa: 'Ingeniería de Sistemas',
    creditos: 110,
    semestreActual: 7,
    promedio: 4.5,
    clasificacion: 'CUMPLE'
  },
  {
    id: '5',
    codigo: 'FORMATO_ERR',
    nombre: 'Estudiante con Error',
    programa: 'Programa Desconocido',
    creditos: 0,
    semestreActual: 0,
    promedio: 0,
    clasificacion: 'FORMATO_DESCONOCIDO',
    razon: 'Datos incompletos en el archivo'
  },
  {
    id: '6',
    codigo: '20201005',
    nombre: 'Luis Fernando Ramírez',
    programa: 'Ingeniería de Sistemas',
    creditos: 85,
    semestreActual: 6,
    promedio: 3.3,
    clasificacion: 'POSIBLE_NIVELADO',
    razon: 'Pendiente subir el plan académico del estudiante'
  }
];

const mockLotesSIMCA: LoteSIMCA[] = [
  {
    id: '1',
    nombre: 'Lote Sistemas 2024-1',
    programa: 'Ingeniería de Sistemas',
    estudiantes: 25,
    fechaGeneracion: '2024-01-15',
    estado: 'DESCARGADO'
  },
  {
    id: '2',
    nombre: 'Lote Civil 2024-1',
    programa: 'Ingeniería Civil',
    estudiantes: 18,
    fechaGeneracion: '2024-01-15',
    estado: 'GENERADO'
  },
  {
    id: '3',
    nombre: 'Lote Industrial 2024-1',
    programa: 'Ingeniería Industrial',
    estudiantes: 12,
    fechaGeneracion: '2024-01-16',
    estado: 'GENERADO'
  }
];

export function ProcesamientoModule() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>(mockEstudiantes);
  const [lotesSIMCA, setLotesSIMCA] = useState<LoteSIMCA[]>(mockLotesSIMCA);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedPrograma, setSelectedPrograma] = useState<string>('TODOS');
  const [activeTab, setActiveTab] = useState('clasificacion');

  const programas = ['Ingeniería de Sistemas', 'Ingeniería Civil', 'Ingeniería Industrial'];

  const getEstudiantesPorClasificacion = () => {
    const cumple = estudiantes.filter(e => e.clasificacion === 'CUMPLE').length;
    const noCumple = estudiantes.filter(e => e.clasificacion === 'NO_CUMPLE').length;
    const posibleNivelado = estudiantes.filter(e => e.clasificacion === 'POSIBLE_NIVELADO').length;
    const formatoDesconocido = estudiantes.filter(e => e.clasificacion === 'FORMATO_DESCONOCIDO').length;
    
    return { cumple, noCumple, posibleNivelado, formatoDesconocido };
  };

  const getClasificacionBadgeVariant = (clasificacion: string) => {
    switch (clasificacion) {
      case 'CUMPLE': return 'default';
      case 'NO_CUMPLE': return 'destructive';
      case 'POSIBLE_NIVELADO': return 'outline';
      case 'FORMATO_DESCONOCIDO': return 'secondary';
      default: return 'secondary';
    }
  };

  const getClasificacionIcon = (clasificacion: string) => {
    switch (clasificacion) {
      case 'CUMPLE': return CheckCircle;
      case 'NO_CUMPLE': return AlertCircle;
      case 'POSIBLE_NIVELADO': return HelpCircle;
      case 'FORMATO_DESCONOCIDO': return HelpCircle;
      default: return HelpCircle;
    }
  };

  const handleFileUpload = () => {
    setIsProcessing(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          toast.success('Archivo procesado exitosamente');
          setActiveTab('clasificacion');
          return 100;
        }
        return prev + 20;
      });
    }, 500);
  };

  const generateLoteSIMCA = (programa: string) => {
    const estudiantesCumplen = estudiantes.filter(e => 
      e.clasificacion === 'CUMPLE' && 
      (programa === 'TODOS' || e.programa === programa)
    );

    if (estudiantesCumplen.length === 0) {
      toast.error('No hay estudiantes que cumplan los requisitos para este programa');
      return;
    }

    const newLote: LoteSIMCA = {
      id: Date.now().toString(),
      nombre: `Lote ${programa} ${new Date().toISOString().split('T')[0]}`,
      programa: programa,
      estudiantes: estudiantesCumplen.length,
      fechaGeneracion: new Date().toISOString().split('T')[0],
      estado: 'GENERADO'
    };

    setLotesSIMCA(prev => [...prev, newLote]);
    toast.success(`Lote SIMCA generado para ${programa}`);
  };

  const downloadLote = (loteId: string) => {
    setLotesSIMCA(prev => prev.map(l => 
      l.id === loteId 
        ? { ...l, estado: 'DESCARGADO' as const }
        : l
    ));
    toast.success('Lote descargado exitosamente');
  };

  const filteredEstudiantes = selectedPrograma === 'TODOS' 
    ? estudiantes 
    : estudiantes.filter(e => e.programa === selectedPrograma);

  const stats = getEstudiantesPorClasificacion();

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div>
          <h1>Procesamiento de Estudiantes</h1>
          <p className="text-muted-foreground">Clasifica estudiantes y genera lotes para SIMCA</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-6 pt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="clasificacion">Clasificación de Estudiantes</TabsTrigger>
              <TabsTrigger value="simca">Generación de Lotes SIMCA</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="clasificacion" className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Carga de archivo */}
            <Card>
              <CardHeader>
                <CardTitle>Cargar Archivo de Estudiantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      Sube un archivo Excel con la información de los estudiantes. El sistema clasificará automáticamente cada estudiante según los criterios establecidos.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleFileUpload}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isProcessing ? 'Procesando...' : 'Cargar Archivo Excel'}
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Plantilla Excel
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

            {/* Estadísticas de clasificación */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Cumplen Requisitos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.cumple}</div>
                  <p className="text-sm text-muted-foreground">estudiantes elegibles</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center text-red-600">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    No Cumplen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.noCumple}</div>
                  <p className="text-sm text-muted-foreground">estudiantes no elegibles</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center text-orange-600">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Posible Nivelado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.posibleNivelado}</div>
                  <p className="text-sm text-muted-foreground">pendiente plan académico</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center text-yellow-600">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Formato Desconocido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.formatoDesconocido}</div>
                  <p className="text-sm text-muted-foreground">requieren revisión</p>
                </CardContent>
              </Card>
            </div>

            {/* Filtros y tabla de estudiantes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Estudiantes Clasificados ({filteredEstudiantes.length})</CardTitle>
                  <Select value={selectedPrograma} onValueChange={setSelectedPrograma}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos los programas</SelectItem>
                      {programas.map(programa => (
                        <SelectItem key={programa} value={programa}>{programa}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Programa</TableHead>
                      <TableHead>Créditos</TableHead>
                      <TableHead>Semestre</TableHead>
                      <TableHead>Promedio</TableHead>
                      <TableHead>Clasificación</TableHead>
                      <TableHead>Observaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEstudiantes.map((estudiante) => {
                      const Icon = getClasificacionIcon(estudiante.clasificacion);
                      return (
                        <TableRow key={estudiante.id}>
                          <TableCell className="font-medium">{estudiante.codigo}</TableCell>
                          <TableCell>{estudiante.nombre}</TableCell>
                          <TableCell>{estudiante.programa}</TableCell>
                          <TableCell>{estudiante.creditos}</TableCell>
                          <TableCell>{estudiante.semestreActual}</TableCell>
                          <TableCell>{estudiante.promedio.toFixed(1)}</TableCell>
                          <TableCell>
                            <Badge variant={getClasificacionBadgeVariant(estudiante.clasificacion)}>
                              <Icon className="h-3 w-3 mr-1" />
                              {estudiante.clasificacion.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {estudiante.razon || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {filteredEstudiantes.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay estudiantes para mostrar</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botón para continuar */}
            <div className="flex justify-end">
              <Button size="lg" onClick={() => toast.success('Redirigiendo a Asignación de Electivas...')}>
                Continuar a Asignación de Electivas →
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="simca" className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Generación de lotes */}
            <Card>
              <CardHeader>
                <CardTitle>Generar Lotes SIMCA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      Genera lotes SIMCA con los estudiantes que cumplen los requisitos para inscripción de electivas. Cada lote se puede descargar individualmente.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Button 
                      onClick={() => generateLoteSIMCA('TODOS')}
                      variant="outline"
                    >
                      Generar Todos
                    </Button>
                    {programas.map(programa => (
                      <Button 
                        key={programa}
                        onClick={() => generateLoteSIMCA(programa)}
                        variant="outline"
                      >
                        {programa.split(' ')[1]} {/* Mostrar solo "Sistemas", "Civil", etc. */}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de lotes generados */}
            <Card>
              <CardHeader>
                <CardTitle>Lotes SIMCA Generados ({lotesSIMCA.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {lotesSIMCA.length > 0 ? (
                  <div className="space-y-3">
                    {lotesSIMCA.map((lote) => (
                      <div key={lote.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{lote.nombre}</h4>
                            <Badge variant={lote.estado === 'DESCARGADO' ? 'default' : 'secondary'}>
                              {lote.estado}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <span>{lote.programa}</span>
                            <span className="mx-2">•</span>
                            <span>{lote.estudiantes} estudiantes</span>
                            <span className="mx-2">•</span>
                            <span>Generado: {lote.fechaGeneracion}</span>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => downloadLote(lote.id)}
                          disabled={lote.estado === 'DESCARGADO'}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {lote.estado === 'DESCARGADO' ? 'Descargado' : 'Descargar'}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay lotes SIMCA generados</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Utiliza los botones de arriba para generar lotes por programa
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estadísticas de lotes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Total Lotes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lotesSIMCA.length}</div>
                  <p className="text-sm text-muted-foreground">lotes generados</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Estudiantes Procesados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {lotesSIMCA.reduce((sum, lote) => sum + lote.estudiantes, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">en todos los lotes</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Lotes Descargados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {lotesSIMCA.filter(l => l.estado === 'DESCARGADO').length}
                  </div>
                  <p className="text-sm text-muted-foreground">de {lotesSIMCA.length} total</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}