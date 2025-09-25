-- Script para traduzir todos os registros da base de dados para português brasileiro (pt-br)
-- Execute este script no SQL Editor do Supabase Dashboard

-- ========================================
-- 1. TRADUÇÃO DA TABELA PROFILES
-- ========================================

-- Traduzir roles (funções) de inglês para português
UPDATE profiles 
SET role = CASE 
  WHEN role = 'doctor' THEN 'medico'
  WHEN role = 'nurse' THEN 'enfermeiro'
  WHEN role = 'admin' THEN 'administrador'
  ELSE role
END
WHERE role IN ('doctor', 'nurse', 'admin');

-- Traduzir nomes de teste para português
UPDATE profiles 
SET full_name = CASE 
  WHEN full_name LIKE '%Dr. Teste Auth%' THEN REPLACE(full_name, 'Dr. Teste Auth', 'Dr. Teste Autenticação')
  WHEN full_name LIKE '%Dr. Teste Produção%' THEN full_name -- já está em português
  WHEN full_name LIKE '%Test%' THEN REPLACE(full_name, 'Test', 'Teste')
  WHEN full_name LIKE '%Doctor%' THEN REPLACE(full_name, 'Doctor', 'Doutor')
  WHEN full_name LIKE '%Nurse%' THEN REPLACE(full_name, 'Nurse', 'Enfermeiro')
  WHEN full_name LIKE '%Admin%' THEN REPLACE(full_name, 'Admin', 'Administrador')
  ELSE full_name
END
WHERE full_name IS NOT NULL;

-- ========================================
-- 2. TRADUÇÃO DA TABELA EVENTS
-- ========================================

-- Traduzir tipos de eventos (event_type enum)
-- Nota: Como é um ENUM, precisamos verificar se os valores em português já existem
-- Se não existirem, será necessário alterar o ENUM primeiro

-- Traduzir bathroom_type
UPDATE events 
SET bathroom_type = CASE 
  WHEN bathroom_type = 'urine' THEN 'urina'
  WHEN bathroom_type = 'feces' THEN 'fezes'
  WHEN bathroom_type = 'both' THEN 'ambos'
  WHEN bathroom_type = 'diaper' THEN 'fralda'
  ELSE bathroom_type
END
WHERE bathroom_type IS NOT NULL;

