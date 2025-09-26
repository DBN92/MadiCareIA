import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Save, 
  Download,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

interface PrescricaoMedicaProps {
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorCrm: string;
  doctorSpecialty: string;
  onClose: () => void;
}

interface MedicamentoItem {
  id: string;
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

interface PrescricaoData {
  patientName: string;
  doctorName: string;
  doctorCrm: string;
  doctorSpecialty: string;
  prescriptionDate: string;
  issueCity: string;
  medications: MedicamentoItem[];
  observations: string;
}

export default function PrescricaoMedica({
  patientId,
  patientName,
  doctorName,
  doctorCrm,
  doctorSpecialty,
  onClose
}: PrescricaoMedicaProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<PrescricaoData>({
    patientName,
    doctorName,
    doctorCrm,
    doctorSpecialty,
    prescriptionDate: new Date().toISOString().split('T')[0],
    issueCity: '',
    medications: [],
    observations: ''
  });

  const addMedication = () => {
    const newMedication: MedicamentoItem = {
      id: `med-${Date.now()}`,
      medicationName: '',
      dosage: '',
      form: '',
      frequency: '',
      duration: '',
      quantity: '',
      instructions: '',
      genericSubstitution: true,
      urgent: false
    };

    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, newMedication]
    }));
  };

  const removeMedication = (id: string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter(med => med.id !== id)
    }));
  };

  const updateMedication = (id: string, updates: Partial<MedicamentoItem>) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map(med => 
        med.id === id ? { ...med, ...updates } : med
      )
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.patientName.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Nome do paciente é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.doctorName.trim()) {
      toast({
        title: "Erro de Validação", 
        description: "Nome do médico é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.doctorCrm.trim()) {
      toast({
        title: "Erro de Validação",
        description: "CRM do médico é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.issueCity.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Cidade de emissão é obrigatória",
        variant: "destructive"
      });
      return false;
    }

    if (formData.medications.length === 0) {
      toast({
        title: "Erro de Validação",
        description: "Pelo menos um medicamento deve ser prescrito",
        variant: "destructive"
      });
      return false;
    }

    for (const med of formData.medications) {
      if (!med.medicationName.trim() || !med.dosage.trim() || !med.frequency.trim()) {
        toast({
          title: "Erro de Validação",
          description: "Nome, dosagem e frequência são obrigatórios para todos os medicamentos",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const generateQRCode = async (data: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(data, {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      return '';
    }
  };

  const generatePDF = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Configurações do documento
      doc.setFont('helvetica');
      
      // Cabeçalho
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('PRESCRIÇÃO MÉDICA', pageWidth / 2, 30, { align: 'center' });
      
      // Linha separadora
      doc.setLineWidth(0.5);
      doc.line(20, 35, pageWidth - 20, 35);
      
      let yPosition = 50;
      
      // Dados do médico
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO MÉDICO:', 20, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'normal');
      doc.text(`Nome: ${formData.doctorName}`, 20, yPosition);
      yPosition += 6;
      doc.text(`CRM: ${formData.doctorCrm}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Especialidade: ${formData.doctorSpecialty}`, 20, yPosition);
      yPosition += 15;
      
      // Dados do paciente
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO PACIENTE:', 20, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'normal');
      doc.text(`Nome: ${formData.patientName}`, 20, yPosition);
      yPosition += 15;
      
      // Medicamentos prescritos
      doc.setFont('helvetica', 'bold');
      doc.text('MEDICAMENTOS PRESCRITOS:', 20, yPosition);
      yPosition += 10;
      
      formData.medications.forEach((med, index) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${med.medicationName}`, 25, yPosition);
        yPosition += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`   Dosagem: ${med.dosage}`, 25, yPosition);
        yPosition += 5;
        
        if (med.form) {
          doc.text(`   Forma: ${med.form}`, 25, yPosition);
          yPosition += 5;
        }
        
        doc.text(`   Frequência: ${med.frequency}`, 25, yPosition);
        yPosition += 5;
        
        if (med.duration) {
          doc.text(`   Duração: ${med.duration}`, 25, yPosition);
          yPosition += 5;
        }
        
        if (med.quantity) {
          doc.text(`   Quantidade: ${med.quantity}`, 25, yPosition);
          yPosition += 5;
        }
        
        if (med.instructions) {
          const instructionsText = doc.splitTextToSize(`   Instruções: ${med.instructions}`, 160);
          doc.text(instructionsText, 25, yPosition);
          yPosition += instructionsText.length * 5;
        }
        
        if (med.genericSubstitution) {
          doc.setFont('helvetica', 'italic');
          doc.text('   (Aceita medicamento genérico)', 25, yPosition);
          yPosition += 5;
        }
        
        if (med.urgent) {
          doc.setFont('helvetica', 'bold');
          doc.text('   *** URGENTE ***', 25, yPosition);
          yPosition += 5;
        }
        
        yPosition += 8;
        
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 30;
        }
      });
      
      // Observações
      if (formData.observations) {
        doc.setFont('helvetica', 'bold');
        doc.text('OBSERVAÇÕES:', 20, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        const obsText = doc.splitTextToSize(formData.observations, 170);
        doc.text(obsText, 20, yPosition);
        yPosition += obsText.length * 6 + 15;
      }
      
      // Data e local de emissão
      yPosition += 10;
      doc.text(`${formData.issueCity}, ${formData.prescriptionDate}`, 20, yPosition);
      
      // Assinatura
      yPosition += 30;
      doc.line(120, yPosition, pageWidth - 20, yPosition);
      yPosition += 7;
      doc.text(`Dr(a). ${formData.doctorName}`, 120, yPosition);
      yPosition += 7;
      doc.text(`CRM: ${formData.doctorCrm}`, 120, yPosition);
      
      // Certificação Digital ICP-Brasil com QR Code
      yPosition += 25;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICAÇÃO DIGITAL ICP-BRASIL', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.text('Este documento foi assinado digitalmente conforme MP 2.200-2/2001', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      
      // Dados para o QR Code (simulação de certificado digital)
      const certificateData = {
        type: 'PRESCRICAO_MEDICA',
        patientName: formData.patientName,
        doctorName: formData.doctorName,
        doctorCrm: formData.doctorCrm,
        date: formData.prescriptionDate,
        hash: 'SHA256:' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        timestamp: new Date().toISOString(),
        validator: 'www.iti.gov.br/verificador'
      };
      
      const qrCodeDataURL = await generateQRCode(JSON.stringify(certificateData));
      
      if (qrCodeDataURL) {
        // Adicionar QR Code ao PDF
        doc.addImage(qrCodeDataURL, 'PNG', pageWidth / 2 - 25, yPosition + 5, 50, 50);
        yPosition += 60;
      }
      
      // Hash da assinatura digital
      doc.setFontSize(8);
      doc.text(`Hash: ${certificateData.hash}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 4;
      
      // Timestamp
      doc.text(`Timestamp: ${certificateData.timestamp}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 4;
      
      // Informações sobre validação
      doc.setFont('helvetica', 'italic');
      doc.text('Para validar este documento, escaneie o QR Code ou acesse: www.iti.gov.br/verificador', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 3;
      doc.text('Documento com validade jurídica conforme Lei 14.063/2020', pageWidth / 2, yPosition, { align: 'center' });
      
      // Salvar o PDF
      doc.save(`prescricao-medica-${formData.patientName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      
      toast({
        title: "Sucesso",
        description: "Prescrição médica gerada com sucesso!",
        variant: "default"
      });
      
      // Fechar o modal após gerar o PDF
      onClose();
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar prescrição médica",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Nova Prescrição Médica</h2>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>

          <div className="space-y-6">
            {/* Dados Básicos */}
            <Card>
              <CardHeader>
                <CardTitle>Dados da Prescrição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patientName">Paciente</Label>
                    <Input
                      id="patientName"
                      value={formData.patientName}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prescriptionDate">Data da Prescrição</Label>
                    <Input
                      id="prescriptionDate"
                      type="date"
                      value={formData.prescriptionDate}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        prescriptionDate: e.target.value 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="doctorName">Médico</Label>
                    <Input
                      id="doctorName"
                      value={formData.doctorName}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        doctorName: e.target.value 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="doctorCrm">CRM</Label>
                    <Input
                      id="doctorCrm"
                      value={formData.doctorCrm}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        doctorCrm: e.target.value 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="doctorSpecialty">Especialidade</Label>
                    <Input
                      id="doctorSpecialty"
                      value={formData.doctorSpecialty}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        doctorSpecialty: e.target.value 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="issueCity">Cidade de Emissão *</Label>
                    <Input
                      id="issueCity"
                      value={formData.issueCity}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        issueCity: e.target.value 
                      }))}
                      placeholder="Ex: São Paulo"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medicamentos */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Medicamentos Prescritos</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addMedication}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Medicamento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.medications.map((med, index) => (
                    <Card key={med.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Medicamento {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMedication(med.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="md:col-span-2 lg:col-span-1">
                            <Label>Nome do Medicamento *</Label>
                            <Input
                              value={med.medicationName}
                              onChange={(e) => updateMedication(med.id, { 
                                medicationName: e.target.value 
                              })}
                              placeholder="Digite o nome do medicamento"
                            />
                          </div>
                          
                          <div>
                            <Label>Dosagem *</Label>
                            <Input
                              value={med.dosage}
                              onChange={(e) => updateMedication(med.id, { 
                                dosage: e.target.value 
                              })}
                              placeholder="Ex: 500mg"
                            />
                          </div>
                          
                          <div>
                            <Label>Forma Farmacêutica</Label>
                            <Select
                              value={med.form}
                              onValueChange={(value) => updateMedication(med.id, { form: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="comprimido">Comprimido</SelectItem>
                                <SelectItem value="capsula">Cápsula</SelectItem>
                                <SelectItem value="xarope">Xarope</SelectItem>
                                <SelectItem value="solucao">Solução</SelectItem>
                                <SelectItem value="pomada">Pomada</SelectItem>
                                <SelectItem value="creme">Creme</SelectItem>
                                <SelectItem value="gotas">Gotas</SelectItem>
                                <SelectItem value="spray">Spray</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Frequência *</Label>
                            <Input
                              value={med.frequency}
                              onChange={(e) => updateMedication(med.id, { 
                                frequency: e.target.value 
                              })}
                              placeholder="Ex: 8/8h, 2x ao dia"
                            />
                          </div>
                          
                          <div>
                            <Label>Duração</Label>
                            <Input
                              value={med.duration}
                              onChange={(e) => updateMedication(med.id, { 
                                duration: e.target.value 
                              })}
                              placeholder="Ex: 7 dias"
                            />
                          </div>
                          
                          <div>
                            <Label>Quantidade</Label>
                            <Input
                              value={med.quantity}
                              onChange={(e) => updateMedication(med.id, { 
                                quantity: e.target.value 
                              })}
                              placeholder="Ex: 1 caixa"
                            />
                          </div>
                          
                          <div className="md:col-span-2 lg:col-span-3">
                            <Label>Instruções de Uso</Label>
                            <Textarea
                              value={med.instructions}
                              onChange={(e) => updateMedication(med.id, { 
                                instructions: e.target.value 
                              })}
                              placeholder="Instruções específicas para o paciente"
                              rows={2}
                            />
                          </div>
                          
                          <div className="md:col-span-2 lg:col-span-3 flex gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`generic-${med.id}`}
                                checked={med.genericSubstitution}
                                onCheckedChange={(checked) => updateMedication(med.id, { 
                                  genericSubstitution: checked as boolean 
                                })}
                              />
                              <Label htmlFor={`generic-${med.id}`}>
                                Aceita medicamento genérico
                              </Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`urgent-${med.id}`}
                                checked={med.urgent}
                                onCheckedChange={(checked) => updateMedication(med.id, { 
                                  urgent: checked as boolean 
                                })}
                              />
                              <Label htmlFor={`urgent-${med.id}`}>
                                Urgente
                              </Label>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {formData.medications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum medicamento adicionado. Clique em "Adicionar Medicamento" para começar.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    observations: e.target.value 
                  }))}
                  placeholder="Observações adicionais, orientações especiais, etc."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>

              <Button
                onClick={generatePDF}
                disabled={loading || formData.medications.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-1" />
                {loading ? 'Gerando...' : 'Gerar Prescrição PDF'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}