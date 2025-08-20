const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  module.exports = { supabase };

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

