import { useState } from 'react';
import { Sidebar } from './components/sidebar-navigation';
import { ProgramasModule } from './components/programas-module';
import { PlanesModule } from './components/planes-module';
import { DepartamentosModule } from './components/departamentos-module';
import { ElectivasModule } from './components/electivas-module';
import { PeriodosModule } from './components/periodos-module';
import { ProcesamientoModule } from './components/procesamiento-module';
import { ReportesModule } from './components/reportes-module';
import { SidebarProvider } from './components/ui/sidebar';
import { Toaster } from './components/ui/sonner';

export type ActiveModule = 'programas' | 'planes' | 'departamentos' | 'electivas' | 'periodos' | 'procesamiento' | 'reportes';

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('programas');

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'programas':
        return <ProgramasModule />;
      case 'planes':
        return <PlanesModule />;
      case 'departamentos':
        return <DepartamentosModule />;
      case 'electivas':
        return <ElectivasModule />;
      case 'periodos':
        return <PeriodosModule />;
      case 'procesamiento':
        return <ProcesamientoModule />;
      case 'reportes':
        return <ReportesModule />;
      default:
        return <ProgramasModule />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
        <main className="flex-1 overflow-hidden">
          {renderActiveModule()}
        </main>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}