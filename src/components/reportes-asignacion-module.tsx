import { useState } from 'react';
import { Download, FileSpreadsheet, Users, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

interface EstudianteAsignado {
  id: string;
  codigo: string;
  nombre: string;
  programa: string;
  prioridad: number;
  fechaAsignacion: string;
  posicion?: number;
}

interface ElectivaReporte {
  id: string;
  nombre: string;
  codigo: string;
  cupoTotal: number;
  asignados: EstudianteAsignado[];
  listaEspera: EstudianteAsignado[];
}

interface ConsolidadoElectiva {
  id: string;
  nombre: string;
  codigo: string;
  cupoTotal: number;
  numeroAsignados: number;
  numeroEspera: number;
  porcentajeOcupacion: number;
}

const mockPeriodos = [
  { id: '1', nombre: 'Periodo 2024-1' },
  { id: '2', nombre: 'Periodo 2024-2' },
  { id: '3', nombre: 'Periodo 2023-2' }
];

const mockElectivasReporte: ElectivaReporte[] = [
  {
    id: '1',
    nombre: 'Inteligencia Artificial',
    codigo: 'IA-101',
    cupoTotal: 25,
    asignados: [
      { id: '1', codigo: '20201001', nombre: 'Juan Carlos Pérez', programa: 'Ingeniería de Sistemas', prioridad: 1, fechaAsignacion: '2024-01-20' },
      { id: '2', codigo: '20201002', nombre: 'María Elena García', programa: 'Ingeniería de Sistemas', prioridad: 1, fechaAsignacion: '2024-01-20' },
      { id: '3', codigo: '20201003', nombre: 'Pedro López', programa: 'Ingeniería Industrial', prioridad: 2, fechaAsignacion: '2024-01-21' },
      { id: '4', codigo: '20201004', nombre: 'Ana Sofía Martínez', programa: 'Ingeniería de Sistemas', prioridad: 1, fechaAsignacion: '2024-01-20' },
      { id: '5', codigo: '20201005', nombre: 'Carlos Rodriguez', programa: 'Ingeniería Civil', prioridad: 3, fechaAsignacion: '2024-01-22' }
    ],
    listaEspera: [
      { id: '6', codigo: '20201006', nombre: 'Laura González', programa: 'Ingeniería de Sistemas', prioridad: 1, fechaAsignacion: '2024-01-23', posicion: 1 },
      { id: '7', codigo: '20201007', nombre: 'Miguel Ángel Torres', programa: 'Ingeniería Industrial', prioridad: 2, fechaAsignacion: '2024-01-23', posicion: 2 },
      { id: '8', codigo: '20201008', nombre: 'Diana Patricia Silva', programa: 'Ingeniería Civil', prioridad: 1, fechaAsignacion: '2024-01-24', posicion: 3 }
    ]
  },
  {
    id: '2',
    nombre: 'Gestión de Proyectos',
    codigo: 'GP-102',
    cupoTotal: 20,
    asignados: [
      { id: '9', codigo: '20201009', nombre: 'Roberto Jiménez', programa: 'Ingeniería Industrial', prioridad: 1, fechaAsignacion: '2024-01-20' },
      { id: '10', codigo: '20201010', nombre: 'Alejandra Vásquez', programa: 'Ingeniería Civil', prioridad: 1, fechaAsignacion: '2024-01-20' }
    ],
    listaEspera: [
      { id: '11', codigo: '20201011', nombre: 'Fernando Castro', programa: 'Ingeniería de Sistemas', prioridad: 3, fechaAsignacion: '2024-01-25', posicion: 1 }
    ]
  }
];

const consolidadoData: ConsolidadoElectiva[] = mockElectivasReporte.map(electiva => ({
  id: electiva.id,
  nombre: electiva.nombre,
  codigo: electiva.codigo,
  cupoTotal: electiva.cupoTotal,
  numeroAsignados: electiva.asignados.length,
  numeroEspera: electiva.listaEspera.length,
  porcentajeOcupacion: Math.round((electiva.asignados.length / electiva.cupoTotal) * 100)
}));

export function ReportesAsignacionModule() {
  const [selectedPeriodo, setSelectedPeriodo] = useState('1');
  const [selectedElectiva, setSelectedElectiva] = useState('1');
  const [activeReporte, setActiveReporte] = useState('por-electiva');

  const electivaSeleccionada = mockElectivasReporte.find(e => e.id === selectedElectiva);

  const handleExportarElectiva = () => {
    toast.success(`Exportando reporte de ${electivaSeleccionada?.nombre} a Excel`);
  };

  const handleExportarConsolidado = () => {
    toast.success('Exportando reporte consolidado a Excel');
  };

  const getPrioridadBadge = (prioridad: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-red-100 text-red-800'
    };
    return colors[prioridad as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      <Tabs value={activeReporte} onValueChange={setActiveReporte}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="por-electiva">Reportes por Electiva</TabsTrigger>
          <TabsTrigger value="consolidado">Reporte Consolidado</TabsTrigger>
        </TabsList>

        <TabsContent value="por-electiva" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Reporte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Período Académico</label>
                  <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPeriodos.map(periodo => (
                        <SelectItem key={periodo.id} value={periodo.id}>
                          {periodo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Electiva</label>
                  <Select value={selectedElectiva} onValueChange={setSelectedElectiva}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockElectivasReporte.map(electiva => (
                        <SelectItem key={electiva.id} value={electiva.id}>
                          {electiva.codigo} - {electiva.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de la electiva */}
          {electivaSeleccionada && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{electivaSeleccionada.nombre}</CardTitle>
                    <p className="text-sm text-muted-foreground">{electivaSeleccionada.codigo}</p>
                  </div>
                  <Button onClick={handleExportarElectiva}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar a Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{electivaSeleccionada.cupoTotal}</div>
                    <p className="text-sm text-muted-foreground">Cupo Total</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{electivaSeleccionada.asignados.length}</div>
                    <p className="text-sm text-muted-foreground">Estudiantes Asignados</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{electivaSeleccionada.listaEspera.length}</div>
                    <p className="text-sm text-muted-foreground">En Lista de Espera</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pestañas de estudiantes */}
          {electivaSeleccionada && (
            <Tabs defaultValue="asignados">
              <TabsList>
                <TabsTrigger value="asignados" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Estudiantes Asignados ({electivaSeleccionada.asignados.length})</span>
                </TabsTrigger>
                <TabsTrigger value="espera" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Lista de Espera ({electivaSeleccionada.listaEspera.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="asignados">
                <Card>
                  <CardHeader>
                    <CardTitle>Estudiantes Asignados (Puestos 1-{electivaSeleccionada.cupoTotal})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {electivaSeleccionada.asignados.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Programa</TableHead>
                            <TableHead>Prioridad</TableHead>
                            <TableHead>Fecha Asignación</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {electivaSeleccionada.asignados.map((estudiante, index) => (
                            <TableRow key={estudiante.id}>
                              <TableCell className="font-medium">{estudiante.codigo}</TableCell>
                              <TableCell>{estudiante.nombre}</TableCell>
                              <TableCell>{estudiante.programa}</TableCell>
                              <TableCell>
                                <Badge className={getPrioridadBadge(estudiante.prioridad)}>
                                  Opción {estudiante.prioridad}
                                </Badge>
                              </TableCell>
                              <TableCell>{estudiante.fechaAsignacion}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No hay estudiantes asignados</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="espera">
                <Card>
                  <CardHeader>
                    <CardTitle>Lista de Espera (Puestos {electivaSeleccionada.cupoTotal + 1}+)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {electivaSeleccionada.listaEspera.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Posición</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Programa</TableHead>
                            <TableHead>Prioridad</TableHead>
                            <TableHead>Fecha Solicitud</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {electivaSeleccionada.listaEspera.map((estudiante) => (
                            <TableRow key={estudiante.id}>
                              <TableCell>
                                <Badge variant="outline">#{estudiante.posicion}</Badge>
                              </TableCell>
                              <TableCell className="font-medium">{estudiante.codigo}</TableCell>
                              <TableCell>{estudiante.nombre}</TableCell>
                              <TableCell>{estudiante.programa}</TableCell>
                              <TableCell>
                                <Badge className={getPrioridadBadge(estudiante.prioridad)}>
                                  Opción {estudiante.prioridad}
                                </Badge>
                              </TableCell>
                              <TableCell>{estudiante.fechaAsignacion}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No hay estudiantes en lista de espera</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="consolidado" className="space-y-6">
          {/* Filtro de período */}
          <Card>
            <CardHeader>
              <CardTitle>Reporte Consolidado de Asignaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium">Período:</label>
                  <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPeriodos.map(periodo => (
                        <SelectItem key={periodo.id} value={periodo.id}>
                          {periodo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleExportarConsolidado} size="lg">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Consolidado a Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabla consolidada */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Todas las Electivas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre de Electiva</TableHead>
                    <TableHead>Cupo Total</TableHead>
                    <TableHead>N° Asignados</TableHead>
                    <TableHead>N° en Lista de Espera</TableHead>
                    <TableHead>% Ocupación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consolidadoData.map((electiva) => (
                    <TableRow key={electiva.id}>
                      <TableCell className="font-medium">{electiva.codigo}</TableCell>
                      <TableCell>{electiva.nombre}</TableCell>
                      <TableCell>{electiva.cupoTotal}</TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">{electiva.numeroAsignados}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-orange-600">{electiva.numeroEspera}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${electiva.porcentajeOcupacion}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{electiva.porcentajeOcupacion}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={electiva.porcentajeOcupacion === 100 ? 'default' : 
                                      electiva.porcentajeOcupacion >= 80 ? 'secondary' : 'outline'}>
                          {electiva.porcentajeOcupacion === 100 ? 'Completo' :
                           electiva.porcentajeOcupacion >= 80 ? 'Casi lleno' : 'Disponible'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{consolidadoData.length}</div>
                  <p className="text-sm text-muted-foreground">Total Electivas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {consolidadoData.reduce((sum, e) => sum + e.numeroAsignados, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Asignados</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {consolidadoData.reduce((sum, e) => sum + e.numeroEspera, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total en Espera</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(consolidadoData.reduce((sum, e) => sum + e.porcentajeOcupacion, 0) / consolidadoData.length)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Ocupación Promedio</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}