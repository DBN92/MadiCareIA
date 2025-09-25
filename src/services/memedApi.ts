/**
 * Serviço de integração com a API do Memed
 * Documentação: https://memed.com.br/developers
 */

export interface MemedConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  environment: 'sandbox' | 'production';
}

export interface MemedMedication {
  id: string;
  name: string;
  activeIngredient: string;
  concentration: string;
  form: string;
  ean?: string;
  laboratory?: string;
  price?: number;
  genericAvailable?: boolean;
}

export interface MemedPrescriptionItem {
  medicationId: string;
  medicationName: string;
  dosage: string;
  form: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions: string;
  genericSubstitution: boolean;
  urgent: boolean;
}

export interface MemedPrescription {
  id?: string;
  patientName: string;
  patientCpf?: string;
  patientBirthDate?: string;
  patientGender?: 'M' | 'F';
  doctorName: string;
  doctorCrm: string;
  doctorCrmState: string;
  items: MemedPrescriptionItem[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: 'draft' | 'active' | 'dispensed' | 'cancelled';
  url?: string;
}

export interface MemedApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class MemedApiService {
  private config: MemedConfig;

  constructor(config: MemedConfig) {
    this.config = config;
  }

  /**
   * Configura as credenciais da API do Memed
   */
  setConfig(config: Partial<MemedConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Gera headers de autenticação para as requisições
   */
  private getAuthHeaders(): Record<string, string> {
    const timestamp = Date.now().toString();
    const signature = this.generateSignature(timestamp);
    
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
    };
  }

  /**
   * Gera assinatura para autenticação
   */
  private generateSignature(timestamp: string): string {
    // Implementação simplificada - em produção usar crypto adequado
    const crypto = require('crypto');
    const message = `${this.config.apiKey}${timestamp}`;
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(message)
      .digest('hex');
  }

  /**
   * Realiza requisição para a API do Memed
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<MemedApiResponse<T>> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      const headers = this.getAuthHeaders();

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: responseData.message || 'Erro na API do Memed',
            details: responseData,
          },
        };
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Erro de conexão com a API do Memed',
          details: error,
        },
      };
    }
  }

  /**
   * Busca medicamentos na base do Memed
   */
  async searchMedications(query: string, limit: number = 20): Promise<MemedApiResponse<MemedMedication[]>> {
    return this.makeRequest<MemedMedication[]>(`/medications/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  /**
   * Obtém detalhes de um medicamento específico
   */
  async getMedication(medicationId: string): Promise<MemedApiResponse<MemedMedication>> {
    return this.makeRequest<MemedMedication>(`/medications/${medicationId}`);
  }

  /**
   * Cria uma nova prescrição no Memed
   */
  async createPrescription(prescription: Omit<MemedPrescription, 'id' | 'createdAt' | 'updatedAt' | 'url'>): Promise<MemedApiResponse<MemedPrescription>> {
    return this.makeRequest<MemedPrescription>('/prescriptions', 'POST', prescription);
  }

  /**
   * Atualiza uma prescrição existente
   */
  async updatePrescription(prescriptionId: string, prescription: Partial<MemedPrescription>): Promise<MemedApiResponse<MemedPrescription>> {
    return this.makeRequest<MemedPrescription>(`/prescriptions/${prescriptionId}`, 'PUT', prescription);
  }

  /**
   * Obtém detalhes de uma prescrição
   */
  async getPrescription(prescriptionId: string): Promise<MemedApiResponse<MemedPrescription>> {
    return this.makeRequest<MemedPrescription>(`/prescriptions/${prescriptionId}`);
  }

  /**
   * Lista prescrições do médico
   */
  async listPrescriptions(filters?: {
    patientName?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<MemedApiResponse<{ prescriptions: MemedPrescription[]; total: number }>> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/prescriptions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Cancela uma prescrição
   */
  async cancelPrescription(prescriptionId: string, reason?: string): Promise<MemedApiResponse<MemedPrescription>> {
    return this.makeRequest<MemedPrescription>(`/prescriptions/${prescriptionId}/cancel`, 'POST', { reason });
  }

  /**
   * Gera URL pública da prescrição para compartilhamento
   */
  async generatePrescriptionUrl(prescriptionId: string): Promise<MemedApiResponse<{ url: string }>> {
    return this.makeRequest<{ url: string }>(`/prescriptions/${prescriptionId}/url`, 'POST');
  }

  /**
   * Valida se as credenciais estão corretas
   */
  async validateCredentials(): Promise<MemedApiResponse<{ valid: boolean }>> {
    return this.makeRequest<{ valid: boolean }>('/auth/validate');
  }

  /**
   * Obtém informações do médico autenticado
   */
  async getDoctorInfo(): Promise<MemedApiResponse<{
    name: string;
    crm: string;
    crmState: string;
    specialty?: string;
    email?: string;
  }>> {
    return this.makeRequest('/doctor/profile');
  }
}

// Configuração padrão (sandbox)
const defaultConfig: MemedConfig = {
  apiKey: process.env.VITE_MEMED_API_KEY || '',
  secretKey: process.env.VITE_MEMED_SECRET_KEY || '',
  baseUrl: process.env.VITE_MEMED_BASE_URL || 'https://api.sandbox.memed.com.br/v1',
  environment: (process.env.VITE_MEMED_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
};

// Instância singleton do serviço
export const memedApi = new MemedApiService(defaultConfig);

// Utilitários para conversão de dados
export const MemedUtils = {
  /**
   * Converte dados do prontuário para formato do Memed
   */
  convertPrescriptionToMemed(
    prescription: any,
    patient: any,
    doctor: any
  ): Omit<MemedPrescription, 'id' | 'createdAt' | 'updatedAt' | 'url'> {
    return {
      patientName: patient.full_name,
      patientCpf: patient.cpf,
      patientBirthDate: patient.birth_date,
      patientGender: patient.gender,
      doctorName: doctor.full_name,
      doctorCrm: doctor.crm,
      doctorCrmState: doctor.crm_state,
      items: prescription.items?.map((item: any) => ({
        medicationId: item.memed_medication_id || '',
        medicationName: item.medication_name,
        dosage: item.dosage,
        form: item.form,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        instructions: item.instructions,
        genericSubstitution: item.generic_substitution,
        urgent: item.urgent,
      })) || [],
      notes: prescription.notes,
    };
  },

  /**
   * Converte resposta do Memed para formato do banco
   */
  convertMemedToPrescription(memedPrescription: MemedPrescription): any {
    return {
      memed_prescription_id: memedPrescription.id,
      memed_url: memedPrescription.url,
      memed_status: memedPrescription.status,
      memed_created_at: memedPrescription.createdAt,
      memed_updated_at: memedPrescription.updatedAt,
      total_items: memedPrescription.items.length,
      notes: memedPrescription.notes,
    };
  },

  /**
   * Formata erros da API do Memed
   */
  formatError(error: MemedApiResponse<any>['error']): string {
    if (!error) return 'Erro desconhecido';
    
    switch (error.code) {
      case '401':
        return 'Credenciais inválidas do Memed';
      case '403':
        return 'Acesso negado à API do Memed';
      case '404':
        return 'Recurso não encontrado no Memed';
      case '429':
        return 'Limite de requisições excedido';
      case 'NETWORK_ERROR':
        return 'Erro de conexão com o Memed';
      default:
        return error.message || 'Erro na integração com Memed';
    }
  },
};

export default MemedApiService;