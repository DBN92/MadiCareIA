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
      const date = event.occurred_at.split('T')[0]
      
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
          totalBanheiro: 0,
          totalAlimentos: 0,
          totalMedicamentos: 0,
          totalDrenos: 0,
          totalUrina: 0
        }
      }

      switch (event.type) {
        case 'meal':
          dailyStats[date].alimentosPercent += event.consumption_percentage || 0
          dailyStats[date].alimentosCount += 1
          dailyStats[date].totalAlimentos += 1
          break
        case 'med':
          dailyStats[date].medicamentosCount += 1
          dailyStats[date].totalMedicamentos += 1
          break
        case 'bathroom':
          dailyStats[date].banheiroCount += 1
          dailyStats[date].totalBanheiro += 1
          if (event.bathroom_type === 'urina' && event.volume_ml) {
            dailyStats[date].urinaML += event.volume_ml
            dailyStats[date].totalUrina += event.volume_ml
          }
          break
        case 'drink':
          dailyStats[date].liquidosML += event.volume_ml || 0
          dailyStats[date].totalLiquidos += event.volume_ml || 0
          break
        case 'note':
          if (event.notes?.includes('dreno')) {
            dailyStats[date].drenosML += event.volume_ml || 0
            dailyStats[date].totalDrenos += event.volume_ml || 0
          }
          break
      }
    })

    // Converter para array e calcular médias
    const dataArray = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
      alimentosPercent: stats.alimentosCount > 0 ? Math.round(stats.alimentosPercent / stats.alimentosCount) : 0
    })).sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime())

    // Calcular médias para cada tipo de dado
    const volumeData = dataArray.map(day => ({
      date: day.date,
      liquidos: day.liquidosML,
      drenos: day.drenosML,
      media: Math.round((dataArray.reduce((sum, d) => sum + d.liquidosML + d.drenosML, 0) / dataArray.length) || 0)
    }))

    const percentageData = dataArray.map(day => ({
      date: day.date,
      alimentos: day.alimentosPercent,
      media: Math.round((dataArray.reduce((sum, d) => sum + d.alimentosPercent, 0) / dataArray.length) || 0)
    }))

    const dosageData = dataArray.map(day => ({
      date: day.date,
      medicamentos: day.medicamentosCount,
      media: Math.round((dataArray.reduce((sum, d) => sum + d.medicamentosCount, 0) / dataArray.length) || 0)
    }))

    const countData = dataArray.map(day => ({
      date: day.date,
      banheiro: day.banheiroCount,
      media: Math.round((dataArray.reduce((sum, d) => sum + d.banheiroCount, 0) / dataArray.length) || 0)
    }))

    const urinaData = dataArray.map(day => ({
      date: day.date,
      urina: day.urinaML,
      media: Math.round((dataArray.reduce((sum, d) => sum + d.urinaML, 0) / dataArray.length) || 0)
    }))

    return { volumeData, percentageData, dosageData, countData, urinaData }
  }

  const { volumeData, percentageData, dosageData, countData, urinaData } = getDailyData()

  // Configuração de cores para os gráficos
  const chartConfig = {
    liquidos: {
      label: "Líquidos",
      color: "#3b82f6"
    },
    drenos: {
      label: "Drenos", 
      color: "#ef4444"
    },
    alimentos: {
      label: "Alimentos",
      color: "#22c55e"
    },
    medicamentos: {
      label: "Medicamentos",
      color: "#a855f7"
    },
    banheiro: {
      label: "Eliminações",
      color: "#f59e0b"
    },
    urina: {
      label: "Volume Urina",
      color: "#06b6d4"
    },
    total: {
      label: "Total",
      color: "#6366f1"
    },
    media: {
      label: "Média",
      color: "#64748b"
    }
  }

  // Função para exportar PDF
  const handleExportPDF = async () => {
    if (!selectedPatientId) {
      toast({
        title: "Erro",
        description: "Selecione um paciente primeiro",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)
    
    try {
      const element = document.getElementById('reports-content')
      if (!element) {
        throw new Error('Elemento de relatórios não encontrado')
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
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
      const fileName = `relatorio-${selectedPatient?.full_name || 'paciente'}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`
      
      pdf.save(fileName)
      
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 space-y-6 p-6">
      {/* Header com glassmorphism */}
      <div className="flex items-center justify-between backdrop-blur-sm bg-white/70 rounded-2xl p-6 border border-white/20 shadow-lg">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Relatórios
          </h1>
          <p className="text-muted-foreground">
            Visualize gráficos diários de cuidados por paciente
          </p>
        </div>
        <Button 
          onClick={handleExportPDF} 
          disabled={!selectedPatientId || isExporting}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? 'Exportando...' : 'Exportar PDF'}
        </Button>
      </div>

      {/* Seletor de Paciente */}
      <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-blue-600" />
            Selecionar Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger className="w-full bg-white/50 border-white/30">
              <SelectValue placeholder="Escolha um paciente para visualizar os relatórios" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.full_name} - Leito {patient.bed}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Conteúdo dos Relatórios */}
      <div id="reports-content">
        {selectedPatientId && patientEvents.length > 0 ? (
          <div className="space-y-6">
            {/* Estatísticas Resumidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Eventos</p>
                      <p className="text-2xl font-bold">{patientEvents.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dias com Registros</p>
                      <p className="text-2xl font-bold">{volumeData.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Período</p>
                      <p className="text-2xl font-bold">
                        {volumeData.length > 0 ? `${volumeData.length}d` : '0d'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Média Diária</p>
                      <p className="text-2xl font-bold">
                        {volumeData.length > 0 ? Math.round(patientEvents.length / volumeData.length) : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Volume (ml) - Líquidos e Drenos */}
            {volumeData.length > 0 && volumeData.some(day => day.liquidos > 0 || day.drenos > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Volume em ML - Líquidos e Drenos
                  </CardTitle>
                  <CardDescription>
                    Volume de líquidos ingeridos e drenos por dia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={volumeData} margin={{ top: 40, right: 30, left: 20, bottom: 60 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                       <XAxis 
                         dataKey="date" 
                         tick={{ fontSize: 12 }}
                         axisLine={{ stroke: '#e0e0e0' }}
                       />
                       <YAxis 
                         tick={{ fontSize: 12 }}
                         axisLine={{ stroke: '#e0e0e0' }}
                         label={{ value: 'Volume (ml)', angle: -90, position: 'insideLeft' }}
                       />
                       <Tooltip 
                         contentStyle={{ 
                           backgroundColor: '#fff', 
                           border: '1px solid #e0e0e0',
                           borderRadius: '8px',
                           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                         }}
                         cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                         formatter={(value, name) => [`${value}ml`, name]}
                       />
                       <Legend 
                         wrapperStyle={{ paddingTop: '20px' }}
                         iconType="rect"
                       />
                       <Bar 
                         dataKey="liquidos" 
                         fill={chartConfig.liquidos.color} 
                         name={chartConfig.liquidos.label} 
                         radius={[2, 2, 0, 0]}
                       >
                         <LabelList 
                           dataKey="liquidos" 
                           position="top" 
                           formatter={(value) => value > 0 ? `${value}ml` : ''}
                           style={{ fontSize: '12px', fill: '#666' }}
                         />
                       </Bar>
                       <Bar 
                         dataKey="drenos" 
                         fill={chartConfig.drenos.color} 
                         name={chartConfig.drenos.label} 
                         radius={[2, 2, 0, 0]}
                       >
                         <LabelList 
                           dataKey="drenos" 
                           position="top" 
                           formatter={(value) => value > 0 ? `${value}ml` : ''}
                           style={{ fontSize: '12px', fill: '#666' }}
                         />
                       </Bar>
                       <Line 
                         type="monotone" 
                         dataKey="media" 
                         stroke={chartConfig.media.color}
                         strokeWidth={3}
                         strokeDasharray="5 5"
                         dot={false}
                         name="Média ML"
                       />
                     </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Percentual - Alimentos */}
            {percentageData.length > 0 && percentageData.some(day => day.alimentos > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Percentual de Consumo - Alimentos
                  </CardTitle>
                  <CardDescription>
                    Percentual médio de alimentos consumidos por dia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={percentageData} margin={{ top: 40, right: 30, left: 20, bottom: 60 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                       <XAxis 
                         dataKey="date" 
                         tick={{ fontSize: 12 }}
                         axisLine={{ stroke: '#e0e0e0' }}
                       />
                       <YAxis 
                         tick={{ fontSize: 12 }}
                         axisLine={{ stroke: '#e0e0e0' }}
                         label={{ value: 'Percentual (%)', angle: -90, position: 'insideLeft' }}
                         domain={[0, 100]}
                       />
                       <Tooltip 
                         contentStyle={{ 
                           backgroundColor: '#fff', 
                           border: '1px solid #e0e0e0',
                           borderRadius: '8px',
                           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                         }}
                         cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
                         formatter={(value, name) => [`${value}%`, name]}
                       />
                       <Legend 
                         wrapperStyle={{ paddingTop: '20px' }}
                         iconType="rect"
                       />
                       <Bar 
                         dataKey="alimentos" 
                         fill={chartConfig.alimentos.color} 
                         name={chartConfig.alimentos.label} 
                         radius={[2, 2, 0, 0]}
                       >
                         <LabelList 
                           dataKey="alimentos" 
                           position="top" 
                           formatter={(value) => value > 0 ? `${value}%` : ''}
                           style={{ fontSize: '12px', fill: '#666' }}
                         />
                       </Bar>
                       <Line 
                         type="monotone" 
                         dataKey="media" 
                         stroke={chartConfig.media.color}
                         strokeWidth={3}
                         strokeDasharray="5 5"
                         dot={false}
                         name="Média %"
                       />
                     </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Contagem - Medicamentos */}
            {dosageData.length > 0 && dosageData.some(day => day.medicamentos > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Contagem - Medicamentos
                  </CardTitle>
                  <CardDescription>
                    Número de medicamentos administrados por dia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={dosageData} margin={{ top: 40, right: 30, left: 20, bottom: 60 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                       <XAxis 
                         dataKey="date" 
                         tick={{ fontSize: 12 }}
                         axisLine={{ stroke: '#e0e0e0' }}
                       />
                       <YAxis 
                         tick={{ fontSize: 12 }}
                         axisLine={{ stroke: '#e0e0e0' }}
                         label={{ value: 'Quantidade', angle: -90, position: 'insideLeft' }}
                       />
                       <Tooltip 
                         contentStyle={{ 
                           backgroundColor: '#fff', 
                           border: '1px solid #e0e0e0',
                           borderRadius: '8px',
                           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                         }}
                         cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }}
                         formatter={(value, name) => [value, name]}
                       />
                       <Legend 
                         wrapperStyle={{ paddingTop: '20px' }}
                         iconType="rect"
                       />
                       <Bar 
                         dataKey="medicamentos" 
                         fill={chartConfig.medicamentos.color} 
                         name={chartConfig.medicamentos.label} 
                         radius={[2, 2, 0, 0]}
                       >
                         <LabelList 
                           dataKey="medicamentos" 
                           position="top" 
                           formatter={(value) => value > 0 ? value : ''}
                           style={{ fontSize: '12px', fill: '#666' }}
                         />
                       </Bar>
                       <Line 
                         type="monotone" 
                         dataKey="media" 
                         stroke={chartConfig.media.color}
                         strokeWidth={3}
                         strokeDasharray="5 5"
                         dot={false}
                         name="Média Medicamentos"
                       />
                     </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Contagem - Eliminações */}
            {countData.length > 0 && countData.some(day => day.banheiro > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Contagem - Eliminações
                  </CardTitle>
                  <CardDescription>
                    Número de eliminações registradas por dia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={countData} margin={{ top: 40, right: 30, left: 20, bottom: 60 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                       <XAxis 
                         dataKey="date" 
                         tick={{ fontSize: 12 }}
                         axisLine={{ stroke: '#e0e0e0' }}
                       />
                       <YAxis 
                         tick={{ fontSize: 12 }}
                         axisLine={{ stroke: '#e0e0e0' }}
                         label={{ value: 'Quantidade', angle: -90, position: 'insideLeft' }}
                       />
                       <Tooltip 
                         contentStyle={{ 
                           backgroundColor: '#fff', 
                           border: '1px solid #e0e0e0',
                           borderRadius: '8px',
                           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                         }}
                         cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }}
                         formatter={(value, name) => [value, name]}
                       />
                       <Legend 
                         wrapperStyle={{ paddingTop: '20px' }}
                         iconType="rect"
                       />
                       <Bar 
                         dataKey="banheiro" 
                         fill={chartConfig.banheiro.color} 
                         name={chartConfig.banheiro.label} 
                         radius={[2, 2, 0, 0]}
                       >
                         <LabelList 
                           dataKey="banheiro" 
                           position="top" 
                           formatter={(value) => value > 0 ? value : ''}
                           style={{ fontSize: '12px', fill: '#666' }}
                         />
                       </Bar>
                       <Line 
                         type="monotone" 
                         dataKey="media" 
                         stroke={chartConfig.media.color}
                         strokeWidth={3}
                         strokeDasharray="5 5"
                         dot={false}
                         name="Média Eliminações"
                       />
                     </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Volume (ml) - Urina */}
            {urinaData.length > 0 && urinaData.some(day => day.urina > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Volume em ML - Urina
                  </CardTitle>
                  <CardDescription>
                    Volume de urina registrado por dia (quando informado)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={urinaData} margin={{ top: 40, right: 30, left: 20, bottom: 60 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                       <XAxis 
                         dataKey="date" 
                         tick={{ fontSize: 12 }}
                         axisLine={{ stroke: '#e0e0e0' }}
                       />
                       <YAxis 
                         tick={{ fontSize: 12 }}
                         axisLine={{ stroke: '#e0e0e0' }}
                         label={{ value: 'Volume (ml)', angle: -90, position: 'insideLeft' }}
                       />
                       <Tooltip 
                         contentStyle={{ 
                           backgroundColor: '#fff', 
                           border: '1px solid #e0e0e0',
                           borderRadius: '8px',
                           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                         }}
                         cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                         formatter={(value, name) => [`${value}ml`, name]}
                       />
                       <Legend 
                         wrapperStyle={{ paddingTop: '20px' }}
                         iconType="rect"
                       />
                       <Bar 
                         dataKey="urina" 
                         fill={chartConfig.urina.color} 
                         name={chartConfig.urina.label} 
                         radius={[2, 2, 0, 0]}
                       >
                         <LabelList 
                           dataKey="urina" 
                           position="top" 
                           formatter={(value) => value > 0 ? `${value}ml` : ''}
                           style={{ fontSize: '12px', fill: '#666' }}
                         />
                       </Bar>
                       <Line 
                         type="monotone" 
                         dataKey="media" 
                         stroke={chartConfig.media.color}
                         strokeWidth={3}
                         strokeDasharray="5 5"
                         dot={false}
                         name="Média ML"
                       />
                     </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        ) : selectedPatientId ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
                <p className="text-muted-foreground">
                  Este paciente ainda não possui registros de cuidados.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione um Paciente</h3>
                <p className="text-muted-foreground">
                  Escolha um paciente acima para visualizar seus relatórios de cuidados.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Reports