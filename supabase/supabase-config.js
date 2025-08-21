// Importar Supabase (adicione no HTML antes deste script)
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// Configuração do Supabase
const SUPABASE_URL = 'https://ipikrqsqcjtzjuabyqkz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwaWtycXNxY2p0emp1YWJ5cWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNzAyODEsImV4cCI6MjA3MDg0NjI4MX0.ogW-14318G_mqAr-YSFC8n-Ob9QgxqbFEk4FoT4UVWU';

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configurações globais
const CONFIG = {
    MAX_PEDIDOS_POR_HORA: 1,
    INTERVALO_PEDIDOS_HORAS: 2,
    MAX_CARACTERES_PRODUTO: 60,
    MAX_FOTOS: 1,
    MIN_CODIGO_RASTREIO: 13,
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
