import { useState, useEffect } from 'react';
import { Plus, Search, Edit, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { toast } from 'sonner@2.0.3';
import { Electiva, fetchElectivas, createElectiva, updateElectiva, approveElectiva, deactivateElectiva, reactivateElectiva, fetchDepartamentos, fetchProgramas } from '../services/api';



export function ElectivasModule() {
  const [electivas, setElectivas] = useState<Electiva[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [programas, setProgramas] = useState<{ id: number; nombre: string }[]>([]);
  const [departamentos, setDepartamentos] = useState<{ id: number; nombre: string }[]>([]);
  const [editFormData, setEditFormData] = useState<Omit<Electiva, 'id' | 'estado' | 'fechaCreacion'> | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingElectiva, setEditingElectiva] = useState<Electiva | null>(null);
   const [formData, setFormData] = useState<Omit<Electiva, 'id' | 'estado' | 'fechaCreacion'>>({
    nombre: '',
    codigo: '',
    descripcion: '',
    departamentoId: 0,
    programasIds: [] as number[],

  });


  // Traer electivas desde backend
  useEffect(() => {
  const loadData = async () => {
    try {
      const [electivasData, departamentosData, programasData] = await Promise.all([
        fetchElectivas(),
        fetchDepartamentos(),
        fetchProgramas()
      ]);

      setDepartamentos(departamentosData);
      setProgramas(programasData);

      const normalizedElectivas = electivasData.map((e: any) => ({
      ...e,
      programasIds: e.programas ? e.programas.map((p: any) => p.id) : [],
    }));


      setElectivas(normalizedElectivas);

    } catch (err: any) {
      toast.error(err.message || "Error al cargar datos iniciales");
    }
  };

  loadData();
}, []);



  const filteredElectivas = electivas.filter(electiva => {
    const matchesSearch =
      electiva.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      electiva.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filtroEstado === 'TODOS' || electiva.estado === filtroEstado;
    const showInactiveFilter = showInactive || electiva.estado !== 'INACTIVA';
    return matchesSearch && matchesEstado && showInactiveFilter;
  });

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'APROBADA': return 'default';
      case 'PENDIENTE': return 'secondary';
      case 'RECHAZADA': return 'destructive';
      case 'INACTIVA': return 'outline';
      default: return 'secondary';
    }
  };

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.codigo || !formData.departamentoId) {
      toast.error('Nombre, código y departamento son obligatorios');
      return;
    }
    if (formData.programasIds.length === 0) {
      toast.error('Debe seleccionar al menos un programa');
      return;
    }

    try {
      if (editingElectiva) {
        const updated = await updateElectiva(editingElectiva.id, formData);
        setElectivas(prev => prev.map(e => e.id === updated.id ? updated : e));
        setEditingElectiva(null);
        toast.success('Electiva actualizada');
      } else {
        const created = await createElectiva(formData);
        const normalized = {
          ...created,
          programasIds: created.programas.map((p: any) => p.id)
        };
        setElectivas(prev => [...prev, normalized]);
        setIsCreating(false);
        toast.success('Electiva creada');
      }
      resetForm();
    } catch (err: any) {
      if (err.response?.data?.message) toast.error(err.response.data.message);
      else toast.error(err.message);
    }
  };

 const resetForm = () => {
    setFormData({ nombre: '', codigo: '', descripcion: '', departamentoId: 0, programasIds: [] });
  };

  const handleEdit = (electiva: Electiva) => {
  setEditingElectiva(electiva);
  setEditFormData({
    nombre: electiva.nombre,
    codigo: electiva.codigo,
    descripcion: electiva.descripcion,
    departamentoId: electiva.departamentoId,
    programasIds: [...electiva.programasIds],
  });
};

  const handleSubmitEdit = async () => {
  if (!editFormData || !editingElectiva) return;
  if (!editFormData.nombre || !editFormData.codigo || !editFormData.departamentoId) {
    toast.error('Nombre, código y departamento son obligatorios');
    return;
  }
  if (editFormData.programasIds.length === 0) {
    toast.error('Debe seleccionar al menos un programa');
    return;
  }

  try {
    const updated = await updateElectiva(editingElectiva.id, editFormData);

    // Normaliza para incluir programasIds
    const normalized = {
      ...updated,
      programasIds: updated.programas ? updated.programas.map((p: any) => p.id) : [],
    };

    setElectivas(prev => prev.map(e => e.id === normalized.id ? normalized : e));
    setEditingElectiva(null);
    setEditFormData(null);
    toast.success('Electiva actualizada');

  } catch (err: any) {
    toast.error(err.message || 'Error al actualizar electiva');
  }
};

  const handleApprove = async (electivaId: string) => {
    try {
      const updated = await approveElectiva(electivaId);
      setElectivas(prev => prev.map(e => e.id === updated.id ? updated : e));
      toast.success('Electiva aprobada');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReject = (electivaId: string) => {
    setElectivas(prev => prev.map(e => 
      e.id === electivaId 
        ? { ...e, estado: 'RECHAZADA' as const }
        : e
    ));
    toast.success('Electiva rechazada');
  };

  const handleDeactivate = async (electivaId: string) => {
  try {
    const updated = await deactivateElectiva(electivaId);
    setElectivas(prev => prev.map(e => e.id === updated.id ? updated : e));
    toast.success('Electiva desactivada');
  } catch (err: any) {
    toast.error(err.message);
  }
};

  const handleReactivate = async (electivaId: string) => {
    try {
      const updated = await reactivateElectiva(electivaId);
      setElectivas(prev => prev.map(e => e.id === updated.id ? updated : e));
      toast.success('Electiva reactivada');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const togglePrograma = (programaId: number) => {
  setFormData(prev => ({
    ...prev,
    programasIds: prev.programasIds.includes(programaId)
      ? prev.programasIds.filter(id => id !== programaId)
      : [...prev.programasIds, programaId]
  }));
};

  const toggleProgramaEdit = (programaId: number) => {
    if (!editFormData) return;
    setEditFormData({
      ...editFormData,
      programasIds: editFormData.programasIds.includes(programaId)
        ? editFormData.programasIds.filter(id => id !== programaId)
        : [...editFormData.programasIds, programaId]
    });
};



  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1>Gestión de Electivas</h1>
            <p className="text-muted-foreground">Administra las materias electivas disponibles</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Electiva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Electiva</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre de la Electiva *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Inteligencia Artificial"
                  />
                </div>
                <div>
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ej: IA-101"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción de la electiva"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="departamento">Departamento</Label>
                <Select
                  value={String(formData.departamentoId || 0)}
                  onValueChange={(value) =>
                    setFormData({ ...formData, departamentoId: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map((dep) => (
                      <SelectItem key={dep.id} value={String(dep.id)}>
                        {dep.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Programas Disponibles *</Label>
                <div className="space-y-2 mt-2">
                  {programas.map((programa) => (
                    <div key={programa.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`programa-${programa.id}`}
                        checked={formData.programasIds.includes(programa.id)}
                        onChange={() => togglePrograma(programa.id)}
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor={`programa-${programa.id}`}
                        className="font-normal cursor-pointer"
                      >
                        {programa.nombre}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>Crear Electiva</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex space-x-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar electivas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              <SelectItem value="PENDIENTE">Pendientes</SelectItem>
              <SelectItem value="APROBADA">Aprobadas</SelectItem>
              <SelectItem value="RECHAZADA">Rechazadas</SelectItem>
              <SelectItem value="INACTIVA">Inactivas</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive" className="text-sm">
              Mostrar inactivas
            </Label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredElectivas.map((electiva) => (
            <Card key={electiva.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{electiva.nombre}</CardTitle>
                    <p className="text-sm text-muted-foreground">{electiva.codigo}</p>
                  </div>
                  <Badge variant={getEstadoBadgeVariant(electiva.estado)}>
                    {electiva.estado}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Departamento:</span>{" "}
                    {departamentos.find(dep => dep.id === electiva.departamentoId)?.nombre || "Sin asignar"}
                  </p>

                  {electiva.descripcion && (
                    <p><span className="font-medium">Descripción:</span> {electiva.descripcion}</p>
                  )}
                 <div>
                    <span className="font-medium">Programas:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(electiva.programasIds || []).map((id) => {
                        const programa = programas.find(p => p.id === id);
                        return (
                          <Badge key={id} variant="outline">
                            {programa ? programa.nombre : `ID ${id}`}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Dialog 
                  open={editingElectiva?.id === electiva.id} 
                  onOpenChange={(open) => {
                    if (!open) {
                      setEditingElectiva(null);
                      setTimeout(() => setEditFormData(null), 100); // evita error de render inmediato
                    }
                  }}
                >

                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(electiva)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Editar Electiva</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-nombre">Nombre de la Electiva *</Label>
                            <Input
                              id="edit-nombre"
                              value={editFormData?.nombre || ''}
                              onChange={(e) => setEditFormData(prev => prev ? { ...prev, nombre: e.target.value } : null)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-codigo">Código *</Label>
                            <Input
                              id="edit-codigo"
                              value={editFormData?.codigo || ''}
                              onChange={(e) => setEditFormData(prev => prev ? { ...prev, codigo: e.target.value } : null)}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="edit-descripcion">Descripción</Label>
                          <Textarea
                            id="edit-descripcion"
                            value={editFormData?.descripcion || ''}
                            onChange={(e) => setEditFormData(prev => prev ? { ...prev, descripcion: e.target.value } : null)}
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="edit-departamento">Departamento</Label>
                          <Select
                          value={String(editFormData?.departamentoId || 0)}
                          onValueChange={(value) => setEditFormData(prev => prev ? { ...prev, departamentoId: Number(value) } : null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {departamentos.map(dep => (
                              <SelectItem key={dep.id} value={String(dep.id)}>{dep.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        </div>

                        <div>
                          <Label>Programas Disponibles *</Label>
                          <div className="space-y-2 mt-2">
                            {programas.map(programa => (
                            <div key={programa.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`edit-programa-${programa.id}`}
                                checked={editFormData?.programasIds.includes(programa.id) || false}
                                onChange={() => toggleProgramaEdit(programa.id)}
                                className="h-4 w-4"
                              />
                              <Label htmlFor={`edit-programa-${programa.id}`} className="font-normal cursor-pointer">
                                {programa.nombre}
                              </Label>
                            </div>
                          ))}

                          </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setEditingElectiva(null)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleSubmitEdit}>
                            Guardar Cambios
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {electiva.estado === 'PENDIENTE' && (
                    <>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Aprobar electiva?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción aprobará la electiva "{electiva.nombre}" y estará disponible para ofertar en periodos académicos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleApprove(electiva.id)}>
                              Aprobar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Rechazar electiva?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción rechazará la electiva "{electiva.nombre}". No estará disponible para ofertar.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleReject(electiva.id)}>
                              Rechazar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}

                  {electiva.estado === 'APROBADA' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <XCircle className="h-4 w-4 mr-1" />
                          Desactivar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Desactivar electiva?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción desactivará la electiva "{electiva.nombre}". No estará disponible para nuevos periodos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeactivate(electiva.id)}>
                            Desactivar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredElectivas.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No se encontraron electivas que coincidan con los filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}