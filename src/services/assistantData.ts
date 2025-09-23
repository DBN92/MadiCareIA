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
   * Busca eventos por tipo
   */
  async getEventsByType(eventType: 'drink' | 'meal' | 'med' | 'bathroom' | 'note'): Promise<Event[]> {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('type', eventType)
        .order('occurred_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar eventos por tipo:', error);
        throw error;
      }

      return events || [];

    } catch (error) {
      console.error('Erro ao buscar eventos por tipo:', error);
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
   * Formata os dados para o contexto do assistente
   */
  formatDataForAssistant(data: AssistantData): string {
    const { patients, events, profiles, summary } = data;

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

EVENTOS RECENTES:
${summary.recentEvents.slice(0, 5).map(e => `- ${e.type} - ${new Date(e.occurred_at).toLocaleString('pt-BR')}`).join('\n')}

PROFISSIONAIS:
- Total de profissionais: ${profiles.length}
${profiles.slice(0, 3).map(p => `- ${p.full_name} (${p.role || 'Sem função definida'})`).join('\n')}
    `.trim();
  }
}

// Instância singleton do serviço
export const assistantDataService = new AssistantDataService();