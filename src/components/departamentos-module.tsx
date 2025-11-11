import { useState, useEffect } from 'react';
import { Plus, Search, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { Departamento, fetchDepartamentos, createDepartamento, updateDepartamento } from '../services/api';

export function DepartamentosModule() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingDepartamento, setEditingDepartamento] = useState<Departamento | null>(null);
  const [formData, setFormData] = useState({ nombre: '', codigo: '', descripcion: '' });

  // Traer departamentos del backend al cargar
  useEffect(() => {
    fetchDepartamentos()
      .then(setDepartamentos)
      .catch(err => toast.error(err.message));
  }, []);

  const filteredDepartamentos = departamentos.filter(d =>
    d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => setFormData({ nombre: '', codigo: '', descripcion: '' });

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.codigo) {
      toast.error('Nombre y código son obligatorios');
      return;
    }

    try {
      if (editingDepartamento) {
        const updated = await updateDepartamento(editingDepartamento.id, formData);
        setDepartamentos(prev => prev.map(d => d.id === updated.id ? updated : d));
        setEditingDepartamento(null);
        toast.success('Departamento actualizado');
      } else {
        const created = await createDepartamento(formData);
        setDepartamentos(prev => [...prev, created]);
        setIsCreating(false);
        toast.success('Departamento creado');
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (departamento: Departamento) => {
    setFormData({ nombre: departamento.nombre, codigo: departamento.codigo, descripcion: departamento.descripcion });
    setEditingDepartamento(departamento);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Departamentos</h1>
          <p className="text-muted-foreground">Administra los departamentos académicos de la universidad</p>
        </div>

        {/* Botón Crear Departamento */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Departamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Departamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre del Departamento *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Ciencias de la Computación"
                />
              </div>
              <div>
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                  placeholder="Ej: CC"
                />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={3}
                  placeholder="Descripción del departamento y sus funciones"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => { setIsCreating(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>Crear Departamento</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Buscador */}
      <div className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar departamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de Departamentos */}
      <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDepartamentos.map(departamento => (
          <Card key={departamento.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{departamento.nombre}</CardTitle>
                  <p className="text-sm text-muted-foreground">{departamento.codigo}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {departamento.descripcion && (
                <p className="text-sm text-muted-foreground">{departamento.descripcion}</p>
              )}
              <p className="text-sm"><span className="font-medium">Creado:</span> {departamento.fechaCreacion}</p>

              {/* Botón Editar */}
              <div className="flex space-x-2 mt-4">
                <Dialog open={editingDepartamento?.id === departamento.id} onOpenChange={(open) => !open && setEditingDepartamento(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(departamento)}>
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Departamento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-nombre">Nombre *</Label>
                        <Input
                          id="edit-nombre"
                          value={formData.nombre}
                          onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-codigo">Código *</Label>
                        <Input
                          id="edit-codigo"
                          value={formData.codigo}
                          onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-descripcion">Descripción</Label>
                        <Textarea
                          id="edit-descripcion"
                          value={formData.descripcion}
                          onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setEditingDepartamento(null)}>Cancelar</Button>
                        <Button onClick={handleSubmit}>Guardar Cambios</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDepartamentos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron departamentos que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </div>
  );
}