-- Traduzir notas comuns em inglês para português
UPDATE events 
SET notes = CASE 
  WHEN notes LIKE '%Water%' THEN REPLACE(notes, 'Water', 'Água')
  WHEN notes LIKE '%water%' THEN REPLACE(notes, 'water', 'água')
  WHEN notes LIKE '%Milk%' THEN REPLACE(notes, 'Milk', 'Leite')
  WHEN notes LIKE '%milk%' THEN REPLACE(notes, 'milk', 'leite')
  WHEN notes LIKE '%Juice%' THEN REPLACE(notes, 'Juice', 'Suco')
  WHEN notes LIKE '%juice%' THEN REPLACE(notes, 'juice', 'suco')
  WHEN notes LIKE '%Coffee%' THEN REPLACE(notes, 'Coffee', 'Café')
  WHEN notes LIKE '%coffee%' THEN REPLACE(notes, 'coffee', 'café')
  WHEN notes LIKE '%Tea%' THEN REPLACE(notes, 'Tea', 'Chá')
  WHEN notes LIKE '%tea%' THEN REPLACE(notes, 'tea', 'chá')
  WHEN notes LIKE '%Breakfast%' THEN REPLACE(notes, 'Breakfast', 'Café da manhã')
  WHEN notes LIKE '%breakfast%' THEN REPLACE(notes, 'breakfast', 'café da manhã')
  WHEN notes LIKE '%Lunch%' THEN REPLACE(notes, 'Lunch', 'Almoço')
  WHEN notes LIKE '%lunch%' THEN REPLACE(notes, 'lunch', 'almoço')
  WHEN notes LIKE '%Dinner%' THEN REPLACE(notes, 'Dinner', 'Jantar')
  WHEN notes LIKE '%dinner%' THEN REPLACE(notes, 'dinner', 'jantar')
  WHEN notes LIKE '%Snack%' THEN REPLACE(notes, 'Snack', 'Lanche')
  WHEN notes LIKE '%snack%' THEN REPLACE(notes, 'snack', 'lanche')
  WHEN notes LIKE '%Medicine%' THEN REPLACE(notes, 'Medicine', 'Medicamento')
  WHEN notes LIKE '%medicine%' THEN REPLACE(notes, 'medicine', 'medicamento')
  WHEN notes LIKE '%Medication%' THEN REPLACE(notes, 'Medication', 'Medicação')
  WHEN notes LIKE '%medication%' THEN REPLACE(notes, 'medication', 'medicação')
  WHEN notes LIKE '%Pill%' THEN REPLACE(notes, 'Pill', 'Comprimido')
  WHEN notes LIKE '%pill%' THEN REPLACE(notes, 'pill', 'comprimido')
  WHEN notes LIKE '%Tablet%' THEN REPLACE(notes, 'Tablet', 'Comprimido')
  WHEN notes LIKE '%tablet%' THEN REPLACE(notes, 'tablet', 'comprimido')
  WHEN notes LIKE '%Injection%' THEN REPLACE(notes, 'Injection', 'Injeção')
  WHEN notes LIKE '%injection%' THEN REPLACE(notes, 'injection', 'injeção')
  WHEN notes LIKE '%Good%' THEN REPLACE(notes, 'Good', 'Bom')
  WHEN notes LIKE '%good%' THEN REPLACE(notes, 'good', 'bom')
  WHEN notes LIKE '%Bad%' THEN REPLACE(notes, 'Bad', 'Ruim')
  WHEN notes LIKE '%bad%' THEN REPLACE(notes, 'bad', 'ruim')
  WHEN notes LIKE '%Normal%' THEN REPLACE(notes, 'Normal', 'Normal')
  WHEN notes LIKE '%normal%' THEN REPLACE(notes, 'normal', 'normal')
  WHEN notes LIKE '%Pain%' THEN REPLACE(notes, 'Pain', 'Dor')
  WHEN notes LIKE '%pain%' THEN REPLACE(notes, 'pain', 'dor')
  WHEN notes LIKE '%Fever%' THEN REPLACE(notes, 'Fever', 'Febre')
  WHEN notes LIKE '%fever%' THEN REPLACE(notes, 'fever', 'febre')
  WHEN notes LIKE '%Nausea%' THEN REPLACE(notes, 'Nausea', 'Náusea')
  WHEN notes LIKE '%nausea%' THEN REPLACE(notes, 'nausea', 'náusea')
  WHEN notes LIKE '%Vomit%' THEN REPLACE(notes, 'Vomit', 'Vômito')
  WHEN notes LIKE '%vomit%' THEN REPLACE(notes, 'vomit', 'vômito')
  WHEN notes LIKE '%Sleep%' THEN REPLACE(notes, 'Sleep', 'Sono')
  WHEN notes LIKE '%sleep%' THEN REPLACE(notes, 'sleep', 'sono')
  WHEN notes LIKE '%Awake%' THEN REPLACE(notes, 'Awake', 'Acordado')
  WHEN notes LIKE '%awake%' THEN REPLACE(notes, 'awake', 'acordado')
  WHEN notes LIKE '%Happy%' THEN REPLACE(notes, 'Happy', 'Feliz')
  WHEN notes LIKE '%happy%' THEN REPLACE(notes, 'happy', 'feliz')
  WHEN notes LIKE '%Sad%' THEN REPLACE(notes, 'Sad', 'Triste')
  WHEN notes LIKE '%sad%' THEN REPLACE(notes, 'sad', 'triste')
  WHEN notes LIKE '%Angry%' THEN REPLACE(notes, 'Angry', 'Irritado')
  WHEN notes LIKE '%angry%' THEN REPLACE(notes, 'angry', 'irritado')
  WHEN notes LIKE '%Calm%' THEN REPLACE(notes, 'Calm', 'Calmo')
  WHEN notes LIKE '%calm%' THEN REPLACE(notes, 'calm', 'calmo')
  WHEN notes LIKE '%Anxious%' THEN REPLACE(notes, 'Anxious', 'Ansioso')
  WHEN notes LIKE '%anxious%' THEN REPLACE(notes, 'anxious', 'ansioso')
  ELSE notes
END
WHERE notes IS NOT NULL;

-- Traduzir nomes de medicamentos comuns
UPDATE events 
SET med_name = CASE 
  WHEN med_name LIKE '%Paracetamol%' THEN REPLACE(med_name, 'Paracetamol', 'Paracetamol')
  WHEN med_name LIKE '%Aspirin%' THEN REPLACE(med_name, 'Aspirin', 'Aspirina')
  WHEN med_name LIKE '%Ibuprofen%' THEN REPLACE(med_name, 'Ibuprofen', 'Ibuprofeno')
  WHEN med_name LIKE '%Antibiotic%' THEN REPLACE(med_name, 'Antibiotic', 'Antibiótico')
  WHEN med_name LIKE '%antibiotic%' THEN REPLACE(med_name, 'antibiotic', 'antibiótico')
  WHEN med_name LIKE '%Vitamin%' THEN REPLACE(med_name, 'Vitamin', 'Vitamina')
  WHEN med_name LIKE '%vitamin%' THEN REPLACE(med_name, 'vitamin', 'vitamina')
  ELSE med_name
