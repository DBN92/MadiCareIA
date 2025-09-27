import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePatients } from "@/hooks/usePatients"
import { useCareEvents } from "@/hooks/useCareEvents"
import { useToast } from "@/hooks/use-toast"
import { 
  FileText, 
  Download, 
  BarChart3,
  TrendingUp,
  Calendar,
  User,
  Loader2
} from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Tooltip, LabelList } from "recharts"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const Reports = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [isExporting, setIsExporting] = useState(false)
  const { patients } = usePatients()
  const { events } = useCareEvents()
  const { toast } = useToast()

  // Filtrar eventos do paciente selecionado
  const patientEvents = selectedPatientId 
    ? events.filter(event => event.patient_id === selectedPatientId)
    : []

  // Função para processar dados diários
  const getDailyData = () => {
    const dailyStats: Record<string, any> = {}
    
    patientEvents.forEach(event => {
      const date = event.date.split('T')[0]
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          alimentosPercent: 0,
          alimentosCount: 0,
          medicamentosCount: 0,
          banheiroCount: 0,
          totalLiquidos: 0,
          liquidosML: 0,
          drenosML: 0,
          urinaML: 0,
          humorScore: 0,
          humorCount: 0,
          sinaisVitais: {
            pressaoSistolica: 0,
            pressaoDiastolica: 0,
            frequenciaCardiaca: 0,
            temperatura: 0,
            saturacaoOxigenio: 0,
            frequenciaRespiratoria: 0,
            count: 0
          }
        }
      }

      // Processar diferentes tipos de eventos
      switch (event.type) {
        case 'feeding':
          if (event.consumption_percentage) {
            dailyStats[date].alimentosPercent += event.consumption_percentage
            dailyStats[date].alimentosCount++
          }
          break
        case 'bathroom':
          dailyStats[date].banheiroCount++
          if (event.volume_ml) {
            dailyStats[date].urinaML += event.volume_ml
          }
          break
        case 'mood':
          if (event.mood_scale) {
            dailyStats[date].humorScore += event.mood_scale
            dailyStats[date].humorCount++
          }
          break
      }
    })

    // Calcular médias
    Object.keys(dailyStats).forEach(date => {
      const stats = dailyStats[date]
      if (stats.alimentosCount > 0) {
        stats.alimentosPercent = Math.round(stats.alimentosPercent / stats.alimentosCount)
      }
      if (stats.humorCount > 0) {
        stats.humorScore = Math.round(stats.humorScore / stats.humorCount)
      }
      if (stats.sinaisVitais.count > 0) {
        const vitals = stats.sinaisVitais
        vitals.pressaoSistolica = Math.round(vitals.pressaoSistolica / vitals.count)
        vitals.pressaoDiastolica = Math.round(vitals.pressaoDiastolica / vitals.count)
        vitals.frequenciaCardiaca = Math.round(vitals.frequenciaCardiaca / vitals.count)
        vitals.temperatura = Math.round((vitals.temperatura / vitals.count) * 10) / 10
        vitals.saturacaoOxigenio = Math.round(vitals.saturacaoOxigenio / vitals.count)
        vitals.frequenciaRespiratoria = Math.round(vitals.frequenciaRespiratoria / vitals.count)
      }
    })

    return Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        ...stats
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const dailyData = getDailyData()

  // Dados para gráficos específicos
  const alimentosData = dailyData.filter(day => day.alimentosCount > 0)
  const liquidosData = dailyData.filter(day => day.liquidosML > 0)
  const urinaData = dailyData.filter(day => day.urinaML > 0)
  const humorData = dailyData.filter(day => day.humorScore > 0)
  const sinaisVitaisData = dailyData.filter(day => day.sinaisVitais.count > 0)

  const exportToPDF = async () => {
    if (!selectedPatientId) {
      toast({
        title: "Erro",
        description: "Selecione um paciente para exportar o relatório",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)
    
    try {
      const element = document.getElementById('report-content')
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      const selectedPatient = patients.find(p => p.id === selectedPatientId)
      const fileName = `relatorio-${selectedPatient?.full_name || 'paciente'}-${new Date().toISOString().split('T')[0]}.pdf`
      
      pdf.save(fileName)
      
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const selectedPatient = patients.find(p => p.id === selectedPatientId)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Visualize e exporte relatórios detalhados dos cuidados
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecionar paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {patient.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={exportToPDF}
            disabled={!selectedPatientId || isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exportar PDF
          </Button>
        </div>
      </div>

      {!selectedPatientId ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecione um paciente</h3>
              <p className="text-muted-foreground">
                Escolha um paciente para visualizar seus relatórios
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div id="report-content" className="space-y-6">
          {/* Header do Relatório */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Relatório de {selectedPatient?.full_name}
              </CardTitle>
              <CardDescription>
                Período: {dailyData.length > 0 ? `${dailyData[0]?.date} até ${dailyData[dailyData.length - 1]?.date}` : 'Sem dados'}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patientEvents.length}</div>
                <p className="text-xs text-muted-foreground">
                  registros de cuidados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dias com Registros</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyData.length}</div>
                <p className="text-xs text-muted-foreground">
                  dias monitorados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Média Diária</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dailyData.length > 0 ? Math.round(patientEvents.length / dailyData.length) : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  eventos por dia
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Último Registro</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {patientEvents.length > 0 
                    ? new Date(patientEvents[patientEvents.length - 1].occurred_at).toLocaleDateString('pt-BR')
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  data do último cuidado
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Alimentação */}
            {alimentosData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Consumo de Alimentos (%)</CardTitle>
                  <CardDescription>Percentual de consumo diário</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      alimentosPercent: {
                        label: "Consumo (%)",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={alimentosData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        />
                        <YAxis domain={[0, 100]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="alimentosPercent" 
                          stroke="var(--color-alimentosPercent)" 
                          strokeWidth={2}
                          dot={{ fill: "var(--color-alimentosPercent)" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Líquidos */}
            {liquidosData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Ingestão de Líquidos (ml)</CardTitle>
                  <CardDescription>Volume diário consumido</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      liquidosML: {
                        label: "Líquidos (ml)",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={liquidosData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar 
                          dataKey="liquidosML" 
                          fill="var(--color-liquidosML)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Urina */}
            {urinaData.length > 0 && urinaData.some((day: any) => day.urinaML > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Volume de Urina (ml)</CardTitle>
                  <CardDescription>Volume diário eliminado</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      urinaML: {
                        label: "Urina (ml)",
                        color: "hsl(var(--chart-3))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={urinaData.filter((day: any) => day.urinaML > 0)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar 
                          dataKey="urinaML" 
                          fill="var(--color-urinaML)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Humor */}
            {humorData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Escala de Humor</CardTitle>
                  <CardDescription>Avaliação diária do humor (1-10)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      humorScore: {
                        label: "Humor",
                        color: "hsl(var(--chart-4))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={humorData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        />
                        <YAxis domain={[1, 10]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="humorScore" 
                          stroke="var(--color-humorScore)" 
                          strokeWidth={2}
                          dot={{ fill: "var(--color-humorScore)" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Sinais Vitais */}
            {sinaisVitaisData.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Sinais Vitais</CardTitle>
                  <CardDescription>Monitoramento dos sinais vitais ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      pressaoSistolica: {
                        label: "Pressão Sistólica",
                        color: "hsl(var(--chart-1))",
                      },
                      pressaoDiastolica: {
                        label: "Pressão Diastólica",
                        color: "hsl(var(--chart-2))",
                      },
                      frequenciaCardiaca: {
                        label: "Frequência Cardíaca",
                        color: "hsl(var(--chart-3))",
                      },
                      temperatura: {
                        label: "Temperatura",
                        color: "hsl(var(--chart-4))",
                      },
                    }}
                    className="h-[400px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={sinaisVitaisData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="sinaisVitais.pressaoSistolica" 
                          stroke="var(--color-pressaoSistolica)" 
                          name="Pressão Sistólica"
                          strokeWidth={2}
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="sinaisVitais.pressaoDiastolica" 
                          stroke="var(--color-pressaoDiastolica)" 
                          name="Pressão Diastólica"
                          strokeWidth={2}
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="sinaisVitais.frequenciaCardiaca" 
                          stroke="var(--color-frequenciaCardiaca)" 
                          name="Frequência Cardíaca"
                          strokeWidth={2}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="sinaisVitais.temperatura" 
                          stroke="var(--color-temperatura)" 
                          name="Temperatura (°C)"
                          strokeWidth={2}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tabela de Eventos Recentes */}
          {patientEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Eventos Recentes</CardTitle>
                <CardDescription>Últimos 10 registros de cuidados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Data/Hora</th>
                        <th className="text-left p-2">Tipo</th>
                        <th className="text-left p-2">Detalhes</th>
                        <th className="text-left p-2">Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientEvents
                        .slice(-10)
                        .reverse()
                        .map((event, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">
                              {new Date(event.occurred_at).toLocaleString('pt-BR')}
                            </td>
                            <td className="p-2 capitalize">
                              {event.type === 'meal' && 'Alimentação'}
                              {event.type === 'drink' && 'Líquidos'}
                              {event.type === 'bathroom' && 'Banheiro'}
                              {event.type === 'mood' && 'Humor'}
                              {event.type === 'medication' && 'Medicação'}
                              {event.type === 'drain' && 'Dreno'}
                              {event.type === 'vital_signs' && 'Sinais Vitais'}
                            </td>
                            <td className="p-2">
                              {event.type === 'meal' && event.volume_ml && `${event.volume_ml}%`}
                              {event.type === 'drink' && event.volume_ml && `${event.volume_ml}ml`}
                              {event.type === 'bathroom' && event.volume_ml && `${event.volume_ml}ml`}
                              {event.type === 'mood' && event.mood_scale && `Escala: ${event.mood_scale}`}
                              {event.type === 'medication' && event.med_route && `Via: ${event.med_route}`}
                              {event.type === 'drain' && (
                                <>
                                  {event.left_amount && `Esq: ${event.left_amount}ml`}
                                  {event.right_amount && ` Dir: ${event.right_amount}ml`}
                                </>
                              )}
                              {event.type === 'vital_signs' && (
                                <>
                                  {event.systolic_bp && event.diastolic_bp && `PA: ${event.systolic_bp}/${event.diastolic_bp}`}
                                  {event.heart_rate && ` FC: ${event.heart_rate}`}
                                  {event.temperature && ` T: ${event.temperature}°C`}
                                </>
                              )}
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {event.notes || '-'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default Reports