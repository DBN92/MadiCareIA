import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  Plus, 
  Trash2, 
  Search, 
  BookOpen,
  AlertCircle,
  CheckCircle,
  Star
} from 'lucide-react';

interface DiagnosticCode {
  id?: string;
  code: string;
  description: string;
  type: 'CID10' | 'CID11' | 'SNOMED' | 'OTHER';
  category?: string;
  is_primary?: boolean;
  notes?: string;
}

interface DiagnosticCodesManagerProps {
  initialCodes?: DiagnosticCode[];
  onCodesChange: (codes: DiagnosticCode[]) => void;
  readOnly?: boolean;
  maxCodes?: number;
}

// Common CID-10 codes for quick selection
const COMMON_CID10_CODES = [
  { code: 'Z00.0', description: 'Exame médico geral', category: 'Exames' },
  { code: 'I10', description: 'Hipertensão essencial', category: 'Cardiovascular' },
  { code: 'E11.9', description: 'Diabetes mellitus tipo 2 sem complicações', category: 'Endócrino' },
  { code: 'J06.9', description: 'Infecção aguda das vias aéreas superiores', category: 'Respiratório' },
  { code: 'M79.3', description: 'Dor não especificada', category: 'Musculoesquelético' },
  { code: 'K59.0', description: 'Constipação', category: 'Digestivo' },
  { code: 'R50.9', description: 'Febre não especificada', category: 'Sintomas' },
  { code: 'F32.9', description: 'Episódio depressivo não especificado', category: 'Mental' },
  { code: 'N39.0', description: 'Infecção do trato urinário', category: 'Genitourinário' },
  { code: 'L30.9', description: 'Dermatite não especificada', category: 'Pele' },
  { code: 'H52.4', description: 'Presbiopia', category: 'Oftalmológico' },
  { code: 'G43.9', description: 'Enxaqueca não especificada', category: 'Neurológico' },
  { code: 'Z51.1', description: 'Sessão de quimioterapia', category: 'Tratamento' },
  { code: 'Z12.1', description: 'Exame especial de rastreamento de neoplasia', category: 'Prevenção' }
];

