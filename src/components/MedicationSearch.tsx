import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { memedApi, MemedMedication } from "@/services/memedApi";
import { 
  Search, 
  Loader2, 
  Plus, 
  Info,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface MedicationSearchProps {
  onSelect: (medication: MemedMedication) => void;
  placeholder?: string;
  className?: string;
}

export default function MedicationSearch({ 
  onSelect, 
  placeholder = "Digite o nome do medicamento...",
  className = ""
}: MedicationSearchProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [medications, setMedications] = useState<MemedMedication[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MemedMedication | null>(null);

  // Debounce para busca automática
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        searchMedications();
      } else {
        setMedications([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const searchMedications = async () => {
    if (query.length < 3) return;

    setLoading(true);
    setShowResults(true);

    try {
      const response = await memedApi.searchMedications(query, 20);
      
      if (response.success && response.data) {
        setMedications(response.data);
        
        if (response.data.length === 0) {
          toast({
            title: "Nenhum resultado",
            description: "Nenhum medicamento encontrado para esta busca",
            variant: "default"
          });
        }
      } else {
        throw new Error(response.error?.message || 'Erro na busca');
      }
    } catch (error) {
      console.error('Erro na busca de medicamentos:', error);
      toast({
        title: "Erro na busca",
        description: "Erro ao buscar medicamentos. Verifique sua conexão.",
        variant: "destructive"
      });
      setMedications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMedication = (medication: MemedMedication) => {
    setSelectedMedication(medication);
    setQuery(medication.name);
    setShowResults(false);
    onSelect(medication);
    
    toast({
      title: "Medicamento selecionado",
      description: `${medication.name} foi adicionado à prescrição`,
    });
  };

  const clearSelection = () => {
    setSelectedMedication(null);
    setQuery("");
    setMedications([]);
    setShowResults(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Campo de busca */}
      <div className="space-y-2">
        <Label htmlFor="medication-search">Buscar Medicamento</Label>
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="medication-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="pl-10"
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
            
            {selectedMedication && (
              <Button
                variant="outline"
                onClick={clearSelection}
                size="sm"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Medicamento selecionado */}
      {selectedMedication && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900">{selectedMedication.name}</h4>
                <div className="mt-2 space-y-1 text-sm text-green-700">
                  {selectedMedication.activeIngredient && (
                    <p><strong>Princípio Ativo:</strong> {selectedMedication.activeIngredient}</p>
                  )}
                  {selectedMedication.concentration && (
                    <p><strong>Concentração:</strong> {selectedMedication.concentration}</p>
                  )}
                  {selectedMedication.form && (
                    <p><strong>Forma:</strong> {selectedMedication.form}</p>
                  )}
                  {selectedMedication.laboratory && (
                    <p><strong>Laboratório:</strong> {selectedMedication.laboratory}</p>
                  )}
                </div>
                
                <div className="flex gap-2 mt-3">
                  {selectedMedication.genericAvailable && (
                    <Badge variant="secondary" className="text-xs">
                      Genérico Disponível
                    </Badge>
                  )}
                  {selectedMedication.price && (
                    <Badge variant="outline" className="text-xs">
                      R$ {selectedMedication.price.toFixed(2)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados da busca */}
      {showResults && !selectedMedication && (
        <Card className="max-h-96 overflow-y-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Resultados da Busca
              {medications.length > 0 && (
                <span className="ml-2 text-gray-500">({medications.length} encontrados)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Buscando medicamentos...</span>
              </div>
            ) : medications.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <AlertCircle className="h-6 w-6 mr-2" />
                <span>Nenhum medicamento encontrado</span>
              </div>
            ) : (
              <div className="space-y-2">
                {medications.map((medication, index) => (
                  <div key={medication.id || index}>
                    <div 
                      className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleSelectMedication(medication)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{medication.name}</h4>
                          <div className="mt-1 space-y-1 text-sm text-gray-600">
                            {medication.activeIngredient && (
                              <p><strong>Princípio Ativo:</strong> {medication.activeIngredient}</p>
                            )}
                            {medication.concentration && (
                              <p><strong>Concentração:</strong> {medication.concentration}</p>
                            )}
                            {medication.form && (
                              <p><strong>Forma:</strong> {medication.form}</p>
                            )}
                            {medication.laboratory && (
                              <p><strong>Laboratório:</strong> {medication.laboratory}</p>
                            )}
                          </div>
                          
                          <div className="flex gap-2 mt-2">
                            {medication.genericAvailable && (
                              <Badge variant="secondary" className="text-xs">
                                Genérico Disponível
                              </Badge>
                            )}
                            {medication.price && (
                              <Badge variant="outline" className="text-xs">
                                R$ {medication.price.toFixed(2)}
                              </Badge>
                            )}
                            {medication.ean && (
                              <Badge variant="outline" className="text-xs">
                                EAN: {medication.ean}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {index < medications.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações sobre a busca */}
      {query.length > 0 && query.length < 3 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Info className="h-4 w-4" />
          <span>Digite pelo menos 3 caracteres para buscar medicamentos</span>
        </div>
      )}
    </div>
  );
}