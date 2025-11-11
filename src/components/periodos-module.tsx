import { useState } from 'react';
import { Plus, Search, Edit, Eye, Link, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';

interface Periodo {
  id: string;
  nombre: string;
  año: number;
  semestre: '1' | '2';
  estado: 'CONFIGURACION' | 'ABIERTO' | 'CERRADO';
  fechaInicio: string;
  fechaFin: string;
  enlaceFormulario?: string;
  electivasOfertadas: Array<{
    electivaId: string;
    nombre: string;
    codigo: string;
    cuposPorPrograma: Array<{
      programa: string;
      cupos: number;
      inscritos: number;
    }>;
  }>;
}

const mockElectivas = [
  { id: '1', nombre: 'Inteligencia Artificial', codigo: 'IA-101' },
  { id: '2', nombre: 'Gestión de Proyectos', codigo: 'GP-102' },
  { id: '3', nombre: 'Ciberseguridad', codigo: 'CS-103' },
  { id: '4', nombre: 'Machine Learning', codigo: 'ML-104' },
  { id: '5', nombre: 'Desarrollo Web', codigo: 'DW-105' }
];

const mockPeriodos: Periodo[] = [
  {
    id: '1',
    nombre: 'Periodo 2024-1',
    año: 2024,
    semestre: '1',
    estado: 'ABIERTO',
    fechaInicio: '2024-02-01',
    fechaFin: '2024-06-30',
    enlaceFormulario: 'https://forms.universidad.edu/electivas-2024-1',
    electivasOfertadas: [
      {
        electivaId: '1',
        nombre: 'Inteligencia Artificial',
        codigo: 'IA-101',
        cuposPorPrograma: [
          { programa: 'Ingeniería de Sistemas', cupos: 10, inscritos: 8 },
          { programa: 'Ingeniería Industrial', cupos: 5, inscritos: 4 },
          { programa: 'Ingeniería Civil', cupos: 3, inscritos: 2 }
        ]
      },
      {
        electivaId: '2',
        nombre: 'Gestión de Proyectos',
        codigo: 'GP-102',
        cuposPorPrograma: [
          { programa: 'Ingeniería de Sistemas', cupos: 8, inscritos: 7 },
          { programa: 'Ingeniería Civil', cupos: 6, inscritos: 5 },
          { programa: 'Ingeniería Industrial', cupos: 4, inscritos: 3 }
        ]
      }
    ]
  },
  {
    id: '2',
    nombre: 'Periodo 2024-2',
    año: 2024,
    semestre: '2',
    estado: 'CONFIGURACION',
    fechaInicio: '2024-08-01',
    fechaFin: '2024-12-15',
    electivasOfertadas: [
      {
        electivaId: '3',
        nombre: 'Ciberseguridad',
        codigo: 'CS-103',
        cuposPorPrograma: [
          { programa: 'Ingeniería de Sistemas', cupos: 12, inscritos: 0 },
          { programa: 'Ingeniería Industrial', cupos: 4, inscritos: 0 },
          { programa: 'Ingeniería Civil', cupos: 2, inscritos: 0 }
        ]
      }
    ]
  },
  {
    id: '3',
    nombre: 'Periodo 2023-2',
    año: 2023,
    semestre: '2',
    estado: 'CERRADO',
    fechaInicio: '2023-08-01',
    fechaFin: '2023-12-15',
    electivasOfertadas: []
  }
];

export function PeriodosModule() {
  const [periodos, setPeriodos] = useState<Periodo[]>(mockPeriodos);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState<Periodo | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchElectivas, setSearchElectivas] = useState('');
  const [editingCupos, setEditingCupos] = useState<{electivaId: string, programa: string} | null>(null);
  const [newCupos, setNewCupos] = useState(0);
  const [addingCuposFor, setAddingCuposFor] = useState<{electivaId: string, nombre: string} | null>(null);
  const [cuposPorPrograma, setCuposPorPrograma] = useState<{[programa: string]: number}>({});
  const [formData, setFormData] = useState({
    año: new Date().getFullYear(),
    semestre: '1' as '1' | '2',
    fechaInicio: '',
    fechaFin: ''
  });

  const filteredPeriodos = periodos.filter(periodo => 
    periodo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    periodo.año.toString().includes(searchTerm)
  );

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'CONFIGURACION': return 'secondary'; // azul
      case 'ABIERTO': return 'default'; // verde
      case 'CERRADO': return 'outline';
      default: return 'secondary';
    }
  };

  const getEstadoBadge = (estado: Periodo['estado']) => {
    switch (estado) {
      case 'CONFIGURACION':
        return <Badge className="bg-[#0d4f8b] text-white border-[#0d4f8b] hover:bg-[#003366]">CONFIGURACIÓN</Badge>;
      case 'ABIERTO':
        return <Badge className="bg-[#28a745] text-white border-[#28a745] hover:bg-[#218838]">ABIERTO</Badge>;
      case 'CERRADO':
        return <Badge variant="outline" className="border-[#6c757d] text-[#6c757d]">CERRADO</Badge>;
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    // Keep for backward compatibility but use getEstadoBadge instead
    switch (estado) {
      case 'CONFIGURACION': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'ABIERTO': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'CERRADO': return '';
      default: return '';
    }
  };

  const availableElectivas = mockElectivas.filter(electiva => 
    !selectedPeriodo?.electivasOfertadas.some(ofertada => ofertada.electivaId === electiva.id) &&
    electiva.nombre.toLowerCase().includes(searchElectivas.toLowerCase())
  );

  const handleSubmit = () => {
    if (!formData.fechaInicio || !formData.fechaFin) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    const nombre = `Periodo ${formData.año}-${formData.semestre}`;
    
    const newPeriodo: Periodo = {
      id: Date.now().toString(),
      nombre,
      ...formData,
      estado: 'CONFIGURACION',
      electivasOfertadas: []
    };

    setPeriodos(prev => [...prev, newPeriodo]);
    toast.success('Periodo creado exitosamente');
    setIsCreating(false);
    setFormData({
      año: new Date().getFullYear(),
      semestre: '1',
      fechaInicio: '',
      fechaFin: ''
    });
  };

  const handleInitAddElectiva = (electiva: typeof mockElectivas[0]) => {
    setAddingCuposFor({ electivaId: electiva.id, nombre: electiva.nombre });
    setCuposPorPrograma({});
  };

  const handleConfirmAddElectiva = () => {
    if (!selectedPeriodo || !addingCuposFor) return;

    const programasArray = Object.keys(cuposPorPrograma).map(programa => ({
      programa,
      cupos: cuposPorPrograma[programa] || 0,
      inscritos: 0
    }));

    const totalCupos = Object.values(cuposPorPrograma).reduce((sum, val) => sum + (val || 0), 0);
    
    if (totalCupos !== 18) {
      toast.error('La suma total de cupos debe ser 18');
      return;
    }

    const electiva = mockElectivas.find(e => e.id === addingCuposFor.electivaId);
    if (!electiva) return;

    const newElectivaOfertada = {
      electivaId: electiva.id,
      nombre: electiva.nombre,
      codigo: electiva.codigo,
      cuposPorPrograma: programasArray
    };

    setPeriodos(prev => prev.map(p => 
      p.id === selectedPeriodo.id 
        ? { ...p, electivasOfertadas: [...p.electivasOfertadas, newElectivaOfertada] }
        : p
    ));

    const updatedPeriodo = { ...selectedPeriodo, electivasOfertadas: [...selectedPeriodo.electivasOfertadas, newElectivaOfertada] };
    setSelectedPeriodo(updatedPeriodo);
    toast.success(`${electiva.nombre} agregada al periodo`);
    setAddingCuposFor(null);
    setCuposPorPrograma({});
  };

  const handleAddElectiva = handleInitAddElectiva;

  const handleRemoveElectiva = (electivaId: string) => {
    if (!selectedPeriodo) return;

    setPeriodos(prev => prev.map(p => 
      p.id === selectedPeriodo.id 
        ? { ...p, electivasOfertadas: p.electivasOfertadas.filter(e => e.electivaId !== electivaId) }
        : p
    ));

    const updatedPeriodo = { 
      ...selectedPeriodo, 
      electivasOfertadas: selectedPeriodo.electivasOfertadas.filter(e => e.electivaId !== electivaId) 
    };
    setSelectedPeriodo(updatedPeriodo);
    toast.success('Electiva removida del periodo');
  };

  const handleUpdateCupos = () => {
    if (!selectedPeriodo || !editingCupos) return;

    setPeriodos(prev => prev.map(p => 
      p.id === selectedPeriodo.id 
        ? {
            ...p,
            electivasOfertadas: p.electivasOfertadas.map(e => 
              e.electivaId === editingCupos.electivaId
                ? {
                    ...e,
                    cuposPorPrograma: e.cuposPorPrograma.map(c => 
                      c.programa === editingCupos.programa
                        ? { ...c, cupos: newCupos }
                        : c
                    )
                  }
                : e
            )
          }
        : p
    ));

    const updatedPeriodo = {
      ...selectedPeriodo,
      electivasOfertadas: selectedPeriodo.electivasOfertadas.map(e => 
        e.electivaId === editingCupos.electivaId
          ? {
              ...e,
              cuposPorPrograma: e.cuposPorPrograma.map(c => 
                c.programa === editingCupos.programa
                  ? { ...c, cupos: newCupos }
                  : c
              )
            }
          : e
      )
    };
    setSelectedPeriodo(updatedPeriodo);
    setEditingCupos(null);
    toast.success('Cupos actualizados exitosamente');
  };

  const openEditCupos = (electivaId: string, programa: string, currentCupos: number) => {
    setEditingCupos({ electivaId, programa });
    setNewCupos(currentCupos);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b bg-gradient-to-r from-[#003366]/5 to-[#FDB913]/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#003366]">Gestión de Periodos Académicos</h1>
            <p className="text-muted-foreground">Administra los periodos y las electivas ofertadas</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-[#003366] hover:bg-[#0d4f8b]">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Periodo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Periodo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    El nombre del periodo se generará automáticamente como: Periodo [Año]-[Semestre]
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <Label htmlFor="semestre">Semestre *</Label>
                    <Select value={formData.semestre} onValueChange={(value: '1' | '2') => setFormData(prev => ({ ...prev, semestre: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Primer Semestre</SelectItem>
                        <SelectItem value="2">Segundo Semestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fechaFin">Fecha de Fin *</Label>
                    <Input
                      id="fechaFin"
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => setFormData(prev => ({ ...prev, fechaFin: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>
                    Crear Periodo
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {!selectedPeriodo ? (
          <div className="p-6 space-y-4 h-full overflow-y-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar periodos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPeriodos.map((periodo) => (
                <Card key={periodo.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{periodo.nombre}</CardTitle>
                      {getEstadoBadge(periodo.estado)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><span className="font-medium">Año:</span> {periodo.año}</p>
                      <p><span className="font-medium">Semestre:</span> {periodo.semestre}</p>
                      <p><span className="font-medium">Inicio:</span> {periodo.fechaInicio}</p>
                      <p><span className="font-medium">Fin:</span> {periodo.fechaFin}</p>
                      <p><span className="font-medium">Electivas:</span> {periodo.electivasOfertadas.length}</p>
                      {periodo.enlaceFormulario && (
                        <div className="flex items-center text-sm text-blue-600">
                          <Link className="h-4 w-4 mr-1" />
                          Formulario activo
                        </div>
                      )}
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      variant="outline"
                      onClick={() => setSelectedPeriodo(periodo)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPeriodos.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron periodos que coincidan con la búsqueda.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => setSelectedPeriodo(null)}>
                    ← Volver
                  </Button>
                  <h2>{selectedPeriodo.nombre}</h2>
                  {getEstadoBadge(selectedPeriodo.estado)}
                </div>
                <p className="text-muted-foreground">
                  {selectedPeriodo.estado === 'CONFIGURACION' ? 
                    'Configurando electivas ofertadas para el periodo' :
                    selectedPeriodo.estado === 'ABIERTO' ?
                    'Periodo abierto para inscripciones' :
                    'Periodo cerrado'
                  }
                </p>
              </div>
              
              {selectedPeriodo.enlaceFormulario && selectedPeriodo.estado === 'ABIERTO' && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Enlace del formulario:</p>
                  <a 
                    href={selectedPeriodo.enlaceFormulario} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {selectedPeriodo.enlaceFormulario}
                  </a>
                </div>
              )}
            </div>

            {selectedPeriodo.estado === 'CONFIGURACION' && (
              <Card>
                <CardHeader>
                  <CardTitle>Buscar Electivas Disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar electivas para agregar..."
                        value={searchElectivas}
                        onChange={(e) => setSearchElectivas(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    {availableElectivas.length > 0 ? (
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {availableElectivas.map((electiva) => (
                          <div key={electiva.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{electiva.nombre}</p>
                              <p className="text-sm text-muted-foreground">{electiva.codigo}</p>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleAddElectiva(electiva)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        {searchElectivas ? 'No se encontraron electivas' : 'Todas las electivas ya están agregadas al periodo'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Electivas Ofertadas ({selectedPeriodo.electivasOfertadas.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPeriodo.electivasOfertadas.length > 0 ? (
                  <div className="space-y-4">
                    {selectedPeriodo.electivasOfertadas.map((electiva) => (
                      <div key={electiva.electivaId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{electiva.nombre}</h4>
                            <p className="text-sm text-muted-foreground">{electiva.codigo}</p>
                          </div>
                          {selectedPeriodo.estado === 'CONFIGURACION' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Quitar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Quitar electiva del periodo?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción quitará "{electiva.nombre}" del periodo "{selectedPeriodo.nombre}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemoveElectiva(electiva.electivaId)}>
                                    Quitar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                        
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Programa</TableHead>
                              <TableHead>Cupos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {electiva.cuposPorPrograma.map((cupo, index) => (
                              <TableRow key={index}>
                                <TableCell>{cupo.programa}</TableCell>
                                <TableCell>{cupo.cupos}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell className="font-medium">Total</TableCell>
                              <TableCell className="font-medium">
                                {electiva.cuposPorPrograma.reduce((sum, c) => sum + c.cupos, 0)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay electivas ofertadas para este periodo.</p>
                    {selectedPeriodo.estado === 'CONFIGURACION' && (
                      <p className="text-sm text-muted-foreground mt-2">Utiliza el buscador de arriba para agregar electivas.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={!!editingCupos} onOpenChange={(open) => !open && setEditingCupos(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cupos por Programa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nuevos-cupos">Número de Cupos</Label>
              <Input
                id="nuevos-cupos"
                type="number"
                value={newCupos}
                onChange={(e) => setNewCupos(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingCupos(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateCupos}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para agregar cupos por programa */}
      <Dialog open={!!addingCuposFor} onOpenChange={(open) => !open && setAddingCuposFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Cupos por Programa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Electiva: <span className="font-medium">{addingCuposFor?.nombre}</span>
                <br />
                La suma total de cupos debe ser exactamente 18.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {['Ingeniería de Sistemas', 'Ingeniería Civil', 'Ingeniería Industrial'].map((programa) => (
                <div key={programa}>
                  <Label htmlFor={`cupos-${programa}`}>¿Cuántos cupos para {programa}?</Label>
                  <Input
                    id={`cupos-${programa}`}
                    type="number"
                    min="0"
                    max="18"
                    value={cuposPorPrograma[programa] || ''}
                    onChange={(e) => setCuposPorPrograma(prev => ({
                      ...prev,
                      [programa]: parseInt(e.target.value) || 0
                    }))}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Total de cupos:</span>{' '}
                <span className={Object.values(cuposPorPrograma).reduce((sum, val) => sum + (val || 0), 0) === 18 ? 'text-green-600' : 'text-red-600'}>
                  {Object.values(cuposPorPrograma).reduce((sum, val) => sum + (val || 0), 0)} / 18
                </span>
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setAddingCuposFor(null)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmAddElectiva}>
                Agregar Electiva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}