export const DiagnosticCodesManager: React.FC<DiagnosticCodesManagerProps> = ({
  initialCodes = [],
  onCodesChange,
  readOnly = false,
  maxCodes = 10
}) => {
  const [codes, setCodes] = useState<DiagnosticCode[]>(initialCodes);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCommonCodes, setShowCommonCodes] = useState(false);

  useEffect(() => {
    onCodesChange(codes);
  }, [codes, onCodesChange]);

  const categories = Array.from(new Set(COMMON_CID10_CODES.map(code => code.category)));

  const filteredCommonCodes = COMMON_CID10_CODES.filter(code => {
    const matchesSearch = searchTerm === '' || 
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || code.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const addCode = (newCode?: Partial<DiagnosticCode>) => {
    if (codes.length >= maxCodes) {
      return;
    }

    const code: DiagnosticCode = {
      id: Date.now().toString(),
      code: newCode?.code || '',
      description: newCode?.description || '',
      type: newCode?.type || 'CID10',
      category: newCode?.category || '',
      is_primary: codes.length === 0, // First code is primary by default
      notes: newCode?.notes || ''
    };

    setCodes(prev => [...prev, code]);
  };

  const updateCode = (index: number, field: keyof DiagnosticCode, value: any) => {
    setCodes(prev => prev.map((code, i) => 
      i === index ? { ...code, [field]: value } : code
    ));
  };

  const removeCode = (index: number) => {
    setCodes(prev => {
      const newCodes = prev.filter((_, i) => i !== index);
      // If we removed the primary diagnosis, make the first remaining one primary
      if (prev[index].is_primary && newCodes.length > 0) {
        newCodes[0].is_primary = true;
      }
      return newCodes;
    });
  };

  const setPrimaryDiagnosis = (index: number) => {
    setCodes(prev => prev.map((code, i) => ({
      ...code,
      is_primary: i === index
    })));
  };

  const addCommonCode = (commonCode: typeof COMMON_CID10_CODES[0]) => {
    // Check if code already exists
    const exists = codes.some(code => code.code === commonCode.code);
    if (exists) {
      return;
    }

    addCode({
      code: commonCode.code,
      description: commonCode.description,
      type: 'CID10',
      category: commonCode.category
    });
    setShowCommonCodes(false);
  };

  const validateCode = (code: string, type: string): boolean => {
    if (!code) return false;
    
    switch (type) {
      case 'CID10':
        // Basic CID-10 format validation (letter + numbers + optional decimal)
        return /^[A-Z]\d{2}(\.\d{1,2})?$/.test(code);
      case 'CID11':
        // Basic CID-11 format validation
        return /^[0-9A-Z]{2,10}$/.test(code);
      default:
        return code.length > 0;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Códigos Diagnósticos (CID-10)
          {!readOnly && codes.length < maxCodes && (
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCommonCodes(!showCommonCodes)}
              >
                <BookOpen className="h-4 w-4 mr-1" />
                Códigos Comuns
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addCode()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Common Codes Panel */}
        {showCommonCodes && !readOnly && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar código ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="max-h-64 overflow-y-auto">
              <div className="grid gap-2">
                {filteredCommonCodes.map((commonCode, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer"
                    onClick={() => addCommonCode(commonCode)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {commonCode.code}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {commonCode.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {commonCode.description}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Codes */}
        {codes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum código diagnóstico adicionado</p>
            {!readOnly && (
              <p className="text-sm mt-2">
                Clique em "Adicionar" ou "Códigos Comuns" para começar
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {codes.map((code, index) => (
              <Card key={code.id || index} className={`${code.is_primary ? 'border-blue-500 bg-blue-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Código</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Ex: I10"
                          value={code.code}
                          onChange={(e) => updateCode(index, 'code', e.target.value)}
                          disabled={readOnly}
                          className={`font-mono ${!validateCode(code.code, code.type) && code.code ? 'border-red-500' : ''}`}
                        />
                        {code.is_primary && (
                          <Badge className="bg-blue-600">
                            <Star className="h-3 w-3 mr-1" />
                            Principal
                          </Badge>
                        )}
                      </div>
                      {!validateCode(code.code, code.type) && code.code && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Formato inválido
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label>Descrição</Label>
                      <Input
                        placeholder="Descrição do diagnóstico"
                        value={code.description}
                        onChange={(e) => updateCode(index, 'description', e.target.value)}
                        disabled={readOnly}
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label>Tipo</Label>
                        <Select
                          value={code.type}
                          onValueChange={(value: DiagnosticCode['type']) => updateCode(index, 'type', value)}
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CID10">CID-10</SelectItem>
                            <SelectItem value="CID11">CID-11</SelectItem>
                            <SelectItem value="SNOMED">SNOMED</SelectItem>
                            <SelectItem value="OTHER">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {!readOnly && (
                        <div className="flex gap-1">
                          {!code.is_primary && codes.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setPrimaryDiagnosis(index)}
                              title="Definir como diagnóstico principal"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCode(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {code.category && (
                      <div className="md:col-span-2">
                        <Label>Categoria</Label>
                        <Input
                          value={code.category}
                          onChange={(e) => updateCode(index, 'category', e.target.value)}
                          disabled={readOnly}
                          placeholder="Categoria do diagnóstico"
                        />
                      </div>
                    )}

                    <div className="md:col-span-4">
                      <Label>Observações</Label>
                      <Input
                        placeholder="Observações sobre o diagnóstico"
                        value={code.notes || ''}
                        onChange={(e) => updateCode(index, 'notes', e.target.value)}
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {codes.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resumo dos Diagnósticos
            </h4>
            <div className="space-y-1 text-sm">
              {codes.map((code, index) => (
                <div key={index} className="flex items-center gap-2">
                  {code.is_primary && <Star className="h-3 w-3 text-blue-600" />}
                  <span className="font-mono text-xs bg-white px-2 py-1 rounded">
                    {code.code}
                  </span>
                  <span className="text-gray-700">{code.description}</span>
                  {code.is_primary && (
                    <Badge variant="secondary" className="text-xs">Principal</Badge>
                  )}
                </div>
              ))}
            </div>
            {codes.length < maxCodes && !readOnly && (
              <p className="text-xs text-gray-500 mt-2">
                Você pode adicionar até {maxCodes - codes.length} diagnósticos adicionais.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiagnosticCodesManager;