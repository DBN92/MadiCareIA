import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Patient = Tables<'patients'>;
export type Event = Tables<'events'>;
export type Profile = Tables<'profiles'>;

export interface AssistantData {
  patients: Patient[];
  events: Event[];
  profiles: Profile[];
  summary: {
    totalPatients: number;
    activePatients: number;
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: Event[];
  };
}

export class AssistantDataService {
  /**
   * Busca todos os dados necessários para o assistente virtual
   */
  async getAllData(): Promise<AssistantData> {
    try {
      // Busca todos os pacientes
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (patientsError) {
        console.error('Erro ao buscar pacientes:', patientsError);
        throw patientsError;
      }

      // Busca todos os eventos
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('occurred_at', { ascending: false });

      if (eventsError) {
        console.error('Erro ao buscar eventos:', eventsError);
        throw eventsError;
      }

      // Busca todos os perfis
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        throw profilesError;
      }

      // Gera resumo dos dados
      const summary = this.generateSummary(patients || [], events || []);

      return {
        patients: patients || [],
        events: events || [],
        profiles: profiles || [],
        summary
      };

    } catch (error) {
      console.error('Erro ao buscar dados do Supabase:', error);
      throw error;
    }
  }

  /**
   * Busca dados de um paciente específico com seus eventos
   */
  async getPatientData(patientId: string): Promise<{
    patient: Patient | null;
    events: Event[];
  }> {
    try {
      // Busca o paciente
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError && patientError.code !== 'PGRST116') {
        console.error('Erro ao buscar paciente:', patientError);
        throw patientError;
      }

      // Busca os eventos do paciente
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('patient_id', patientId)
        .order('occurred_at', { ascending: false });

      if (eventsError) {
        console.error('Erro ao buscar eventos do paciente:', eventsError);
        throw eventsError;
      }

      return {
        patient: patient || null,
        events: events || []
      };

    } catch (error) {
      console.error('Erro ao buscar dados do paciente:', error);
      throw error;
    }
  }

  /**
   * Busca eventos por tipo com suporte aos novos tipos
   */
  async getEventsByType(eventType: 'drink' | 'meal' | 'med' | 'bathroom' | 'note' | 'medication' | 'drain' | 'vital_signs'): Promise<Event[]> {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('type', eventType)
        .order('occurred_at', { ascending: false });

      if (error) {
        console.error(`Erro ao buscar eventos do tipo ${eventType}:`, error);
        throw error;
      }

      return events || [];
    } catch (error) {
      console.error(`Erro ao buscar eventos do tipo ${eventType}:`, error);
      throw error;
    }
  }

  /**
   * Busca o último líquido tomado por um paciente
   */
  async getLastLiquidByPatient(patientId: string): Promise<Event | null> {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('patient_id', patientId)
        .eq('type', 'drink')
        .order('occurred_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erro ao buscar último líquido:', error);
        throw error;
      }

      return events?.[0] || null;
    } catch (error) {
      console.error('Erro ao buscar último líquido:', error);
      throw error;
    }
  }

  /**
   * Busca medicamentos administrados para um paciente
   */
  async getMedicationsByPatient(patientId: string, limit: number = 10): Promise<Event[]> {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('patient_id', patientId)
        .in('type', ['med', 'medication'])
        .order('occurred_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar medicamentos:', error);
        throw error;
      }

      return events || [];
    } catch (error) {
      console.error('Erro ao buscar medicamentos:', error);
      throw error;
    }
  }

  /**
   * Busca sinais vitais de um paciente
   */
  async getVitalSignsByPatient(patientId: string, limit: number = 10): Promise<Event[]> {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('patient_id', patientId)
        .eq('type', 'vital_signs')
        .order('occurred_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar sinais vitais:', error);
        throw error;
      }

      return events || [];
    } catch (error) {
      console.error('Erro ao buscar sinais vitais:', error);
      throw error;
    }
  }

  /**
   * Busca dados de drenos de um paciente
   */
  async getDrainsByPatient(patientId: string, limit: number = 10): Promise<Event[]> {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('patient_id', patientId)
        .eq('type', 'drain')
        .order('occurred_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar dados de drenos:', error);
        throw error;
      }

      return events || [];
    } catch (error) {
      console.error('Erro ao buscar dados de drenos:', error);
      throw error;
    }
  }

  /**
   * Busca eventos recentes (últimas 24 horas)
   */
  async getRecentEvents(hours: number = 24): Promise<Event[]> {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hours);

      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .gte('occurred_at', since.toISOString())
        .order('occurred_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar eventos recentes:', error);
        throw error;
      }

      return events || [];

    } catch (error) {
      console.error('Erro ao buscar eventos recentes:', error);
      throw error;
    }
  }

  /**
   * Busca pacientes ativos
   */
  async getActivePatients(): Promise<Patient[]> {
    try {
      const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar pacientes ativos:', error);
        throw error;
      }

      return patients || [];

    } catch (error) {
      console.error('Erro ao buscar pacientes ativos:', error);
      throw error;
    }
  }

  /**
   * Busca dados por consulta personalizada
   */
  async searchData(query: string): Promise<{
    patients: Patient[];
    events: Event[];
  }> {
    try {
      // Busca pacientes por nome
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .ilike('full_name', `%${query}%`);

      if (patientsError) {
        console.error('Erro ao buscar pacientes:', patientsError);
      }

      // Busca eventos por notas ou descrições
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .or(`notes.ilike.%${query}%,meal_desc.ilike.%${query}%,med_name.ilike.%${query}%`)
        .order('occurred_at', { ascending: false });

      if (eventsError) {
        console.error('Erro ao buscar eventos:', eventsError);
      }

      return {
        patients: patients || [],
        events: events || []
      };

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      throw error;
    }
  }

  /**
   * Gera um resumo dos dados
   */
  private generateSummary(patients: Patient[], events: Event[]) {
    const activePatients = patients.filter(p => p.is_active);
    
    // Conta eventos por tipo
    const eventsByType: Record<string, number> = {};
    events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    // Pega os eventos mais recentes (últimos 10)
    const recentEvents = events.slice(0, 10);

    return {
      totalPatients: patients.length,
      activePatients: activePatients.length,
      totalEvents: events.length,
      eventsByType,
      recentEvents
    };
  }

  /**
   * Formata os dados para o assistente virtual com informações detalhadas
   */
  formatDataForAssistant(data: AssistantData): string {
    const { patients, events, profiles, summary } = data;

    // Agrupa eventos por tipo para análise detalhada
    const eventsByType = events.reduce((acc, event) => {
      if (!acc[event.type]) acc[event.type] = [];
      acc[event.type].push(event);
      return acc;
    }, {} as Record<string, Event[]>);

    // Formatar informações detalhadas dos últimos eventos
    const formatEventDetails = (event: Event): string => {
      const date = new Date(event.occurred_at).toLocaleString('pt-BR');
      let details = `${event.type} - ${date}`;
      
      switch (event.type) {
        case 'drink':
          details += ` - ${event.liquid_type || 'Líquido'}: ${event.volume_ml}ml`;
          break;
        case 'meal':
          details += ` - ${event.meal_type || 'Refeição'}: ${event.consumption_percentage || 0}% consumido`;
          if (event.meal_desc) details += ` (${event.meal_desc})`;
          break;
        case 'medication':
          details += ` - ${event.medication_name || event.med_name}: ${event.dosage || event.med_dose}`;
          if (event.route) details += ` via ${event.route}`;
          break;
        case 'drain':
          details += ` - ${event.drain_type}`;
          if (event.left_amount) details += ` Esq: ${event.left_amount}ml`;
          if (event.right_amount) details += ` Dir: ${event.right_amount}ml`;
          break;
        case 'vital_signs':
          const vitals = [];
          if (event.systolic_bp && event.diastolic_bp) vitals.push(`PA: ${event.systolic_bp}/${event.diastolic_bp}mmHg`);
          if (event.heart_rate) vitals.push(`FC: ${event.heart_rate}bpm`);
          if (event.temperature) vitals.push(`T: ${event.temperature}°C`);
          if (event.oxygen_saturation) vitals.push(`SpO2: ${event.oxygen_saturation}%`);
          details += ` - ${vitals.join(', ')}`;
          break;
        case 'bathroom':
          details += ` - ${event.bathroom_type}`;
          break;
      }
      
      if (event.notes) details += ` - Obs: ${event.notes}`;
      return details;
    };

    return `
RESUMO DO SISTEMA MEDICARE:

PACIENTES:
- Total de pacientes: ${summary.totalPatients}
- Pacientes ativos: ${summary.activePatients}

EVENTOS DE CUIDADO:
- Total de eventos: ${summary.totalEvents}
- Eventos por tipo: ${Object.entries(summary.eventsByType).map(([type, count]) => `${type}: ${count}`).join(', ')}

ÚLTIMOS PACIENTES CADASTRADOS:
${patients.slice(0, 5).map(p => `- ${p.full_name} (Leito: ${p.bed || 'N/A'})`).join('\n')}

EVENTOS RECENTES DETALHADOS:
${summary.recentEvents.slice(0, 10).map(e => `- ${formatEventDetails(e)}`).join('\n')}

RESUMO POR TIPO DE CUIDADO:
${Object.entries(eventsByType).map(([type, typeEvents]) => {
  const count = typeEvents.length;
  const recent = typeEvents.slice(0, 3);
  return `\n${type.toUpperCase()} (${count} registros):
${recent.map(e => `  - ${formatEventDetails(e)}`).join('\n')}`;
}).join('\n')}

PROFISSIONAIS:
- Total de profissionais: ${profiles.length}
${profiles.slice(0, 3).map(p => `- ${p.full_name} (${p.role || 'Sem função definida'})`).join('\n')}

INSTRUÇÕES PARA CONSULTAS:
- Para buscar o último líquido de um paciente, use: "último líquido do paciente [nome]"
- Para medicamentos: "medicamentos do paciente [nome]"
- Para sinais vitais: "sinais vitais do paciente [nome]"
- Para drenos: "drenos do paciente [nome]"
    `.trim();
  }
}

// Instância singleton do serviço
export const assistantDataService = new AssistantDataService();