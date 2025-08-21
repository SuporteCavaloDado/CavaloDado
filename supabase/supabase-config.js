// Configuração do Supabase para o cliente (navegador)
let supabase = null;

try {
    const { createClient } = require('@supabase/supabase-js');
    
    // URLs e chaves diretamente no código
    const supabaseUrl = 'https://ipikrqsqcjtzjuabyqkz.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwaWtycXNxY2p0emp1YWJ5cWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNzAyODEsImV4cCI6MjA3MDg0NjI4MX0.ogW-14318G_mqAr-YSFC8n-Ob9QgxqbFEk4FoT4UVWU';
    
    // Criar cliente do Supabase
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
    console.warn('Supabase não carregado:', error.message);
}

// Configurações globais
const CONFIG = {
    MAX_PEDIDOS_POR_HORA: 1,
    INTERVALO_PEDIDOS_HORAS: 2,
    MAX_CARACTERES_PRODUTO: 60,
    MAX_FOTOS: 10,
    MAX_VIDEO_SEGUNDOS: 60,
    MIN_CODIGO_RASTREIO: 13,
    DIAS_PRODUTO_NAO_ENTREGUE: 90,
    EMAIL_SUPORTE: 'suporte.cavalodado@gmail.com'
};

// Estados brasileiros
const ESTADOS_BRASIL = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Categorias de produtos
const CATEGORIAS = ['Empresa', 'Estudos', 'Pessoal', 'Esportes'];

// Status dos pedidos
const STATUS_PEDIDOS = {
    DISPONIVEL: 'Disponível',
    PENDENTE: 'Pendente', 
    CONCLUIDO: 'Concluído'
};

// Produtos proibidos
const PRODUTOS_PROIBIDOS = [
    'armas', 'perecíveis', 'dinheiro', 'transferência bancária',
    'animais', 'seres vivos', 'serviços', 'drogas', 'veículos',
    'pagamentos', 'boletos', 'ativos financeiros', 'imóveis'
];

module.exports = { 
    supabase, 
    CONFIG, 
    ESTADOS_BRASIL, 
    CATEGORIAS, 
    STATUS_PEDIDOS, 
    PRODUTOS_PROIBIDOS 
};
