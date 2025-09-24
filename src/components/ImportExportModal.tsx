import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useImportExport, ExportOptions, ImportResult } from "@/hooks/useImportExport"
import { usePatients } from "@/hooks/usePatients"
import { useToast } from "@/hooks/use-toast"
import { 
  Download, 
  Upload, 
  FileText, 
  Database,
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"

interface ImportExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPatientId?: string
}

export const ImportExportModal = ({ open, onOpenChange, defaultPatientId }: ImportExportModalProps) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    patientId: defaultPatientId || 'all',
    format: 'json',
    eventTypes: []
  })
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const { exportCareEvents, importCareEvents, loading } = useImportExport()
  const { patients } = usePatients()
  const { toast } = useToast()

  const eventTypeOptions = [
    { value: 'med', label: 'Medicamentos', icon: '💊' },
    { value: 'drink', label: 'Líquidos', icon: '💧' },
    { value: 'meal', label: 'Refeições', icon: '🍽️' },
    { value: 'bathroom', label: 'Higiene', icon: '🚿' },
    { value: 'note', label: 'Anotações', icon: '📝' }
  ]

  const handleExport = async () => {
    try {
      await exportCareEvents(exportOptions)
      toast({
        title: "Exportação concluída",
        description: "Os dados foram exportados com sucesso.",
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "Arquivo necessário",
        description: "Selecione um arquivo para importar.",
        variant: "destructive"
      })
      return
    }

    try {
      const result = await importCareEvents(importFile)
      setImportResult(result)
      
      if (result.success) {
        toast({
          title: "Importação concluída",
          description: `${result.imported} registros importados com sucesso.`,
        })
      } else {
        toast({
          title: "Problemas na importação",
          description: "Verifique os detalhes abaixo.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    }
  }

  const handleEventTypeChange = (eventType: string, checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      eventTypes: checked 
        ? [...(prev.eventTypes || []), eventType]
        : (prev.eventTypes || []).filter(type => type !== eventType)
    }))
  }

  const resetImport = () => {
    setImportFile(null)
    setImportResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Importar / Exportar Cuidados
          </DialogTitle>
          <DialogDescription>
            Gerencie seus dados de cuidados - exporte para backup ou importe dados existentes
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === 'export' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('export')}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant={activeTab === 'import' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('import')}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Opções de Exportação</CardTitle>
                <CardDescription>
                  Configure os filtros para exportar apenas os dados necessários
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Seleção de Paciente */}
                <div className="space-y-2">
                  <Label>Paciente</Label>
                  <Select 
                    value={exportOptions.patientId} 
                    onValueChange={(value) => setExportOptions(prev => ({ ...prev, patientId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os pacientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os pacientes</SelectItem>
                      {patients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.full_name} {patient.bed && `- Leito ${patient.bed}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Período */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Inicial</Label>
                    <Input
                      type="date"
                      value={exportOptions.startDate || ''}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Final</Label>
                    <Input
                      type="date"
                      value={exportOptions.endDate || ''}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Tipos de Eventos */}
                <div className="space-y-2">
                  <Label>Tipos de Cuidados</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {eventTypeOptions.map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.value}
                          checked={(exportOptions.eventTypes || []).includes(option.value)}
                          onCheckedChange={(checked) => handleEventTypeChange(option.value, checked as boolean)}
                        />
                        <Label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer">
                          <span>{option.icon}</span>
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {exportOptions.eventTypes?.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum tipo selecionado = todos os tipos serão exportados
                    </p>
                  )}
                </div>

                {/* Formato */}
                <div className="space-y-2">
                  <Label>Formato do Arquivo</Label>
                  <Select 
                    value={exportOptions.format} 
                    onValueChange={(value: 'json' | 'csv') => setExportOptions(prev => ({ ...prev, format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          JSON (recomendado para re-importação)
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          CSV (para planilhas)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleExport} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </Button>
            </div>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            {!importResult ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Importar Cuidados</CardTitle>
                  <CardDescription>
                    Selecione um arquivo JSON ou CSV para importar registros de cuidados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Arquivo de Dados</Label>
                    <Input
                      type="file"
                      accept=".json,.csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Formatos aceitos: JSON, CSV. Máximo 10MB.
                    </p>
                  </div>

                  {importFile && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{importFile.name}</span>
                        <Badge variant="secondary">
                          {(importFile.size / 1024).toFixed(1)} KB
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <h4 className="font-medium text-primary mb-2">⚠️ Importante:</h4>
                    <ul className="text-sm text-primary/80 space-y-1">
                      <li>• Registros duplicados (mesmo ID) serão ignorados</li>
                      <li>• Dados inválidos serão rejeitados com relatório de erros</li>
                      <li>• Faça backup antes de importar dados importantes</li>
                      <li>• Pacientes referenciados devem existir no sistema</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {importResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    Resultado da Importação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                      <div className="text-sm text-muted-foreground">Importados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                      <div className="text-sm text-muted-foreground">Duplicados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                      <div className="text-sm text-muted-foreground">Erros</div>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <Label>Erros Encontrados:</Label>
                      <div className="max-h-32 overflow-y-auto bg-red-50 border border-red-200 rounded p-3">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-800">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              {!importResult ? (
                <Button onClick={handleImport} disabled={!importFile || loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Dados
                </Button>
              ) : (
                <Button onClick={resetImport} variant="outline">
                  Nova Importação
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}