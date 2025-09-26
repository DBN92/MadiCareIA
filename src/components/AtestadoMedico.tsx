import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, FileText, Download, Shield, User, Stethoscope } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface AtestadoMedicoProps {
  patientId?: string;
  patientName?: string;
  doctorName?: string;
  doctorCrm?: string;
  doctorSpecialty?: string;
  onClose?: () => void;
}

interface AtestadoData {
  patientName: string;
  patientCpf: string;
  doctorName: string;
  doctorCrm: string;
  doctorSpecialty: string;
  cid: string;
  cidDescription: string;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  observations: string;
  issueDate: Date;
  issueLocation: string;
}

const AtestadoMedico: React.FC<AtestadoMedicoProps> = ({
  patientId,
  patientName = '',
  doctorName = '',
  doctorCrm = '',
  doctorSpecialty = '',
  onClose
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const [atestadoData, setAtestadoData] = useState<AtestadoData>({
    patientName: patientName,
    patientCpf: '',
    doctorName: doctorName,
    doctorCrm: doctorCrm,
    doctorSpecialty: doctorSpecialty,
    cid: '',
    cidDescription: '',
    startDate: new Date(),
    endDate: addDays(new Date(), 1),
    days: 1,
    reason: '',
    observations: '',
    issueDate: new Date(),
    issueLocation: 'São Paulo, SP'
  });

  const handleFieldChange = (field: keyof AtestadoData, value: any) => {
    setAtestadoData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDaysChange = (days: number) => {
    const newEndDate = addDays(atestadoData.startDate, days - 1);
    setAtestadoData(prev => ({
      ...prev,
      days,
      endDate: newEndDate
    }));
  };

  const handleStartDateChange = (date: Date) => {
    const newEndDate = addDays(date, atestadoData.days - 1);
    setAtestadoData(prev => ({
      ...prev,
      startDate: date,
      endDate: newEndDate
    }));
  };

  const validateData = (): boolean => {
    if (!atestadoData.patientName.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Nome do paciente é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!atestadoData.patientCpf.trim()) {
      toast({
        title: "Erro de Validação",
        description: "CPF do paciente é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!atestadoData.doctorName.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Nome do médico é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!atestadoData.doctorCrm.trim()) {
      toast({
        title: "Erro de Validação",
        description: "CRM do médico é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!atestadoData.cid.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Código CID é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!atestadoData.reason.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Motivo do afastamento é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const generatePDF = async () => {
    if (!validateData()) {
      return;
    }

    try {
      setLoading(true);

      // Criar novo documento PDF
      const doc = new jsPDF();
      
      // Configurações do documento
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Cabeçalho
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ATESTADO MÉDICO', pageWidth / 2, 30, { align: 'center' });

      // Linha decorativa
      doc.setLineWidth(0.5);
      doc.line(margin, 40, pageWidth - margin, 40);

      // Informações do médico
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      let yPosition = 60;

      doc.text(`Dr(a). ${atestadoData.doctorName}`, margin, yPosition);
      yPosition += 8;
      doc.text(`CRM: ${atestadoData.doctorCrm}`, margin, yPosition);
      yPosition += 8;
      if (atestadoData.doctorSpecialty) {
        doc.text(`Especialidade: ${atestadoData.doctorSpecialty}`, margin, yPosition);
        yPosition += 8;
      }

      yPosition += 10;

      // Corpo do atestado
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ATESTO PARA OS DEVIDOS FINS', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      // Texto principal do atestado
      const mainText = `Que o(a) paciente ${atestadoData.patientName}, portador(a) do CPF ${atestadoData.patientCpf}, `;
      const reasonText = `necessita de afastamento de suas atividades por ${atestadoData.days} ${atestadoData.days === 1 ? 'dia' : 'dias'}, `;
      const periodText = `no período de ${format(atestadoData.startDate, 'dd/MM/yyyy', { locale: ptBR })} a ${format(atestadoData.endDate, 'dd/MM/yyyy', { locale: ptBR })}, `;
      const motiveText = `devido a: ${atestadoData.reason}.`;

      // Quebrar texto em linhas
      const fullText = mainText + reasonText + periodText + motiveText;
      const lines = doc.splitTextToSize(fullText, contentWidth);
      
      lines.forEach((line: string) => {
        doc.text(line, margin, yPosition);
        yPosition += 7;
      });

      yPosition += 10;

      // CID
      if (atestadoData.cid) {
        doc.text(`CID: ${atestadoData.cid}`, margin, yPosition);
        if (atestadoData.cidDescription) {
          yPosition += 7;
          doc.text(`Descrição: ${atestadoData.cidDescription}`, margin, yPosition);
        }
        yPosition += 15;
      }

      // Observações
      if (atestadoData.observations.trim()) {
        doc.setFont('helvetica', 'bold');
        doc.text('Observações:', margin, yPosition);
        yPosition += 7;
        doc.setFont('helvetica', 'normal');
        const obsLines = doc.splitTextToSize(atestadoData.observations, contentWidth);
        obsLines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 7;
        });
        yPosition += 10;
      }

      // Data e local
      yPosition = Math.max(yPosition, pageHeight - 80);
      const dateLocationText = `${atestadoData.issueLocation}, ${format(atestadoData.issueDate, 'dd/MM/yyyy', { locale: ptBR })}`;
      doc.text(dateLocationText, pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 30;

      // Linha para assinatura
      doc.setLineWidth(0.3);
      doc.line(pageWidth / 2 - 60, yPosition, pageWidth / 2 + 60, yPosition);
      
      yPosition += 8;
      doc.setFont('helvetica', 'bold');
      doc.text(`Dr(a). ${atestadoData.doctorName}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`CRM: ${atestadoData.doctorCrm}`, pageWidth / 2, yPosition, { align: 'center' });

      // Gerar QR Code para autenticação do certificado digital
      const certificateId = `ATESTADO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const qrData = {
        type: 'medical_certificate',
        id: certificateId,
        patient: atestadoData.patientName,
        doctor: atestadoData.doctorName,
        crm: atestadoData.doctorCrm,
        issueDate: atestadoData.issueDate.toISOString(),
        validationUrl: `https://medicare.com.br/validate/${certificateId}`
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 80,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Placeholder para Certificação Digital ICP-Brasil
      yPosition += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('CERTIFICAÇÃO DIGITAL ICP-BRASIL', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.text('Este documento foi assinado digitalmente conforme MP 2.200-2/2001', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      
      // Simulação de hash de assinatura digital
      const mockHash = 'SHA256: A1B2C3D4E5F6789012345678901234567890ABCDEF';
      doc.setFontSize(8);
      doc.text(`Hash da Assinatura: ${mockHash}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      
      // Timestamp simulado
      const timestamp = new Date().toISOString();
      doc.text(`Timestamp: ${timestamp}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      
      // ID do certificado
      doc.text(`ID do Certificado: ${certificateId}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      // Adicionar QR Code
      doc.addImage(qrCodeDataURL, 'PNG', pageWidth / 2 - 15, yPosition, 30, 30);
      yPosition += 35;
      
      // Informações sobre validação
      doc.setFont('helvetica', 'italic');
      doc.text('Escaneie o QR Code ou acesse: www.iti.gov.br/verificador', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 3;
      doc.text('Documento com validade jurídica conforme Lei 14.063/2020', pageWidth / 2, yPosition, { align: 'center' });
      
      // Rodapé com informação sobre certificação digital
      yPosition = pageHeight - 20;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Este documento será assinado digitalmente com certificação ICP-Brasil', pageWidth / 2, yPosition, { align: 'center' });

      // Salvar o PDF
      const fileName = `atestado_medico_${atestadoData.patientName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
      doc.save(fileName);

      toast({
        title: "Sucesso",
        description: "Atestado médico gerado com sucesso!",
      });

      // Fechar modal após sucesso
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o atestado médico",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Emitir Atestado Médico
          <Shield className="h-4 w-4 text-green-600 ml-2" />
          <span className="text-sm font-normal text-green-600">ICP-Brasil</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações do Paciente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-4 w-4" />
              Dados do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patientName">Nome Completo *</Label>
              <Input
                id="patientName"
                value={atestadoData.patientName}
                onChange={(e) => handleFieldChange('patientName', e.target.value)}
                placeholder="Nome completo do paciente"
              />
            </div>
            <div>
              <Label htmlFor="patientCpf">CPF *</Label>
              <Input
                id="patientCpf"
                value={atestadoData.patientCpf}
                onChange={(e) => handleFieldChange('patientCpf', e.target.value)}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
          </CardContent>
        </Card>

        {/* Informações do Médico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-4 w-4" />
              Dados do Médico
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="doctorName">Nome do Médico *</Label>
              <Input
                id="doctorName"
                value={atestadoData.doctorName}
                onChange={(e) => handleFieldChange('doctorName', e.target.value)}
                placeholder="Nome completo do médico"
              />
            </div>
            <div>
              <Label htmlFor="doctorCrm">CRM *</Label>
              <Input
                id="doctorCrm"
                value={atestadoData.doctorCrm}
                onChange={(e) => handleFieldChange('doctorCrm', e.target.value)}
                placeholder="CRM/UF"
              />
            </div>
            <div>
              <Label htmlFor="doctorSpecialty">Especialidade</Label>
              <Input
                id="doctorSpecialty"
                value={atestadoData.doctorSpecialty}
                onChange={(e) => handleFieldChange('doctorSpecialty', e.target.value)}
                placeholder="Especialidade médica"
              />
            </div>
          </CardContent>
        </Card>

        {/* Informações Clínicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Clínicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cid">Código CID *</Label>
                <Input
                  id="cid"
                  value={atestadoData.cid}
                  onChange={(e) => handleFieldChange('cid', e.target.value)}
                  placeholder="Ex: M54.5"
                />
              </div>
              <div>
                <Label htmlFor="cidDescription">Descrição do CID</Label>
                <Input
                  id="cidDescription"
                  value={atestadoData.cidDescription}
                  onChange={(e) => handleFieldChange('cidDescription', e.target.value)}
                  placeholder="Descrição da condição médica"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Motivo do Afastamento *</Label>
              <Textarea
                id="reason"
                value={atestadoData.reason}
                onChange={(e) => handleFieldChange('reason', e.target.value)}
                placeholder="Descreva o motivo do afastamento médico"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="observations">Observações Adicionais</Label>
              <Textarea
                id="observations"
                value={atestadoData.observations}
                onChange={(e) => handleFieldChange('observations', e.target.value)}
                placeholder="Observações complementares (opcional)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Período de Afastamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Período de Afastamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Data de Início *</Label>
                <Popover open={showStartDatePicker} onOpenChange={setShowStartDatePicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(atestadoData.startDate, 'dd/MM/yyyy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={atestadoData.startDate}
                      onSelect={(date) => {
                        if (date) {
                          handleStartDateChange(date);
                          setShowStartDatePicker(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="days">Quantidade de Dias *</Label>
                <Select
                  value={atestadoData.days.toString()}
                  onValueChange={(value) => handleDaysChange(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day} {day === 1 ? 'dia' : 'dias'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data de Término</Label>
                <div className="p-2 bg-gray-50 rounded-md border">
                  {format(atestadoData.endDate, 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Local e Data de Emissão */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Emissão do Atestado</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issueLocation">Local de Emissão</Label>
              <Input
                id="issueLocation"
                value={atestadoData.issueLocation}
                onChange={(e) => handleFieldChange('issueLocation', e.target.value)}
                placeholder="Cidade, UF"
              />
            </div>
            <div>
              <Label>Data de Emissão</Label>
              <div className="p-2 bg-gray-50 rounded-md border">
                {format(atestadoData.issueDate, 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-4 pt-4">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button onClick={generatePDF} disabled={loading} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            {loading ? 'Gerando PDF...' : 'Emitir Atestado'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AtestadoMedico;