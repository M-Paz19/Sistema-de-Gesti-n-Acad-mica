import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Eye, Link, Upload, Lock, PlayCircle, Trash2, BookOpen } from 'lucide-react';
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
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner@2.0.3';

// Importamos los servicios y tipos
import { 
  Periodo, Oferta, 
  fetchPeriodos, createPeriodo, abrirPeriodo, cerrarFormulario, cargarRespuestasManual,
  fetchOfertasPorPeriodo, agregarOferta, editarCupos, eliminarOferta,
  fetchProgramas, fetchElectivas, Programa, Electiva
} from '../services/api';

export function PeriodosModule() {
  // Estados principales
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [availableElectivas, setAvailableElectivas] = useState<Electiva[]>([]);
  
  // Estados de UI
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState<Periodo | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados para Modales y Formularios
  const [isAddingElectiva, setIsAddingElectiva] = useState(false);
  const [addingCuposFor, setAddingCuposFor] = useState<Electiva | null>(null);
  const [cuposPorPrograma, setCuposPorPrograma] = useState<Record<string, number>>({});
  
  const [isEditingCupos, setIsEditingCupos] = useState(false);
  const [editingOferta, setEditingOferta] = useState<Oferta | null>(null);

  const [isOpeningPeriod, setIsOpeningPeriod] = useState(false);
  const [opcionesFormulario, setOpcionesFormulario] = useState(2);

  const [formData, setFormData] = useState({
    año: new Date().getFullYear(),
    semestre: '1' as '1' | '2',
    fechaInicio: '',
    fechaFin: ''
  });

  // --- Carga de Datos ---

  useEffect(() => {
    loadPeriodos();
    loadProgramas(); 
    loadElectivas(); 
  }, []);

  useEffect(() => {
    if (selectedPeriodo) {
      loadOfertas(selectedPeriodo.id);
    }
  }, [selectedPeriodo]);

  const loadPeriodos = () => {
    fetchPeriodos()
      .then(setPeriodos)
      .catch(err => toast.error(err.message));
  };

  const loadProgramas = () => {
    fetchProgramas()
      .then(setProgramas)
      .catch(console.error);
  };

  const loadElectivas = () => {
    fetchElectivas()
      .then(setAvailableElectivas)
      .catch(console.error);
  };

  const loadOfertas = (periodoId: number) => {
    fetchOfertasPorPeriodo(periodoId)
      .then(setOfertas)
      .catch(err => toast.error(err.message));
  };

  // --- Lógica de Negocio ---

  const handleCreatePeriodo = async () => {
    if (!formData.fechaInicio || !formData.fechaFin) {
      toast.error('Las fechas son obligatorias');
      return;
    }

    const fechaApertura = new Date(formData.fechaInicio).toISOString();
    const fechaCierre = new Date(formData.fechaFin).toISOString();
    const semestreStr = `${formData.año}-${formData.semestre}`;

    try {
      await createPeriodo({
        semestre: semestreStr,
        fechaApertura,
        fechaCierre
      });
      toast.success('Periodo creado exitosamente');
      setIsCreating(false);
      loadPeriodos();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleOpenPeriodo = async () => {
    if (!selectedPeriodo) return;
    try {
      const res = await abrirPeriodo(selectedPeriodo.id, opcionesFormulario, true); 
      toast.success(res.mensaje);
      setSelectedPeriodo(prev => prev ? { ...prev, estado: 'ABIERTO_FORMULARIO', urlFormulario: res.urlFormulario } : null);
      loadPeriodos(); 
      setIsOpeningPeriod(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCloseFormulario = async () => {
    if (!selectedPeriodo) return;
    try {
      const res = await cerrarFormulario(selectedPeriodo.id);
      toast.success(res.mensaje);
      setSelectedPeriodo(prev => prev ? { ...prev, estado: 'CERRADO_FORMULARIO' } : null);
      loadPeriodos();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPeriodo || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    try {
      const res = await cargarRespuestasManual(selectedPeriodo.id, file);
      toast.success(res.mensaje);
      setSelectedPeriodo(prev => prev ? { ...prev, estado: 'CERRADO_FORMULARIO' } : null);
      loadPeriodos();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // --- Gestión de Oferta ---

  const prepareAddElectiva = (electiva: Electiva) => {
    setAddingCuposFor(electiva);
    setCuposPorPrograma({});
    setIsAddingElectiva(true);
  };

  const confirmAddElectiva = async () => {
    if (!selectedPeriodo || !addingCuposFor) return;
    
    const cuposMap: Record<number, number> = {};
    let total = 0;

    Object.entries(cuposPorPrograma).forEach(([progId, cantidad]) => {
       const cant = parseInt(String(cantidad)) || 0;
       if (cant > 0) {
         cuposMap[parseInt(progId)] = cant;
         total += cant;
       }
    });

    if (total !== 18) {
      toast.error(`La suma total de cupos debe ser 18. Actual: ${total}`);
      return;
    }

    try {
      await agregarOferta(selectedPeriodo.id, parseInt(addingCuposFor.id), cuposMap);
      toast.success('Electiva agregada a la oferta');
      setIsAddingElectiva(false);
      setAddingCuposFor(null);
      loadOfertas(selectedPeriodo.id);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmEditCupos = async () => {
    if (!editingOferta) return;
    
    const cuposMap: Record<number, number> = {};
    let total = 0;
    Object.entries(cuposPorPrograma).forEach(([progId, cantidad]) => {
        const cant = parseInt(String(cantidad)) || 0;
        if (cant > 0) {
          cuposMap[parseInt(progId)] = cant;
          total += cant;
        }
     });

     if (total !== 18) {
        toast.error(`La suma total de cupos debe ser 18. Actual: ${total}`);
        return;
     }

     try {
        await editarCupos(editingOferta.id, cuposMap);
        toast.success('Cupos actualizados');
        setIsEditingCupos(false);
        setEditingOferta(null);
        loadOfertas(selectedPeriodo!.id);
     } catch (err:any) {
        toast.error(err.message);
     }
  };

  const handleDeleteOferta = async (ofertaId: number) => {
    try {
      await eliminarOferta(ofertaId);
      toast.success('Oferta eliminada');
      loadOfertas(selectedPeriodo!.id);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // --- Utils UI ---
  
  // Filtro: Electivas aprobadas que NO están ya en la oferta del periodo
  const electivasParaAgregar = availableElectivas.filter(e => 
    !ofertas.some(o => o.electivaId === parseInt(e.id)) &&
    e.estado === 'APROBADA'
  );

  const getEstadoBadge = (estado: string) => {
    const map: Record<string, any> = {
      'CONFIGURACION': { label: 'Configuración', variant: 'secondary' },
      'ABIERTO_FORMULARIO': { label: 'Abierto', variant: 'default', className: 'bg-green-600' },
      'CERRADO_FORMULARIO': { label: 'Cerrado (Respuestas)', variant: 'secondary' },
      'PROCESO_CARGA_SIMCA': { label: 'Procesando SIMCA', variant: 'outline' },
    };
    const info = map[estado] || { label: estado, variant: 'outline' };
    return <Badge variant={info.variant} className={info.className}>{info.label}</Badge>;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b bg-gradient-to-r from-[#003366]/5 to-[#FDB913]/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#003366]">Gestión de Periodos Académicos</h1>
            <p className="text-muted-foreground">Administra los periodos y la oferta académica</p>
          </div>
          {!selectedPeriodo && (
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="bg-[#003366] hover:bg-[#0d4f8b]">
                  <Plus className="h-4 w-4 mr-2" /> Nuevo Periodo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Crear Nuevo Periodo</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Año</Label>
                      <Input type="number" value={formData.año} onChange={e => setFormData({...formData, año: parseInt(e.target.value)})} />
                    </div>
                    <div>
                      <Label>Semestre</Label>
                      <Select value={formData.semestre} onValueChange={(v: '1'|'2') => setFormData({...formData, semestre: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Inicio</Label><Input type="date" onChange={e => setFormData({...formData, fechaInicio: e.target.value})} /></div>
                    <div><Label>Fin</Label><Input type="date" onChange={e => setFormData({...formData, fechaFin: e.target.value})} /></div>
                  </div>
                  <Button onClick={handleCreatePeriodo} className="w-full">Crear</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        {!selectedPeriodo ? (
          // VISTA LISTA DE PERIODOS
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {periodos.map(periodo => (
              <Card key={periodo.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle>{periodo.semestre}</CardTitle>
                  {getEstadoBadge(periodo.estado)}
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1 text-muted-foreground">
                     <p>Inicio: {new Date(periodo.fechaApertura).toLocaleDateString()}</p>
                     <p>Fin: {new Date(periodo.fechaCierre).toLocaleDateString()}</p>
                  </div>
                  <Button variant="outline" className="w-full mt-4" onClick={() => setSelectedPeriodo(periodo)}>
                    <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                  </Button>
                </CardContent>
              </Card>
            ))}
            {periodos.length === 0 && <p className="text-muted-foreground col-span-2 text-center">No hay periodos registrados.</p>}
          </div>
        ) : (
          // VISTA DETALLE PERIODO
          <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setSelectedPeriodo(null)}>← Volver</Button>
                <h2 className="text-2xl font-bold">{selectedPeriodo.semestre}</h2>
                {getEstadoBadge(selectedPeriodo.estado)}
              </div>
              
              <div className="flex gap-2">
                {selectedPeriodo.estado === 'CONFIGURACION' && (
                   <Dialog open={isOpeningPeriod} onOpenChange={setIsOpeningPeriod}>
                     <DialogTrigger asChild>
                       <Button className="bg-green-600 hover:bg-green-700">
                         <PlayCircle className="mr-2 h-4 w-4"/> Abrir Periodo
                       </Button>
                     </DialogTrigger>
                     <DialogContent>
                       <DialogHeader><DialogTitle>Abrir Periodo Académico</DialogTitle></DialogHeader>
                       <div className="space-y-4">
                         <Alert><AlertDescription>Esto generará el formulario de Google y habilitará la inscripción.</AlertDescription></Alert>
                         <div>
                           <Label>Opciones en el formulario</Label>
                           <Input type="number" min={1} value={opcionesFormulario} onChange={e => setOpcionesFormulario(parseInt(e.target.value))} />
                         </div>
                         <Button onClick={handleOpenPeriodo} className="w-full">Confirmar Apertura</Button>
                       </div>
                     </DialogContent>
                   </Dialog>
                )}

                {selectedPeriodo.estado === 'ABIERTO_FORMULARIO' && (
                  <>
                    <Button variant="outline" onClick={() => window.open(selectedPeriodo.urlFormulario, '_blank')}>
                       <Link className="mr-2 h-4 w-4"/> Ir al Formulario
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Lock className="mr-2 h-4 w-4"/> Cerrar Formulario
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Cerrar Inscripciones?</AlertDialogTitle>
                          <AlertDialogDescription>Se descargarán las respuestas automáticamente de Google Forms.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCloseFormulario}>Cerrar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <div className="relative">
                      <input type="file" id="upload-manual" className="hidden" onChange={handleFileUpload} accept=".xlsx, .csv" />
                      <Button variant="secondary" onClick={() => document.getElementById('upload-manual')?.click()}>
                        <Upload className="mr-2 h-4 w-4"/> Carga Manual
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* CONTENEDOR PRINCIPAL DE CONFIGURACIÓN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
              
              {/* COLUMNA IZQUIERDA: OFERTAS ACTUALES (Ocupa 2 columnas) */}
              <Card className={`flex flex-col overflow-hidden ${selectedPeriodo.estado === 'CONFIGURACION' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                 <CardHeader>
                   <CardTitle>Oferta Académica ({ofertas.length})</CardTitle>
                 </CardHeader>
                 <CardContent className="flex-1 overflow-y-auto space-y-4 p-6 pt-0">
                    {ofertas.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3"/>
                        <p className="text-muted-foreground">No hay electivas ofertadas en este periodo.</p>
                        {selectedPeriodo.estado === 'CONFIGURACION' && <p className="text-sm text-muted-foreground">Agrega una desde el panel derecho.</p>}
                      </div>
                    ) : (
                      ofertas.map(oferta => (
                          <div key={oferta.id} className="border rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-bold text-lg">{oferta.nombreElectiva}</h3>
                                  <p className="text-sm text-muted-foreground">{oferta.codigoElectiva}</p>
                                </div>
                                {selectedPeriodo.estado === 'CONFIGURACION' && (
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => {
                                        setEditingOferta(oferta);
                                        setCuposPorPrograma(oferta.cuposPorPrograma);
                                        setIsEditingCupos(true);
                                    }}>
                                        <Edit className="h-4 w-4"/>
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteOferta(oferta.id)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                  </div>
                                )}
                            </div>
                            <Table>
                                <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="h-8">Programa</TableHead><TableHead className="h-8 text-right">Cupos</TableHead></TableRow></TableHeader>
                                <TableBody>
                                  {Object.entries(oferta.cuposPorPrograma).map(([progId, cupos]) => {
                                      const progNombre = programas.find(p => p.id === String(progId))?.nombre || `Programa ${progId}`;
                                      return (
                                        <TableRow key={progId} className="border-b-0 hover:bg-transparent">
                                          <TableCell className="py-1">{progNombre}</TableCell>
                                          <TableCell className="py-1 text-right font-medium">{cupos}</TableCell>
                                        </TableRow>
                                      )
                                  })}
                                </TableBody>
                            </Table>
                          </div>
                      ))
                    )}
                 </CardContent>
              </Card>

              {/* COLUMNA DERECHA: ELECTIVAS DISPONIBLES (Ocupa 1 columna, SOLO visible en CONFIGURACION) */}
              {selectedPeriodo.estado === 'CONFIGURACION' && (
                <Card className="flex flex-col overflow-hidden border-l-4 border-l-[#FDB913]">
                   <CardHeader className="bg-muted/20 pb-4">
                     <CardTitle className="text-base">Electivas Disponibles</CardTitle>
                     <p className="text-xs text-muted-foreground">Haz clic en + para agregar a la oferta</p>
                   </CardHeader>
                   <CardContent className="flex-1 p-0 overflow-hidden">
                     <ScrollArea className="h-[500px]">
                       <div className="divide-y">
                         {electivasParaAgregar.length === 0 ? (
                           <p className="p-8 text-sm text-center text-muted-foreground">
                             No hay más electivas aprobadas disponibles para agregar.
                           </p>
                         ) : (
                           electivasParaAgregar.map(elec => (
                             <div key={elec.id} className="p-3 hover:bg-accent flex justify-between items-center group transition-colors">
                                <div className="overflow-hidden">
                                   <p className="font-medium text-sm truncate" title={elec.nombre}>{elec.nombre}</p>
                                   <p className="text-xs text-muted-foreground">{elec.codigo}</p>
                                </div>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => prepareAddElectiva(elec)}>
                                   <Plus className="h-5 w-5"/>
                                </Button>
                             </div>
                           ))
                         )}
                       </div>
                     </ScrollArea>
                   </CardContent>
                </Card>
              )}

            </div>
          </div>
        )}
      </div>

      {/* MODAL: AGREGAR ELECTIVA (CUPOS) */}
      <Dialog open={isAddingElectiva} onOpenChange={setIsAddingElectiva}>
        <DialogContent>
           <DialogHeader><DialogTitle>Definir Cupos: {addingCuposFor?.nombre}</DialogTitle></DialogHeader>
           <div className="space-y-4">
              <Alert><AlertDescription>La suma total de cupos debe ser exactamente 18.</AlertDescription></Alert>
              
              {/* CORRECCIÓN CRÍTICA AQUÍ: Validación de programas con ?. y fallback a [] */}
              {(addingCuposFor?.programas || []).map(prog => (
                  <div key={prog.id} className="flex justify-between items-center">
                      <Label className="w-2/3">{prog.nombre}</Label>
                      <Input 
                        type="number" 
                        className="w-20" 
                        value={cuposPorPrograma[prog.id] || ''} 
                        onChange={e => setCuposPorPrograma({...cuposPorPrograma, [prog.id]: parseInt(e.target.value)})}
                      />
                  </div>
              ))}
              
              <div className="flex justify-between font-bold pt-2 border-t">
                 <span>Total:</span>
                 <span className={Object.values(cuposPorPrograma).reduce((a,b) => (parseInt(String(a))||0) + (parseInt(String(b))||0), 0) === 18 ? 'text-green-600' : 'text-red-600'}>
                    {Object.values(cuposPorPrograma).reduce((a,b) => (parseInt(String(a))||0) + (parseInt(String(b))||0), 0)} / 18
                 </span>
              </div>
              <Button onClick={confirmAddElectiva} className="w-full">Agregar a Oferta</Button>
           </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR CUPOS */}
      <Dialog open={isEditingCupos} onOpenChange={setIsEditingCupos}>
         <DialogContent>
            <DialogHeader><DialogTitle>Editar Cupos</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {editingOferta && Object.keys(editingOferta.cuposPorPrograma).map(progId => {
                   const progName = programas.find(p => p.id === String(progId))?.nombre || progId;
                   return (
                     <div key={progId} className="flex justify-between items-center">
                        <Label className="w-2/3">{progName}</Label>
                        <Input 
                           type="number" 
                           className="w-20" 
                           value={cuposPorPrograma[progId]} 
                           onChange={e => setCuposPorPrograma({...cuposPorPrograma, [progId]: parseInt(e.target.value)})}
                        />
                     </div>
                   )
              })}
              <Button onClick={confirmEditCupos} className="w-full">Guardar Cambios</Button>
            </div>
         </DialogContent>
      </Dialog>

    </div>
  );
}