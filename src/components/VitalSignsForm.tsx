import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Heart, 
  Thermometer, 
  Scale, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Save
} from 'lucide-react';

interface VitalSigns {
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  temperature?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  pain_scale?: number;
  recorded_at?: string;
  recorded_by?: string;
}

interface VitalSignsFormProps {
  initialValues?: VitalSigns;
  onSave: (vitalSigns: VitalSigns) => void;
  onCancel?: () => void;
  patientId?: string;
  readOnly?: boolean;
}

export const VitalSignsForm: React.FC<VitalSignsFormProps> = ({
  initialValues,
  onSave,
  onCancel,
  patientId,
  readOnly = false
}) => {
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>(
    initialValues || {
      recorded_at: new Date().toISOString()
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate BMI when height and weight change
  useEffect(() => {
    if (vitalSigns.height && vitalSigns.weight) {
      const heightInMeters = vitalSigns.height / 100;
      const bmi = vitalSigns.weight / (heightInMeters * heightInMeters);
      setVitalSigns(prev => ({ 
        ...prev, 
        bmi: Math.round(bmi * 10) / 10 
      }));
    }
  }, [vitalSigns.height, vitalSigns.weight]);

  // Validation functions
  const validateVitalSign = (field: string, value: number | undefined): string | null => {
    if (value === undefined || value === null) return null;

    switch (field) {
      case 'blood_pressure_systolic':
        if (value < 60 || value > 250) return 'PA sistólica deve estar entre 60-250 mmHg';
        break;
      case 'blood_pressure_diastolic':
        if (value < 30 || value > 150) return 'PA diastólica deve estar entre 30-150 mmHg';
        break;
      case 'heart_rate':
        if (value < 30 || value > 220) return 'FC deve estar entre 30-220 bpm';
        break;
      case 'respiratory_rate':
        if (value < 8 || value > 60) return 'FR deve estar entre 8-60 rpm';
        break;
      case 'temperature':
        if (value < 32 || value > 45) return 'Temperatura deve estar entre 32-45°C';
        break;
      case 'oxygen_saturation':
        if (value < 70 || value > 100) return 'SpO2 deve estar entre 70-100%';
        break;
      case 'weight':
        if (value < 0.5 || value > 500) return 'Peso deve estar entre 0.5-500 kg';
        break;
      case 'height':
        if (value < 30 || value > 250) return 'Altura deve estar entre 30-250 cm';
        break;
      case 'pain_scale':
        if (value < 0 || value > 10) return 'Escala de dor deve estar entre 0-10';
        break;
    }
    return null;
  };

  // Get status badge for vital signs
  const getVitalSignStatus = (field: string, value: number | undefined) => {
    if (value === undefined || value === null) return null;

    let status: 'normal' | 'warning' | 'critical' = 'normal';
    let message = 'Normal';

    switch (field) {
      case 'blood_pressure_systolic':
        if (value >= 180) {
          status = 'critical';
          message = 'Hipertensão grave';
        } else if (value >= 140) {
          status = 'warning';
          message = 'Hipertensão';
        } else if (value < 90) {
          status = 'warning';
          message = 'Hipotensão';
        }
        break;
      case 'blood_pressure_diastolic':
        if (value >= 110) {
          status = 'critical';
          message = 'Hipertensão grave';
        } else if (value >= 90) {
          status = 'warning';
          message = 'Hipertensão';
        } else if (value < 60) {
          status = 'warning';
          message = 'Hipotensão';
        }
        break;
      case 'heart_rate':
        if (value > 100) {
          status = 'warning';
          message = 'Taquicardia';
        } else if (value < 60) {
          status = 'warning';
          message = 'Bradicardia';
        }
        break;
      case 'temperature':
        if (value >= 38.5) {
          status = 'warning';
          message = 'Febre alta';
        } else if (value >= 37.5) {
          status = 'warning';
          message = 'Febre';
        } else if (value < 36) {
          status = 'warning';
          message = 'Hipotermia';
        }
        break;
      case 'oxygen_saturation':
        if (value < 90) {
          status = 'critical';
          message = 'Hipoxemia grave';
        } else if (value < 95) {
          status = 'warning';
          message = 'Hipoxemia';
        }
        break;
      case 'bmi':
        if (value >= 40) {
          status = 'critical';
          message = 'Obesidade mórbida';
        } else if (value >= 30) {
          status = 'warning';
          message = 'Obesidade';
        } else if (value >= 25) {
          status = 'warning';
          message = 'Sobrepeso';
        } else if (value < 18.5) {
          status = 'warning';
          message = 'Baixo peso';
        }
        break;
    }

    const colors = {
      normal: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={`${colors[status]} ml-2`}>
        {message}
      </Badge>
    );
  };

  const handleInputChange = (field: keyof VitalSigns, value: string) => {
    const numValue = value === '' ? undefined : Number(value);
    
    setVitalSigns(prev => ({
      ...prev,
      [field]: numValue
    }));

    // Validate the input
    const error = validateVitalSign(field, numValue);
    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));
  };

  const handleSave = () => {
    // Check for validation errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      return;
    }

    onSave({
      ...vitalSigns,
      recorded_at: new Date().toISOString()
    });
  };

  const VitalSignInput = ({ 
    field, 
    label, 
    unit, 
    placeholder, 
    icon: Icon,
    step = "1"
  }: {
    field: keyof VitalSigns;
    label: string;
    unit: string;
    placeholder: string;
    icon: React.ComponentType<any>;
    step?: string;
  }) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label} ({unit})
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step={step}
          placeholder={placeholder}
          value={vitalSigns[field] || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          disabled={readOnly}
          className={errors[field] ? 'border-red-500' : ''}
        />
        {typeof vitalSigns[field] === 'number' && getVitalSignStatus(field, vitalSigns[field] as number)}
      </div>
      {errors[field] && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {errors[field]}
        </p>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Sinais Vitais
          {vitalSigns.recorded_at && (
            <span className="text-sm font-normal text-gray-500 ml-auto">
              {new Date(vitalSigns.recorded_at).toLocaleString('pt-BR')}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Blood Pressure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VitalSignInput
            field="blood_pressure_systolic"
            label="Pressão Arterial Sistólica"
            unit="mmHg"
            placeholder="120"
            icon={Heart}
          />
          <VitalSignInput
            field="blood_pressure_diastolic"
            label="Pressão Arterial Diastólica"
            unit="mmHg"
            placeholder="80"
            icon={Heart}
          />
        </div>

        {/* Heart Rate and Respiratory Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VitalSignInput
            field="heart_rate"
            label="Frequência Cardíaca"
            unit="bpm"
            placeholder="72"
            icon={Heart}
          />
          <VitalSignInput
            field="respiratory_rate"
            label="Frequência Respiratória"
            unit="rpm"
            placeholder="16"
            icon={Activity}
          />
        </div>

        {/* Temperature and Oxygen Saturation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VitalSignInput
            field="temperature"
            label="Temperatura"
            unit="°C"
            placeholder="36.5"
            icon={Thermometer}
            step="0.1"
          />
          <VitalSignInput
            field="oxygen_saturation"
            label="Saturação de Oxigênio"
            unit="%"
            placeholder="98"
            icon={Activity}
          />
        </div>

        {/* Weight and Height */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <VitalSignInput
            field="weight"
            label="Peso"
            unit="kg"
            placeholder="70.0"
            icon={Scale}
            step="0.1"
          />
          <VitalSignInput
            field="height"
            label="Altura"
            unit="cm"
            placeholder="170"
            icon={TrendingUp}
          />
          {vitalSigns.bmi && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                IMC (kg/m²)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={vitalSigns.bmi}
                  disabled
                  className="bg-gray-50"
                />
                {getVitalSignStatus('bmi', vitalSigns.bmi)}
              </div>
            </div>
          )}
        </div>

        {/* Pain Scale */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VitalSignInput
            field="pain_scale"
            label="Escala de Dor"
            unit="0-10"
            placeholder="0"
            icon={AlertTriangle}
          />
        </div>

        {/* Summary */}
        {Object.keys(vitalSigns).some(key => vitalSigns[key as keyof VitalSigns] !== undefined && key !== 'recorded_at' && key !== 'recorded_by') && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resumo dos Sinais Vitais
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {vitalSigns.blood_pressure_systolic && vitalSigns.blood_pressure_diastolic && (
                <div>
                  <span className="font-medium">PA:</span> {vitalSigns.blood_pressure_systolic}/{vitalSigns.blood_pressure_diastolic} mmHg
                </div>
              )}
              {vitalSigns.heart_rate && (
                <div>
                  <span className="font-medium">FC:</span> {vitalSigns.heart_rate} bpm
                </div>
              )}
              {vitalSigns.temperature && (
                <div>
                  <span className="font-medium">T:</span> {vitalSigns.temperature}°C
                </div>
              )}
              {vitalSigns.oxygen_saturation && (
                <div>
                  <span className="font-medium">SpO2:</span> {vitalSigns.oxygen_saturation}%
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!readOnly && (
          <div className="flex justify-end gap-4 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Sinais Vitais
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VitalSignsForm;