END
WHERE med_name IS NOT NULL;

-- Traduzir descrições de refeições
UPDATE events 
SET meal_desc = CASE 
  WHEN meal_desc LIKE '%Rice%' THEN REPLACE(meal_desc, 'Rice', 'Arroz')
  WHEN meal_desc LIKE '%rice%' THEN REPLACE(meal_desc, 'rice', 'arroz')
  WHEN meal_desc LIKE '%Beans%' THEN REPLACE(meal_desc, 'Beans', 'Feijão')
  WHEN meal_desc LIKE '%beans%' THEN REPLACE(meal_desc, 'beans', 'feijão')
  WHEN meal_desc LIKE '%Meat%' THEN REPLACE(meal_desc, 'Meat', 'Carne')
  WHEN meal_desc LIKE '%meat%' THEN REPLACE(meal_desc, 'meat', 'carne')
  WHEN meal_desc LIKE '%Chicken%' THEN REPLACE(meal_desc, 'Chicken', 'Frango')
  WHEN meal_desc LIKE '%chicken%' THEN REPLACE(meal_desc, 'chicken', 'frango')
  WHEN meal_desc LIKE '%Fish%' THEN REPLACE(meal_desc, 'Fish', 'Peixe')
  WHEN meal_desc LIKE '%fish%' THEN REPLACE(meal_desc, 'fish', 'peixe')
  WHEN meal_desc LIKE '%Vegetables%' THEN REPLACE(meal_desc, 'Vegetables', 'Vegetais')
  WHEN meal_desc LIKE '%vegetables%' THEN REPLACE(meal_desc, 'vegetables', 'vegetais')
  WHEN meal_desc LIKE '%Salad%' THEN REPLACE(meal_desc, 'Salad', 'Salada')
  WHEN meal_desc LIKE '%salad%' THEN REPLACE(meal_desc, 'salad', 'salada')
  WHEN meal_desc LIKE '%Soup%' THEN REPLACE(meal_desc, 'Soup', 'Sopa')
  WHEN meal_desc LIKE '%soup%' THEN REPLACE(meal_desc, 'soup', 'sopa')
  WHEN meal_desc LIKE '%Bread%' THEN REPLACE(meal_desc, 'Bread', 'Pão')
  WHEN meal_desc LIKE '%bread%' THEN REPLACE(meal_desc, 'bread', 'pão')
  WHEN meal_desc LIKE '%Fruit%' THEN REPLACE(meal_desc, 'Fruit', 'Fruta')
  WHEN meal_desc LIKE '%fruit%' THEN REPLACE(meal_desc, 'fruit', 'fruta')
  ELSE meal_desc
END
WHERE meal_desc IS NOT NULL;

-- Traduzir notas de humor
UPDATE events 
SET mood_notes = CASE 
  WHEN mood_notes LIKE '%Happy%' THEN REPLACE(mood_notes, 'Happy', 'Feliz')
  WHEN mood_notes LIKE '%happy%' THEN REPLACE(mood_notes, 'happy', 'feliz')
  WHEN mood_notes LIKE '%Sad%' THEN REPLACE(mood_notes, 'Sad', 'Triste')
  WHEN mood_notes LIKE '%sad%' THEN REPLACE(mood_notes, 'sad', 'triste')
  WHEN mood_notes LIKE '%Angry%' THEN REPLACE(mood_notes, 'Angry', 'Irritado')
  WHEN mood_notes LIKE '%angry%' THEN REPLACE(mood_notes, 'angry', 'irritado')
  WHEN mood_notes LIKE '%Calm%' THEN REPLACE(mood_notes, 'Calm', 'Calmo')
  WHEN mood_notes LIKE '%calm%' THEN REPLACE(mood_notes, 'calm', 'calmo')
  WHEN mood_notes LIKE '%Anxious%' THEN REPLACE(mood_notes, 'Anxious', 'Ansioso')
  WHEN mood_notes LIKE '%anxious%' THEN REPLACE(mood_notes, 'anxious', 'ansioso')
  WHEN mood_notes LIKE '%Tired%' THEN REPLACE(mood_notes, 'Tired', 'Cansado')
  WHEN mood_notes LIKE '%tired%' THEN REPLACE(mood_notes, 'tired', 'cansado')
  WHEN mood_notes LIKE '%Energetic%' THEN REPLACE(mood_notes, 'Energetic', 'Energético')
  WHEN mood_notes LIKE '%energetic%' THEN REPLACE(mood_notes, 'energetic', 'energético')
  ELSE mood_notes
