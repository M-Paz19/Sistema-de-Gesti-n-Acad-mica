import { useState } from 'react';
import { Search, Download, User, GraduationCap, Calendar, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';

interface HistorialEstudiante {
  periodo: string;
  electivasAsignadas: Array<{
    codigo: string;
    nombre: string;
    estado: 'ASIGNADA' | 'COMPLETADA' | 'CANCELADA';
    nota?: number;
  }>;
}

interface EstudianteBusqueda {
  id: string;
  codigo: string;
  nombre: string;
  programa: string;
  semestre: number;
  historial: HistorialEstudiante[];
}

interface AsignacionPrograma {
  electiva: {
    codigo: string;
    nombre: string;
  };
  asignados: number;
  listaEspera: number;
  cupoTotal: number;
  porcentajeOcupacion: number;
}

const mockEstudiantes: EstudianteBusqueda[] = [
  {
    id: '1',
    codigo: '20201001',
    nombre: 'Juan Carlos Pérez Rodríguez',
    programa: 'Ingeniería de Sistemas',
    semestre: 8,
    historial: [
      {
        periodo: '2023-1',
        electivasAsignadas: [
          { codigo: 'IA-101', nombre: 'Inteligencia Artificial', estado: 'COMPLETADA', nota: 4.2 },
          { codigo: 'GP-102', nombre: 'Gestión de Proyectos', estado: 'COMPLETADA', nota: 4.5 }
        ]
      },
      {
        periodo: '2023-2',
        electivasAsignadas: [
          { codigo: 'CS-103', nombre: 'Ciberseguridad', estado: 'COMPLETADA', nota: 3.8 }
        ]
      },
      {
        periodo: '2024-1',
        electivasAsignadas: [
          { codigo: 'ML-104', nombre: 'Machine Learning', estado: 'ASIGNADA' }
        ]
      }
    ]
  },
  {
    id: '2',
    codigo: '20191002',
    nombre: 'María Elena García Silva',
    programa: 'Ingeniería Civil',
    semestre: 9,
    historial: [
      {
        periodo: '2022-2',
        electivasAsignadas: [
          { codigo: 'GP-102', nombre: 'Gestión de Proyectos', estado: 'COMPLETADA', nota: 4.8 }
        ]
      },
      {
        periodo: '2023-1',
        electivasAsignadas: [
          { codigo: 'DW-105', nombre: 'Desarrollo Web', estado: 'COMPLETADA', nota: 4.1 },
          { codigo: 'ROB-106', nombre: 'Robótica', estado: 'CANCELADA' }
        ]
      },
      {
        periodo: '2024-1',
        electivasAsignadas: [
          { codigo: 'IA-101', nombre: 'Inteligencia Artificial', estado: 'ASIGNADA' }
        ]
      }
    ]
  }
];

const mockPeriodos = [
  { id: '1', nombre: 'Periodo 2024-1' },
  { id: '2', nombre: 'Periodo 2024-2' },
  { id: '3', nombre: 'Periodo 2023-2' }
];

const mockProgramas = [
  { id: '1', nombre: 'Ingeniería de Sistemas' },
  { id: '2', nombre: 'Ingeniería Civil' },
  { id: '3', nombre: 'Ingeniería Industrial' }
];

const mockAsignacionesPorPrograma: Record<string, AsignacionPrograma[]> = {
  '1_1': [ // Periodo 2024-1, Ingeniería de Sistemas
    {
      electiva: { codigo: 'IA-101', nombre: 'Inteligencia Artificial' },
      asignados: 28,
      listaEspera: 5,
      cupoTotal: 30,
      porcentajeOcupacion: 93
    },
    {
      electiva: { codigo: 'ML-104', nombre: 'Machine Learning' },
      asignados: 22,
      listaEspera: 8,
      cupoTotal: 25,
      porcentajeOcupacion: 88
    },
    {
      electiva: { codigo: 'CS-103', nombre: 'Ciberseguridad' },
      asignados: 18,
      listaEspera: 2,
      cupoTotal: 20,
      porcentajeOcupacion: 90
    }
  ],
  '1_2': [ // Periodo 2024-1, Ingeniería Civil
    {
      electiva: { codigo: 'GP-102', nombre: 'Gestión de Proyectos' },
      asignados: 20,
      listaEspera: 3,
      cupoTotal: 20,
      porcentajeOcupacion: 100
    },
    {
      electiva: { codigo: 'IA-101', nombre: 'Inteligencia Artificial' },
      asignados: 12,
      listaEspera: 6,
      cupoTotal: 15,
      porcentajeOcupacion: 80
    }
  ],
  '1_3': [ // Periodo 2024-1, Ingeniería Industrial
    {
      electiva: { codigo: 'GP-102', nombre: 'Gestión de Proyectos' },
      asignados: 25,
      listaEspera: 4,
      cupoTotal: 25,
      porcentajeOcupacion: 100
    },
    {
      electiva: { codigo: 'DW-105', nombre: 'Desarrollo Web' },
      asignados: 15,
      listaEspera: 2,
      cupoTotal: 18,
      porcentajeOcupacion: 83
    }
  ]
};

export function ConsultasModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<EstudianteBusqueda | null>(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState('1');
  const [selectedPrograma, setSelectedPrograma] = useState('1');
  const [activeTab, setActiveTab] = useState('historial');

  const filteredStudents = mockEstudiantes.filter(student => 
    student.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const asignacionesPrograma = mockAsignacionesPorPrograma[`${selectedPeriodo}_${selectedPrograma}`] || [];

  const handleSearchStudent = (student: EstudianteBusqueda) => {
    setSelectedStudent(student);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'COMPLETADA': return 'default';
      case 'ASIGNADA': return 'secondary';
      case 'CANCELADA': return 'destructive';
      default: return 'outline';
    }
  };

  const handleExportarHistorial = () => {
    if (selectedStudent) {
      toast.success(`Exportando historial de ${selectedStudent.nombre} a Excel`);
    }
  };

  const handleExportarAsignaciones = () => {
    const programa = mockProgramas.find(p => p.id === selectedPrograma)?.nombre;
    const periodo = mockPeriodos.find(p => p.id === selectedPeriodo)?.nombre;
    toast.success(`Exportando asignaciones de ${programa} - ${periodo} a Excel`);
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="historial" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Historial por Estudiante</span>
          </TabsTrigger>
          <TabsTrigger value="programa" className="flex items-center space-x-2">
            <GraduationCap className="h-4 w-4" />
            <span>Asignaciones por Programa</span>
          </TabsTrigger>
        </TabsList>

        {/* HU4.4: Historial por Estudiante */}
        <TabsContent value="historial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Estudiante</CardTitle>
              <p className="text-sm text-muted-foreground">
                Consulta el historial académico de electivas por estudiante
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código o nombre de estudiante..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {searchTerm && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Resultados de búsqueda:</h4>
                    {filteredStudents.length > 0 ? (
                      <div className="space-y-2">
                        {filteredStudents.map((student) => (
                          <div 
                            key={student.id} 
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                            onClick={() => handleSearchStudent(student)}
                          >
                            <div>
                              <p className="font-medium">{student.nombre}</p>
                              <p className="text-sm text-muted-foreground">
                                {student.codigo} - {student.programa} - Semestre {student.semestre}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              Ver Historial
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No se encontraron estudiantes que coincidan con la búsqueda.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedStudent && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Historial Académico de Electivas</CardTitle>
                    <div className="mt-2 space-y-1">
                      <p><span className="font-medium">Estudiante:</span> {selectedStudent.nombre}</p>
                      <p><span className="font-medium">Código:</span> {selectedStudent.codigo}</p>
                      <p><span className="font-medium">Programa:</span> {selectedStudent.programa}</p>
                      <p><span className="font-medium">Semestre Actual:</span> {selectedStudent.semestre}</p>
                    </div>
                  </div>
                  <Button onClick={handleExportarHistorial}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Historial
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre de Electiva</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Nota Final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedStudent.historial.map((periodo) =>
                      periodo.electivasAsignadas.map((electiva, index) => (
                        <TableRow key={`${periodo.periodo}-${index}`}>
                          {index === 0 && (
                            <TableCell 
                              rowSpan={periodo.electivasAsignadas.length}
                              className="font-medium bg-muted/50"
                            >
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>{periodo.periodo}</span>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="font-medium">{electiva.codigo}</TableCell>
                          <TableCell>{electiva.nombre}</TableCell>
                          <TableCell>
                            <Badge variant={getEstadoBadge(electiva.estado)}>
                              {electiva.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {electiva.nota ? (
                              <span className={electiva.nota >= 3.0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                {electiva.nota.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {selectedStudent.historial.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay historial de electivas para este estudiante</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* HU4.5: Asignaciones por Programa Académico */}
        <TabsContent value="programa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Consulta</CardTitle>
              <p className="text-sm text-muted-foreground">
                Consulta las asignaciones de electivas por programa académico
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
                  <label className="block text-sm font-medium mb-2">Programa Académico</label>
                  <Select value={selectedPrograma} onValueChange={setSelectedPrograma}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProgramas.map(programa => (
                        <SelectItem key={programa.id} value={programa.id}>
                          {programa.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Button onClick={handleExportarAsignaciones} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Datos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Asignaciones para {mockProgramas.find(p => p.id === selectedPrograma)?.nombre}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {mockPeriodos.find(p => p.id === selectedPeriodo)?.nombre}
              </p>
            </CardHeader>
            <CardContent>
              {asignacionesPrograma.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre de Electiva</TableHead>
                        <TableHead>Cupo Total</TableHead>
                        <TableHead>Estudiantes Asignados</TableHead>
                        <TableHead>Lista de Espera</TableHead>
                        <TableHead>% Ocupación</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asignacionesPrograma.map((asignacion, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{asignacion.electiva.codigo}</TableCell>
                          <TableCell>{asignacion.electiva.nombre}</TableCell>
                          <TableCell>{asignacion.cupoTotal}</TableCell>
                          <TableCell>
                            <span className="font-medium text-green-600">{asignacion.asignados}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-orange-600">{asignacion.listaEspera}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${asignacion.porcentajeOcupacion}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{asignacion.porcentajeOcupacion}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={asignacion.porcentajeOcupacion === 100 ? 'default' : 
                                           asignacion.porcentajeOcupacion >= 80 ? 'secondary' : 'outline'}>
                              {asignacion.porcentajeOcupacion === 100 ? 'Completo' :
                               asignacion.porcentajeOcupacion >= 80 ? 'Casi lleno' : 'Disponible'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Resumen estadístico */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-xl font-bold">{asignacionesPrograma.length}</div>
                          <p className="text-sm text-muted-foreground">Electivas Ofertadas</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">
                            {asignacionesPrograma.reduce((sum, a) => sum + a.asignados, 0)}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Asignados</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-orange-600">
                            {asignacionesPrograma.reduce((sum, a) => sum + a.listaEspera, 0)}
                          </div>
                          <p className="text-sm text-muted-foreground">Total en Espera</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-600">
                            {Math.round(asignacionesPrograma.reduce((sum, a) => sum + a.porcentajeOcupacion, 0) / asignacionesPrograma.length)}%
                          </div>
                          <p className="text-sm text-muted-foreground">Ocupación Promedio</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay datos de asignaciones para la combinación de período y programa seleccionada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}