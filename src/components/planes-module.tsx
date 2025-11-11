import { useState } from 'react';
import { Plus, Search, Upload, Download, Eye, Edit } from 'lucide-react';
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

interface Plan {
  id: string;
  nombre: string;
  version: string;
  programa: string;
  año: number;
  estado: 'ACTIVO' | 'INACTIVO' | 'BORRADOR';
  fechaCreacion: string;
  totalCreditos: number;
  materiasCount: number;
  mallaCargar?: boolean;
}

interface Materia {
  id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  semestre: number;
  prerequisitos: string[];
  tipo: 'OBLIGATORIA' | 'ELECTIVA' | 'PRACTICA';
}

const mockPlanes: Plan[] = [
  {
    id: '1',
    nombre: 'Plan de Estudios 2022',
    version: 'v2022.1',
    programa: 'Ingeniería de Sistemas',
    año: 2022,
    estado: 'ACTIVO',
    fechaCreacion: '2022-01-15',
    totalCreditos: 160,
    materiasCount: 52
  },
  {
    id: '2',
    nombre: 'Plan de Estudios 2023',
    version: 'v2023.1',
    programa: 'Ingeniería Civil',
    año: 2023,
    estado: 'ACTIVO',
    fechaCreacion: '2023-02-10',
    totalCreditos: 170,
    materiasCount: 58
  },
  {
    id: '3',
    nombre: 'Plan de Estudios 2024',
    version: 'v2024.1',
    programa: 'Ingeniería Industrial',
    año: 2024,
    estado: 'BORRADOR',
    fechaCreacion: '2024-01-05',
    totalCreditos: 0,
    materiasCount: 0,
    mallaCargar: true
  }
];

const mockMaterias: Materia[] = [
  {
    id: '1',
    codigo: 'MAT101',
    nombre: 'Cálculo I',
    creditos: 4,
    semestre: 1,
    prerequisitos: [],
    tipo: 'OBLIGATORIA'
  },
  {
    id: '2',
    codigo: 'FIS101',
    nombre: 'Física I',
    creditos: 3,
    semestre: 2,
    prerequisitos: ['MAT101'],
    tipo: 'OBLIGATORIA'
  },
  {
    id: '3',
    codigo: 'ELECT01',
    nombre: 'Electiva Técnica I',
    creditos: 3,
    semestre: 7,
    prerequisitos: [],
    tipo: 'ELECTIVA'
  }
];

