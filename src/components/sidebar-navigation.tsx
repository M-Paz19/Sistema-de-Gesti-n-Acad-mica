import { 
  BookOpen, 
  Calendar, 
  FileSpreadsheet, 
  GraduationCap, 
  Settings, 
  Users,
  BarChart3
} from 'lucide-react';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from './ui/sidebar';
import { UnicaucaLogotipo } from './unicauca-logo';
import type { ActiveModule } from '../App';

const navigation = [
  {
    name: 'Programas',
    icon: GraduationCap,
    id: 'programas' as ActiveModule,
    color: '#FDB913',
  },
  {
    name: 'Planes de Estudio',
    icon: BookOpen,
    id: 'planes' as ActiveModule,
    color: '#ffd966',
  },
  {
    name: 'Departamentos',
    icon: Users,
    id: 'departamentos' as ActiveModule,
    color: '#FDB913',
  },
  {
    name: 'Electivas',
    icon: FileSpreadsheet,
    id: 'electivas' as ActiveModule,
    color: '#ffd966',
  },
  {
    name: 'Periodos',
    icon: Calendar,
    id: 'periodos' as ActiveModule,
    color: '#FDB913',
  },
  {
    name: 'Procesamiento',
    icon: Settings,
    id: 'procesamiento' as ActiveModule,
    color: '#ffd966',
  },
  {
    name: 'Reportes y Estadísticas',
    icon: BarChart3,
    id: 'reportes' as ActiveModule,
    color: '#FDB913',
  },
];

interface SidebarProps {
  activeModule: ActiveModule;
  onModuleChange: (module: ActiveModule) => void;
}

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  return (
    <SidebarPrimitive className="border-r-2 border-[#FDB913]/20">
      <SidebarHeader className="border-b-2 border-[#FDB913]/30 bg-gradient-to-br from-[#003366] to-[#001f3f]">
        <div className="p-4">
          <UnicaucaLogotipo />
          <div className="mt-3 pt-3 border-t border-[#FDB913]/20">
            <p className="text-white/90 text-sm">Sistema de Gestión Académica</p>
            <p className="text-[#FDB913]/80 text-xs mt-0.5">Módulo de Electivas</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-gradient-to-b from-[#003366] to-[#001f3f]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = activeModule === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onModuleChange(item.id)}
                      isActive={isActive}
                      className={`
                        group relative overflow-hidden transition-all duration-200
                        ${isActive 
                          ? 'bg-[#FDB913] text-[#003366] hover:bg-[#FDB913] shadow-lg shadow-[#FDB913]/20' 
                          : 'text-white/90 hover:bg-[#0d4f8b] hover:text-white'
                        }
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#003366]" />
                      )}
                      <item.icon 
                        className={`h-5 w-5 transition-transform duration-200 ${
                          isActive ? 'scale-110' : 'group-hover:scale-105'
                        }`}
                        style={{ color: isActive ? '#003366' : item.color }}
                      />
                      <span className={isActive ? 'font-semibold' : ''}>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t-2 border-[#FDB913]/30 bg-gradient-to-br from-[#001f3f] to-[#003366]">
        <div className="p-4 text-center">
          <p className="text-white/60 text-xs">
            © 2025 Universidad del Cauca
          </p>
          <p className="text-[#FDB913]/60 text-xs mt-1">
            Versión 1.0
          </p>
        </div>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
