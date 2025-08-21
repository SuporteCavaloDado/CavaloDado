// Configuração do Supabase para o cliente (navegador)
import { createClient } from '@supabase/supabase-js';

// URLs e chaves com placeholders para o build
const supabaseUrl = 'https://ipikrqsqcjtzjuabyqkz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwaWtycXNxY2p0emp1YWJ5cWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNzAyODEsImV4cCI6MjA3MDg0NjI4MX0.ogW-14318G_mqAr-YSFC8n-Ob9QgxqbFEk4FoT4UVWU';

// Criar cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Resto do código igual...
export const CONFIG = {
    MAX_PEDIDOS_POR_HORA: 1,
    INTERVALO_PEDIDOS_HORAS: 2,
    MAX_CARACTERES_PRODUTO: 60,
    MAX_FOTOS: 10,
    MAX_VIDEO_SEGUNDOS: 60,
    MIN_CODIGO_RASTREIO: 13,
    DIAS_PRODUTO_NAO_ENTREGUE: 90,
    EMAIL_SUPORTE: 'suporte.cavalodado@gmail.com'
};

export const ESTADOS_BRASIL = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const CATEGORIAS = ['Empresa', 'Estudos', 'Pessoal', 'Esportes'];

export const STATUS_PEDIDOS = {
    DISPONIVEL: 'Disponível',
    PENDENTE: 'Pendente', 
    CONCLUIDO: 'Concluído'
};

export const PRODUTOS_PROIBIDOS = [
    'armas', 'perecíveis', 'dinheiro', 'transferência bancária',
    'animais', 'seres vivos', 'serviços', 'drogas', 'veículos',
    'pagamentos', 'boletos', 'ativos financeiros', 'imóveis'
];
