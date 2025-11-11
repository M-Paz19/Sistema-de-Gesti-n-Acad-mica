import { useState } from 'react';
import { BarChart3, FileText, Search, Users, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ReportesAsignacionModule } from './reportes-asignacion-module';
import { EstadisticasModule } from './estadisticas-module';
import { ConsultasModule } from './consultas-module';

export function ReportesModule() {
  const [activeTab, setActiveTab] = useState('asignacion');

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div>
          <h1>Reportes y Estadísticas</h1>
          <p className="text-muted-foreground">Genera reportes y consulta estadísticas del sistema</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-6 pt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="asignacion" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Reportes de Asignación</span>
              </TabsTrigger>
              <TabsTrigger value="estadisticas" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Estadísticas</span>
              </TabsTrigger>
              <TabsTrigger value="consultas" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Consultas</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="asignacion" className="flex-1 overflow-hidden">
            <ReportesAsignacionModule />
          </TabsContent>

          <TabsContent value="estadisticas" className="flex-1 overflow-hidden">
            <EstadisticasModule />
          </TabsContent>

          <TabsContent value="consultas" className="flex-1 overflow-hidden">
            <ConsultasModule />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}