const API_URL = 'https://apimapyngua.mapyngua.com.br/api';

// Função auxiliar para pegar os headers sempre atualizados
const getHeaders = () => {
  const adminKey = localStorage.getItem('ADMIN_KEY') || '';
  return {
    'Content-Type': 'application/json',
    'x-admin-key': adminKey
  };
};

// Wrapper genérico para fetch
const request = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_URL}${endpoint}`;
  const headers = getHeaders();

  const config = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Se der erro de autenticação (401), podemos avisar ou deslogar
    if (response.status === 401) {
      console.error('Erro de autenticação: Verifique sua Admin Key');
    }

    // Se a resposta não for ok, lança erro
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }

    // Tenta fazer o parse do JSON, mas não quebra se não tiver corpo (ex: DELETE)
    const data = await response.json().catch(() => null);
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const api = {
  // --- ITEMS ---
  items: {
    list: () => request('/items'),
    create: (data: any) => request('/items', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/items/${id}`, { method: 'DELETE' }),
  },

  // --- STREAMS ---
  streams: {
    create: (itemId: number, data: any) => request(`/items/${itemId}/streams`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/streams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/streams/${id}`, { method: 'DELETE' }),
  },

  // --- CONFIGS (SETUP CODES) ---
  configs: {
    list: () => request('/configs'),
    create: (token: string) => request('/configs', { method: 'POST', body: JSON.stringify({ debrid_token: token }) }),
    update: (id: number, token: string) => request(`/configs/${id}`, { method: 'PUT', body: JSON.stringify({ debrid_token: token }) }),
    delete: (id: number) => request(`/configs/${id}`, { method: 'DELETE' }),
  },

  // --- SUBTITLES ---
  subtitles: {
    delete: (id: number) => request(`/subtitles/${id}`, { method: 'DELETE' }),
  },

  // --- REALDEBRID-API PARA CONSULTAR TORRENT ---
rd: {
    addMagnet: (magnet: string, token: string) => request('/rd/addMagnet', { 
        method: 'POST', 
        body: JSON.stringify({ magnet }),
        headers: { 'Authorization': `Bearer ${token}` } // Envia o token RD aqui
    }),
    getInfo: (id: string | number, token: string) => request(`/rd/info/${id}`, { 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
  }
};