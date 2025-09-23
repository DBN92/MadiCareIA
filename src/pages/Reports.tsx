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

  // Agrupar dados por dia e unidade de medida
  const getDailyData = () => {
    if (!patientEvents.length) return { volumeData: [], percentageData: [], dosageData: [], countData: [] }

    const dailyStats: { [key: string]: any } = {}

    patientEvents.forEach(event => {
      const date = new Date(event.occurred_at).toLocaleDateString('pt-BR')
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          // Dados em ML (volume)
          liquidosML: 0,
          drenosML: 0,
          // Dados em % (percentual)
          alimentosPercent: 0,
          alimentosCount: 0,
          // Dados de dosagem (medicamentos)
          medicamentosCount: 0,
          // Dados de contagem (banheiro)
          banheiroCount: 0,
          // Totais por categoria
          totalLiquidos: 0,
          totalMedicamentos: 0,
          totalAlimentos: 0,
          totalDrenos: 0,
          totalBanheiro: 0
        }
      }

      const eventType = event.type?.toLowerCase() || ''
      const notes = event.notes?.toLowerCase() || ''
       
      if (eventType === 'drink' || notes.includes('líquido') || notes.includes('hidratação') || notes.includes('soro')) {
        dailyStats[date].liquidosML += event.volume_ml || 0
        dailyStats[date].totalLiquidos += 1
      } else if (eventType === 'med' || notes.includes('medicamento') || notes.includes('dose') || notes.includes('remédio')) {
        dailyStats[date].medicamentosCount += 1
        dailyStats[date].totalMedicamentos += 1
      } else if (eventType === 'meal' || notes.includes('alimento') || notes.includes('dieta') || notes.includes('alimentação')) {
        // Extrair percentual da descrição da refeição
        const mealDesc = event.meal_desc || ''
        const percentMatch = mealDesc.match(/(\d+)%/)
        const percent = percentMatch ? parseInt(percentMatch[1]) : 0
        dailyStats[date].alimentosPercent += percent
        dailyStats[date].alimentosCount += 1
        dailyStats[date].totalAlimentos += 1
      } else if (eventType === 'note' || notes.includes('dreno') || notes.includes('drenagem')) {
        dailyStats[date].drenosML += event.volume_ml || 0
        dailyStats[date].totalDrenos += 1
      } else if (eventType === 'bathroom' || notes.includes('banheiro') || notes.includes('eliminação') || notes.includes('urina') || notes.includes('fezes')) {
        dailyStats[date].banheiroCount += 1
        dailyStats[date].totalBanheiro += 1
      }
    })

    const dataArray = Object.values(dailyStats).sort((a: any, b: any) => 
      new Date(a.date.split('/').reverse().join('-')).getTime() - 
      new Date(b.date.split('/').reverse().join('-')).getTime()
    )

    // Calcular médias para cada tipo
    const totalDays = dataArray.length
    
    const volumeData = dataArray.map((day: any) => {
      const totalML = day.liquidosML + day.drenosML
      const avgML = totalDays > 0 ? dataArray.reduce((sum: number, d: any) => sum + d.liquidosML + d.drenosML, 0) / totalDays : 0
      return {
        date: day.date,
        liquidos: day.liquidosML,
        drenos: day.drenosML,
        media: Math.round(avgML * 100) / 100
      }
    })

    const percentageData = dataArray.map((day: any) => {
      const avgPercent = day.alimentosCount > 0 ? day.alimentosPercent / day.alimentosCount : 0
      const totalAvgPercent = totalDays > 0 ? dataArray.reduce((sum: number, d: any) => {
        const dayAvg = d.alimentosCount > 0 ? d.alimentosPercent / d.alimentosCount : 0
        return sum + dayAvg
      }, 0) / totalDays : 0
      return {
        date: day.date,
        alimentos: Math.round(avgPercent * 100) / 100,
        media: Math.round(totalAvgPercent * 100) / 100
      }
    })

    const dosageData = dataArray.map((day: any) => {
      const avgDosage = totalDays > 0 ? dataArray.reduce((sum: number, d: any) => sum + d.medicamentosCount, 0) / totalDays : 0
      return {
        date: day.date,
        medicamentos: day.medicamentosCount,
        media: Math.round(avgDosage * 100) / 100
      }
    })

    const countData = dataArray.map((day: any) => {
      const avgCount = totalDays > 0 ? dataArray.reduce((sum: number, d: any) => sum + d.banheiroCount, 0) / totalDays : 0
      return {
        date: day.date,
        banheiro: day.banheiroCount,
        media: Math.round(avgCount * 100) / 100
      }
    })

    return { volumeData, percentageData, dosageData, countData }
  }

  const { volumeData, percentageData, dosageData, countData } = getDailyData()
  const selectedPatient = patients.find(p => p.id === selectedPatientId)

  const chartConfig = {
    liquidos: {
      label: "Líquidos",
      color: "#3b82f6", // Azul
    },
    medicamentos: {
      label: "Medicamentos", 
      color: "#ef4444", // Vermelho
    },
    alimentos: {
      label: "Alimentos",
      color: "#22c55e", // Verde
    },
    drenos: {
      label: "Drenos",
      color: "#f59e0b", // Amarelo/Laranja
    },
    banheiro: {
      label: "Banheiro",
      color: "#8b5cf6", // Roxo
    },
    total: {
      label: "Total",
      color: "#6366f1", // Índigo
    },
    media: {
      label: "Média",
      color: "#dc2626", // Vermelho escuro
    }
  }

  const handleExportPDF = async () => {
    if (!selectedPatientId || !selectedPatient) return
    
    setIsExporting(true)
    
    try {
      // Criar elemento temporário com o conteúdo do relatório
      const reportElement = document.getElementById('report-content')
      if (!reportElement) {
        throw new Error('Elemento do relatório não encontrado')
      }

      // Capturar o elemento como canvas
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      // Criar PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      // Adicionar cabeçalho
      pdf.setFontSize(20)
      pdf.text(`Relatório de Cuidados - ${selectedPatient.full_name}`, 20, 20)
      pdf.setFontSize(12)
      pdf.text(`Leito: ${selectedPatient.bed}`, 20, 30)
      pdf.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, 20, 40)
      pdf.text(`Total de registros: ${patientEvents.length}`, 20, 50)
      
      position = 60

      // Adicionar imagem do gráfico
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Adicionar páginas extras se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Salvar PDF
      const fileName = `relatorio_${selectedPatient.full_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório para PDF",
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

      {/* Seletor de Paciente com glassmorphism */}
      <Card className="backdrop-blur-sm bg-white/70 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
        <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <User className="h-5 w-5 text-blue-600" />
            Selecionar Paciente
          </CardTitle>
          <CardDescription>
            Escolha um paciente para visualizar seus dados de cuidados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger className="w-full backdrop-blur-sm bg-white/50 border-white/30 hover:bg-white/70 transition-all duration-200">
              <SelectValue placeholder="Selecione um paciente" />
            </SelectTrigger>
            <SelectContent className="backdrop-blur-md bg-white/90 border-white/20">
              {patients.map((patient) => (
                <SelectItem 
                  key={patient.id} 
                  value={patient.id}
                  className="hover:bg-blue-50/50 transition-colors duration-200"
                >
                  {patient.full_name} - Leito {patient.bed}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Informações do Paciente Selecionado */}
      {selectedPatient && (
        <Card className="backdrop-blur-sm bg-white/70 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]">
          <CardHeader className="bg-gradient-to-r from-green-50/50 to-blue-50/50 rounded-t-lg">
            <CardTitle>Informações do Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p className="text-lg font-semibold">{selectedPatient.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leito</p>
                <p className="text-lg font-semibold">{selectedPatient.bed}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Registros</p>
                <p className="text-lg font-semibold">{patientEvents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico */}
      {selectedPatientId && (volumeData.length > 0 || percentageData.length > 0 || dosageData.length > 0 || countData.length > 0) ? (
        <div id="report-content" className="w-full space-y-6">
          {/* Gráfico de Volume (ML) - Líquidos e Drenos */}
          {volumeData.length > 0 && (
            <Card className="backdrop-blur-sm bg-white/70 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]">
              <CardHeader className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Volume em ML - Líquidos e Drenos
                </CardTitle>
                <CardDescription>
                  Volumes registrados em mililitros por dia
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="backdrop-blur-sm bg-white/30 rounded-xl p-4 border border-white/20">
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
                           backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                           border: '1px solid rgba(255, 255, 255, 0.3)',
                           borderRadius: '12px',
                           boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                           backdropFilter: 'blur(10px)'
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
                         radius={[4, 4, 0, 0]}
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
                         radius={[4, 4, 0, 0]}
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Percentual (%) - Alimentos */}
          {percentageData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Consumo em % - Alimentos
                </CardTitle>
                <CardDescription>
                  Percentual médio de consumo de alimentos por dia
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
                       cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
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
          {dosageData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quantidade de Doses - Medicamentos
                </CardTitle>
                <CardDescription>
                  Número de doses de medicamentos administradas por dia
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
                       label={{ value: 'Número de Doses', angle: -90, position: 'insideLeft' }}
                     />
                     <Tooltip 
                       contentStyle={{ 
                         backgroundColor: '#fff', 
                         border: '1px solid #e0e0e0',
                         borderRadius: '8px',
                         boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                       }}
                       cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                       formatter={(value, name) => [`${value} doses`, name]}
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
                       name="Média Doses"
                     />
                   </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Contagem - Banheiro */}
          {countData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Eliminações - Banheiro
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
                       label={{ value: 'Número de Eliminações', angle: -90, position: 'insideLeft' }}
                     />
                     <Tooltip 
                       contentStyle={{ 
                         backgroundColor: '#fff', 
                         border: '1px solid #e0e0e0',
                         borderRadius: '8px',
                         boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                       }}
                       cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                       formatter={(value, name) => [`${value} eliminações`, name]}
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
  )
}

export default Reports