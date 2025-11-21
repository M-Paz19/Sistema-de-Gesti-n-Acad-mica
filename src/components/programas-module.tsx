import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Ban, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { 
  Programa, 
  fetchProgramas, 
  createPrograma, 
  updatePrograma
} from '../services/api';

export function ProgramasModule() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [isCreating, setIsCreating] = useState(false);
  const [editingPrograma, setEditingPrograma] = useState<Programa | null>(null);
  const [formData, setFormData] = useState({ nombre: '', codigo: '' });

  useEffect(() => {
    fetchProgramas()
      .then(setProgramas)
      .catch(err => toast.error(err.message));
  }, []);

  const getEstadoBadge = (estado: Programa['estado']) => {
    switch (estado) {
      case 'APROBADO':
        return <Badge className="bg-[#FDB913] text-[#003366] border-[#FDB913] hover:bg-[#d99d0f]">{estado}</Badge>;
      case 'BORRADOR':
        return <Badge className="bg-[#0d4f8b] text-white border-[#0d4f8b] hover:bg-[#003366]">{estado}</Badge>;
      case 'DESHABILITADO':
        return <Badge variant="outline" className="border-[#6c757d] text-[#6c757d]">{estado}</Badge>;
    }
  };

  const filteredProgramas = programas.filter(programa => {
    const matchesSearch = programa.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          programa.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filtroEstado === 'TODOS' || programa.estado === filtroEstado;
    return matchesSearch && matchesEstado;
  });

  const resetForm = () => setFormData({ nombre: '', codigo: '' });

  const handleSubmit = async () => {
  if (!formData.nombre || !formData.codigo) {
    toast.error('Todos los campos son obligatorios');
    return;
  }

  try {
    let response: Response;
    if (editingPrograma) {
      response = await fetch(`http://localhost:8080/api/programas/${editingPrograma.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } else {
      response = await fetch(`http://localhost:8080/api/programas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al procesar la solicitud');
    }

    const data = await response.json();

    if (editingPrograma) {
      setProgramas(prev => prev.map(p => p.id === data.id ? data : p));
      setEditingPrograma(null);
      toast.success('Programa actualizado');
    } else {
      setProgramas(prev => [...prev, data]);
      setIsCreating(false);
      toast.success('Programa creado');
    }

    resetForm();

  } catch (err: any) {
    toast.error(err.message);
  }
};

  const handleEdit = (programa: Programa) => {
    setFormData({ nombre: programa.nombre, codigo: programa.codigo });
    setEditingPrograma(programa);
  };

  const handleDeshabilitar = async (programaId: number) => {
  try {
    const response = await fetch(`http://localhost:8080/api/programas/${programaId}/deshabilitar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al deshabilitar el programa');
    }

    const updated = await response.json();

    // Actualizamos el estado local manualmente, ya que la respuesta no incluye todos los campos
    setProgramas(prev =>
      prev.map(p =>
        p.id === updated.id ? { ...p, estado: 'DESHABILITADO' } : p
      )
    );

    toast.success(`Programa "${updated.nombre}" deshabilitado exitosamente`);
  } catch (err: any) {
    toast.error(err.message);
  }
};



  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header y Crear Programa */}
      <div className="p-6 border-b bg-gradient-to-r from-[#003366]/5 to-[#FDB913]/5 flex items-center justify-between">
        <div>
          <h1 className="text-[#003366]">Gestión de Programas</h1>
          <p className="text-muted-foreground">Administra los programas académicos de la facultad</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-[#003366] hover:bg-[#0d4f8b]">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Programa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Programa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre del Programa *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Ingeniería de Sistemas"
                />
              </div>
              <div>
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                  placeholder="Ej: IS"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
                <Button onClick={handleSubmit}>Crear Programa</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros y búsqueda */}
      <div className="p-6 space-y-4 overflow-y-auto flex-1">
        <div className="flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar programas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              <SelectItem value="BORRADOR">Borradores</SelectItem>
              <SelectItem value="APROBADO">Aprobados</SelectItem>
              <SelectItem value="DESHABILITADO">Deshabilitados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de programas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProgramas.map(programa => (
            <Card key={programa.id}>
              <CardHeader className="pb-3 flex items-center justify-between">
                <CardTitle className="text-lg">{programa.nombre}</CardTitle>
                {getEstadoBadge(programa.estado)}
              </CardHeader>
              <CardContent>
                <p><span className="font-medium">Código:</span> {programa.codigo}</p>
                <p><span className="font-medium">Creado:</span> {programa.fechaCreacion}</p>

                {/* Botones Editar / Aprobar / Deshabilitar */}
                <div className="flex space-x-2 mt-4">
                  <Dialog open={editingPrograma?.id === programa.id} onOpenChange={(open) => !open && setEditingPrograma(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(programa)}>
                        <Edit className="h-4 w-4 mr-1" /> Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Editar Programa</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-nombre">Nombre *</Label>
                          <Input
                            id="edit-nombre"
                            value={formData.nombre}
                            onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-codigo">Código *</Label>
                          <Input
                            id="edit-codigo"
                            value={formData.codigo}
                            onChange={e => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setEditingPrograma(null)}>Cancelar</Button>
                          <Button onClick={handleSubmit}>Guardar Cambios</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/*{programa.estado === 'BORRADOR' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Aprobar programa?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción aprobará el programa "{programa.nombre}" y estará disponible para estudiantes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleApprove(programa.id)}>Aprobar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}*/}

                  {programa.estado !== 'DESHABILITADO' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Ban className="h-4 w-4 mr-1" /> Deshabilitar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Deshabilitar programa?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción deshabilitará el programa "{programa.nombre}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeshabilitar(programa.id)}>
                          Deshabilitar
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

        {filteredProgramas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron programas que coincidan con los filtros.
          </div>
        )}
      </div>
    </div>
  );
}
