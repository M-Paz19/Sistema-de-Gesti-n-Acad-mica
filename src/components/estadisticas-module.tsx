import { useState } from 'react';
import { Download, TrendingUp, Users, Award, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner@2.0.3';

const mockPeriodos = [
  { id: '1', nombre: 'Periodo 2024-1' },
  { id: '2', nombre: 'Periodo 2024-2' },
  { id: '3', nombre: 'Periodo 2023-2' }
];

// HU4.2: Electivas asignadas por estudiante
const electivasPorEstudianteData = [
  { electivas: '0', estudiantes: 45, color: '#ef4444' },
  { electivas: '1', estudiantes: 120, color: '#f97316' },
  { electivas: '2', estudiantes: 200, color: '#eab308' },
  { electivas: '3', estudiantes: 85, color: '#22c55e' },
  { electivas: '4', estudiantes: 12, color: '#3b82f6' },
  { electivas: '5+', estudiantes: 3, color: '#8b5cf6' }
];

// HU4.3: Electivas más demandadas
const electivasDemandadasData = [
  { 
    nombre: 'Inteligencia Artificial', 
    primeraOpcion: 85, 
    demandaTotal: 142,
    color: '#3b82f6'
  },
  { 
    nombre: 'Gestión de Proyectos', 
    primeraOpcion: 72, 
    demandaTotal: 128,
    color: '#22c55e'
  },
  { 
    nombre: 'Ciberseguridad', 
    primeraOpcion: 68, 
    demandaTotal: 115,
    color: '#f97316'
  },
  { 
    nombre: 'Machine Learning', 
    primeraOpcion: 55, 
    demandaTotal: 98,
    color: '#8b5cf6'
  },
  { 
    nombre: 'Desarrollo Web', 
    primeraOpcion: 42, 
    demandaTotal: 87,
    color: '#ef4444'
  },
  { 
    nombre: 'Robótica', 
    primeraOpcion: 38, 
    demandaTotal: 72,
    color: '#06b6d4'
  }
];

// HU4.6: KPIs de asignación
const kpisData = {
  totalEstudiantes: 465,
  conTodasAsignadas: 285,
  conAsignacionesParciales: 135,
  sinAsignacion: 45
};

const porcentajeTodasAsignadas = Math.round((kpisData.conTodasAsignadas / kpisData.totalEstudiantes) * 100);
const porcentajeParciales = Math.round((kpisData.conAsignacionesParciales / kpisData.totalEstudiantes) * 100);
const porcentajeSinAsignacion = Math.round((kpisData.sinAsignacion / kpisData.totalEstudiantes) * 100);

// Datos para gráfico de torta de distribución de asignaciones
const distribucionAsignacionesData = [
  { name: 'Todas asignadas', value: porcentajeTodasAsignadas, color: '#22c55e' },
  { name: 'Parciales', value: porcentajeParciales, color: '#eab308' },
  { name: 'Sin asignación', value: porcentajeSinAsignacion, color: '#ef4444' }
];

export function EstadisticasModule() {
  const [selectedPeriodo, setSelectedPeriodo] = useState('1');

  const handleExportarReporte = () => {
    toast.success('Exportando reporte estadístico con datos y gráficas');
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      {/* Header con filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dashboard de Estadísticas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Análisis estadístico del proceso de asignación de electivas
              </p>
            </div>
            <div className="flex items-center space-x-4">
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
              <Button onClick={handleExportarReporte}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Reporte
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPIs principales (HU4.6) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center text-blue-600">
              <Users className="h-4 w-4 mr-2" />
              Total Estudiantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpisData.totalEstudiantes}</div>
            <p className="text-sm text-muted-foreground">estudiantes participantes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center text-green-600">
              <Award className="h-4 w-4 mr-2" />
              Todas Asignadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{porcentajeTodasAsignadas}%</div>
            <p className="text-sm text-muted-foreground">{kpisData.conTodasAsignadas} estudiantes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center text-yellow-600">
              <TrendingUp className="h-4 w-4 mr-2" />
              Asignaciones Parciales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{porcentajeParciales}%</div>
            <p className="text-sm text-muted-foreground">{kpisData.conAsignacionesParciales} estudiantes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center text-red-600">
              <AlertCircle className="h-4 w-4 mr-2" />
              Sin Asignación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{porcentajeSinAsignacion}%</div>
            <p className="text-sm text-muted-foreground">{kpisData.sinAsignacion} estudiantes</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HU4.2: Gráfico de electivas asignadas por estudiante */}
        <Card>
          <CardHeader>
            <CardTitle>Electivas Asignadas por Estudiante</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribución de estudiantes según número de electivas asignadas
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                estudiantes: {
                  label: "Estudiantes",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={electivasPorEstudianteData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="electivas" 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="estudiantes" 
                    radius={[4, 4, 0, 0]}
                    fill={(entry) => entry.color}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Número de electivas asignadas vs. cantidad de estudiantes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Distribución de asignaciones - Gráfico de torta */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Asignaciones</CardTitle>
            <p className="text-sm text-muted-foreground">
              Porcentaje de estudiantes por estado de asignación
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Porcentaje",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribucionAsignacionesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {distribucionAsignacionesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* HU4.3: Gráfico de electivas más demandadas */}
      <Card>
        <CardHeader>
          <CardTitle>Electivas Más Demandadas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ranking por primera opción vs. demanda total
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              primeraOpcion: {
                label: "Primera Opción",
                color: "hsl(var(--chart-1))",
              },
              demandaTotal: {
                label: "Demanda Total",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={electivasDemandadasData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nombre" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="primeraOpcion" 
                  name="Primera Opción"
                  fill="#3b82f6"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="demandaTotal" 
                  name="Demanda Total"
                  fill="#06b6d4"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-4 flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm">Primera Opción</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-cyan-500 rounded"></div>
              <span className="text-sm">Demanda Total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasa de Satisfacción</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Estudiantes satisfechos</span>
                <span className="text-sm font-medium">{porcentajeTodasAsignadas + porcentajeParciales}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${porcentajeTodasAsignadas + porcentajeParciales}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">
                Con al menos una electiva asignada
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eficiencia del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Cupos utilizados</span>
                <span className="text-sm font-medium">87%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87%' }}></div>
              </div>
              <p className="text-xs text-muted-foreground">
                De todos los cupos disponibles
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Promedio de Electivas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">2.1</div>
              <p className="text-sm text-muted-foreground">electivas por estudiante</p>
              <p className="text-xs text-muted-foreground mt-2">
                Calculado sobre estudiantes con asignaciones
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}