END
WHERE mood_notes IS NOT NULL;

-- ========================================
-- 3. TRADUÇÃO DA TABELA PATIENTS
-- ========================================

-- Traduzir notas dos pacientes
UPDATE patients 
SET notes = CASE 
  WHEN notes LIKE '%Admitted%' THEN REPLACE(notes, 'Admitted', 'Internado')
  WHEN notes LIKE '%admitted%' THEN REPLACE(notes, 'admitted', 'internado')
  WHEN notes LIKE '%Discharged%' THEN REPLACE(notes, 'Discharged', 'Alta médica')
  WHEN notes LIKE '%discharged%' THEN REPLACE(notes, 'discharged', 'alta médica')
  WHEN notes LIKE '%Surgery%' THEN REPLACE(notes, 'Surgery', 'Cirurgia')
  WHEN notes LIKE '%surgery%' THEN REPLACE(notes, 'surgery', 'cirurgia')
  WHEN notes LIKE '%Treatment%' THEN REPLACE(notes, 'Treatment', 'Tratamento')
  WHEN notes LIKE '%treatment%' THEN REPLACE(notes, 'treatment', 'tratamento')
  WHEN notes LIKE '%Recovery%' THEN REPLACE(notes, 'Recovery', 'Recuperação')
  WHEN notes LIKE '%recovery%' THEN REPLACE(notes, 'recovery', 'recuperação')
  WHEN notes LIKE '%Stable%' THEN REPLACE(notes, 'Stable', 'Estável')
  WHEN notes LIKE '%stable%' THEN REPLACE(notes, 'stable', 'estável')
  WHEN notes LIKE '%Critical%' THEN REPLACE(notes, 'Critical', 'Crítico')
  WHEN notes LIKE '%critical%' THEN REPLACE(notes, 'critical', 'crítico')
  WHEN notes LIKE '%Improving%' THEN REPLACE(notes, 'Improving', 'Melhorando')
  WHEN notes LIKE '%improving%' THEN REPLACE(notes, 'improving', 'melhorando')
  WHEN notes LIKE '%Worsening%' THEN REPLACE(notes, 'Worsening', 'Piorando')
  WHEN notes LIKE '%worsening%' THEN REPLACE(notes, 'worsening', 'piorando')
  ELSE notes
END
WHERE notes IS NOT NULL;

-- Traduzir informações de leito
UPDATE patients 
SET bed = CASE 
  WHEN bed LIKE '%ICU%' THEN REPLACE(bed, 'ICU', 'UTI')
  WHEN bed LIKE '%Room%' THEN REPLACE(bed, 'Room', 'Quarto')
  WHEN bed LIKE '%room%' THEN REPLACE(bed, 'room', 'quarto')
  WHEN bed LIKE '%Ward%' THEN REPLACE(bed, 'Ward', 'Enfermaria')
  WHEN bed LIKE '%ward%' THEN REPLACE(bed, 'ward', 'enfermaria')
  WHEN bed LIKE '%Bed%' THEN REPLACE(bed, 'Bed', 'Leito')
  WHEN bed LIKE '%bed%' THEN REPLACE(bed, 'bed', 'leito')
  ELSE bed
END
WHERE bed IS NOT NULL;

-- ========================================
-- 4. COMENTÁRIOS SOBRE AS TRADUÇÕES
-- ========================================

/*
TRADUÇÕES REALIZADAS:

1. TABELA PROFILES:
   - Funções: doctor → medico, nurse → enfermeiro, admin → administrador
   - Nomes de teste traduzidos para português

2. TABELA EVENTS:
   - Tipos de banheiro traduzidos
   - Notas com termos médicos e alimentares traduzidos
   - Nomes de medicamentos comuns traduzidos
   - Descrições de refeições traduzidas
   - Notas de humor traduzidas

3. TABELA PATIENTS:
   - Notas médicas traduzidas
   - Informações de leito traduzidas (ICU → UTI, etc.)

IMPORTANTE:
- Este script traduz apenas os dados existentes
- Para novos registros, será necessário atualizar a aplicação
- Os ENUMs do banco podem precisar ser atualizados separadamente
- Recomenda-se fazer backup antes de executar

PRÓXIMOS PASSOS:
1. Execute este script no SQL Editor do Supabase Dashboard
2. Verifique se todas as traduções foram aplicadas corretamente
3. Teste a aplicação para garantir compatibilidade
*/