export function PlanesModule() {
  const [planes, setPlanes] = useState<Plan[]>(mockPlanes);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingMalla, setIsUploadingMalla] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filtroPrograma, setFiltroPrograma] = useState<string>('TODOS');
  const [showReglasModal, setShowReglasModal] = useState(false);
  const [currentPlanForReglas, setCurrentPlanForReglas] = useState<string | null>(null);
  const [reglasNivelacion, setReglasNivelacion] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    version: '',
    programa: '',
    año: new Date().getFullYear()
  });

  const programas = ['Ingeniería de Sistemas', 'Ingeniería Civil', 'Ingeniería Industrial'];

  const filteredPlanes = planes.filter(plan => {
    const matchesSearch = plan.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.version.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrograma = filtroPrograma === 'TODOS' || plan.programa === filtroPrograma;
    return matchesSearch && matchesPrograma;
  });

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'ACTIVO': return 'default';
      case 'BORRADOR': return 'secondary';
      case 'INACTIVO': return 'outline';
      default: return 'secondary';
    }
  };

  const handleSubmit = () => {
    if (!formData.nombre || !formData.version || !formData.programa) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    const newPlan: Plan = {
      id: Date.now().toString(),
      ...formData,
      estado: 'BORRADOR',
      fechaCreacion: new Date().toISOString().split('T')[0],
      totalCreditos: 0,
      materiasCount: 0,
      mallaCargar: true
    };

    setPlanes(prev => [...prev, newPlan]);
    toast.success('Plan de estudios creado exitosamente');
    setIsCreating(false);
    setFormData({
      nombre: '',
      version: '',
      programa: '',
      año: new Date().getFullYear()
    });
  };

  const handleFileUpload = (planId: string) => {
    setCurrentPlanForReglas(planId);
    setIsUploadingMalla(true);
    setUploadProgress(0);

    // Simular carga de archivo
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploadingMalla(false);
          // Mostrar modal de reglas de nivelación
          setShowReglasModal(true);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleSaveReglasNivelacion = () => {
    if (!currentPlanForReglas) return;
    
    // Actualizar el plan con los datos de la malla y reglas
    setPlanes(prevPlanes => prevPlanes.map(p => 
      p.id === currentPlanForReglas 
        ? { 
            ...p, 
            totalCreditos: 160, 
            materiasCount: 52, 
            mallaCargar: false,
            estado: 'ACTIVO' as const
          }
        : p
    ));
    
    toast.success('Malla curricular y reglas de nivelación guardadas exitosamente');
    setShowReglasModal(false);
    setReglasNivelacion('');
    setCurrentPlanForReglas(null);
  };

  const generateTemplate = () => {
    // En una implementación real, esto generaría y descargaría un archivo Excel
    toast.success('Plantilla de Excel descargada');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1>Gestión de Planes de Estudio</h1>
            <p className="text-muted-foreground">Administra los planes académicos y mallas curriculares</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={generateTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Plantilla Excel
            </Button>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
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
                        placeholder="Ej: v2024.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="año">Año *</Label>
                      <Input
                        id="año"
                        type="number"
                        value={formData.año}
                        onChange={(e) => setFormData(prev => ({ ...prev, año: parseInt(e.target.value) }))}
                        min="2020"
                        max="2030"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="programa">Programa *</Label>
                    <Select value={formData.programa} onValueChange={(value) => setFormData(prev => ({ ...prev, programa: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona programa" />
                      </SelectTrigger>
                      <SelectContent>
                        {programas.map(programa => (
                          <SelectItem key={programa} value={programa}>{programa}</SelectItem>
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

      <div className="flex-1 overflow-hidden">
        {!selectedPlan ? (
          <div className="p-6 space-y-4 h-full overflow-y-auto">
            <div className="flex space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar planes..."
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
                  {programas.map(programa => (
                    <SelectItem key={programa} value={programa}>{programa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPlanes.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.nombre}</CardTitle>
                        <p className="text-sm text-muted-foreground">{plan.version}</p>
                      </div>
                      <Badge variant={getEstadoBadgeVariant(plan.estado)}>
                        {plan.estado}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><span className="font-medium">Programa:</span> {plan.programa}</p>
                      <p><span className="font-medium">Año:</span> {plan.año}</p>
                      <p><span className="font-medium">Créditos:</span> {plan.totalCreditos}</p>
                      <p><span className="font-medium">Materias:</span> {plan.materiasCount}</p>
                      <p><span className="font-medium">Creado:</span> {plan.fechaCreacion}</p>
                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                      {plan.mallaCargar ? (
                        <div className="w-full space-y-2">
                          <Alert>
                            <AlertDescription>
                              Este plan necesita una malla curricular
                            </AlertDescription>
                          </Alert>
                          <Button 
                            className="w-full" 
                            onClick={() => handleFileUpload(plan.id)}
                            disabled={isUploadingMalla}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploadingMalla ? 'Cargando...' : 'Cargar Malla Excel'}
                          </Button>
                          {isUploadingMalla && (
                            <div className="space-y-1">
                              <Progress value={uploadProgress} className="w-full" />
                              <p className="text-sm text-muted-foreground text-center">
                                {uploadProgress}% completado
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => setSelectedPlan(plan)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Malla
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPlanes.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron planes que coincidan con los filtros.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => setSelectedPlan(null)}>
                    ← Volver
                  </Button>
                  <h2>{selectedPlan.nombre}</h2>
                  <Badge variant={getEstadoBadgeVariant(selectedPlan.estado)}>
                    {selectedPlan.estado}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {selectedPlan.programa} - {selectedPlan.version}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total de créditos</p>
                <p className="text-2xl font-bold">{selectedPlan.totalCreditos}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Materias Obligatorias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mockMaterias.filter(m => m.tipo === 'OBLIGATORIA').length}
                  </div>
                  <p className="text-sm text-muted-foreground">materias</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Electivas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mockMaterias.filter(m => m.tipo === 'ELECTIVA').length}
                  </div>
                  <p className="text-sm text-muted-foreground">materias</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Prácticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mockMaterias.filter(m => m.tipo === 'PRACTICA').length}
                  </div>
                  <p className="text-sm text-muted-foreground">materias</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Malla Curricular</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Materia</TableHead>
                      <TableHead>Créditos</TableHead>
                      <TableHead>Semestre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Prerequisitos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockMaterias.map((materia) => (
                      <TableRow key={materia.id}>
                        <TableCell className="font-medium">{materia.codigo}</TableCell>
                        <TableCell>{materia.nombre}</TableCell>
                        <TableCell>{materia.creditos}</TableCell>
                        <TableCell>{materia.semestre}</TableCell>
                        <TableCell>
                          <Badge variant={
                            materia.tipo === 'OBLIGATORIA' ? 'default' : 
                            materia.tipo === 'ELECTIVA' ? 'secondary' : 'outline'
                          }>
                            {materia.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {materia.prerequisitos.length > 0 ? 
                            materia.prerequisitos.join(', ') : 
                            'Ninguno'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de Reglas de Nivelación */}
      <Dialog open={showReglasModal} onOpenChange={setShowReglasModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reglas de Nivelación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Define las reglas de nivelación que se aplicarán para identificar estudiantes que requieren nivelación académica.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="reglas">Reglas de Nivelación</Label>
              <Textarea
                id="reglas"
                value={reglasNivelacion}
                onChange={(e) => setReglasNivelacion(e.target.value)}
                placeholder="Ejemplo: Estudiante con promedio menor a 3.5 o con más de 2 materias pendientes..."
                rows={6}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setShowReglasModal(false);
                setReglasNivelacion('');
                setCurrentPlanForReglas(null);
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSaveReglasNivelacion}>
                Guardar y Continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}