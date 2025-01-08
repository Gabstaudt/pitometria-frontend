const apiBaseUrl = 'http://localhost:3000/api';

// Inicializar o mapa com Leaflet
const map = L.map('map').setView([-1.455, -48.502], 10); // Coordenadas padrão
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
}).addTo(map);

// Evento DOMContentLoaded para carregar funções iniciais
document.addEventListener('DOMContentLoaded', () => {
  carregarSetores();
  carregarPontos();
  carregarGraficos();
});

// Função para carregar setores
async function carregarSetores() {
  const response = await fetch(`${apiBaseUrl}/setores`);
  const setores = await response.json();
  const listaSetores = document.getElementById('setores-list');
  const selectSetor = document.getElementById('ponto-setor');
  listaSetores.innerHTML = '';
  selectSetor.innerHTML = '<option value="">Selecione um Setor</option>';
  
  setores.forEach((setor) => {
    const li = document.createElement('li');
    li.textContent = setor.nome;
    const botaoExcluir = document.createElement('button');
    botaoExcluir.textContent = 'Excluir';
    botaoExcluir.onclick = async () => {
      await fetch(`${apiBaseUrl}/setores/${setor.id}`, { method: 'DELETE' });
      carregarSetores();
      carregarPontos();
    };
    li.appendChild(botaoExcluir);
    listaSetores.appendChild(li);

    const option = document.createElement('option');
    option.value = setor.id;
    option.textContent = setor.nome;
    selectSetor.appendChild(option);
  });
}

// Função para carregar pontos e plotar no mapa
let todosPontos = []; // Armazena todos os pontos para facilitar a pesquisa

async function carregarPontos() {
  try {
    const response = await fetch(`${apiBaseUrl}/pontos`);
    if (!response.ok) throw new Error('Erro ao buscar os pontos');

    todosPontos = await response.json(); // Salva todos os pontos
    console.log('Pontos recebidos da API:', todosPontos);

    exibirPontos(todosPontos); // Exibe os pontos no mapa e na lista
  } catch (error) {
    console.error('Erro ao carregar pontos:', error.message);
  }
}

function exibirPontos(pontos) {
  const listaPontos = document.getElementById('pontos-list');
  listaPontos.innerHTML = '';

  // Limpa marcadores antigos
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  // Adiciona pontos ao mapa e à lista
  pontos.forEach((ponto) => {
    if (ponto.latitude && ponto.longitude) {
      console.log(`Adicionando marcador para: ${ponto.ponto_de_medicao}`);
      const marker = L.marker([ponto.latitude, ponto.longitude]).addTo(map);
      marker.bindPopup(`
        <div style="font-family: Arial, sans-serif;">
          <b style="color: #007bff;">${ponto.ponto_de_medicao}</b><br>
          <b>Setor:</b> <span style="color: #007bff;">${ponto.setor_nome || 'Desconhecido'}</span><br>
          <b>Vazão:</b> ${ponto.vazao_m3_h || 'N/A'} m³/h<br>
          <b>Pressão:</b> ${ponto.pressao_mca || 'N/A'} mca<br>
          <b>Observação:</b> ${ponto.observacao || 'Nenhuma'}
        </div>
      `);
    }

    // Adiciona ponto à lista
    const li = document.createElement('li');
    li.textContent = `${ponto.ponto_de_medicao} - Setor: ${ponto.setor_id}`;
    listaPontos.appendChild(li);
  });
}

document.addEventListener('DOMContentLoaded', carregarPontos);


// Função para atualizar a lista de pontos com base nos dados filtrados
function atualizarListaPontos(pontosFiltrados) {
  const listaPontos = document.getElementById('pontos-list');
  listaPontos.innerHTML = '';

  pontosFiltrados.forEach((ponto) => {
    const li = document.createElement('li');
    li.textContent = `${ponto.ponto_de_medicao} - Setor: ${ponto.setor_id}`;

    // Botão de editar
    const botaoEditar = document.createElement('button');
    botaoEditar.textContent = 'Editar';
    botaoEditar.style.marginLeft = '10px';
    botaoEditar.onclick = () => abrirModalEditar(ponto);
    li.appendChild(botaoEditar);

    listaPontos.appendChild(li);
  });
}

// Adiciona evento para o campo de pesquisa
document.getElementById('pesquisa-pontos').addEventListener('input', (event) => {
  const termoPesquisa = event.target.value.toLowerCase();

  // Filtrar pontos pelo termo de pesquisa
  const pontosFiltrados = todosPontos.filter((ponto) =>
    ponto.ponto_de_medicao.toLowerCase().includes(termoPesquisa)
  );

  // Atualizar a lista com os pontos filtrados
  atualizarListaPontos(pontosFiltrados);
});

// Chamar a função de carregar pontos ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
  carregarPontos();
});


// Função para abrir modal de edição
function abrirModalEditar(ponto) {
  pontoSelecionado = ponto;
  document.getElementById('editar-nome-modal').value = ponto.ponto_de_medicao;
  document.getElementById('editar-ep-modal').value = ponto.ep;
  document.getElementById('editar-vazao-modal').value = ponto.vazao_m3_h;
  document.getElementById('editar-pressao-modal').value = ponto.pressao_mca;
  document.getElementById('editar-latitude-modal').value = ponto.latitude;
  document.getElementById('editar-longitude-modal').value = ponto.longitude;
  document.getElementById('editar-observacao-modal').value = ponto.observacao || '';
  document.getElementById('modal-editar').style.display = 'flex';
}

// Evento para fechar o modal
document.getElementById('fechar-modal').addEventListener('click', () => {
  document.getElementById('modal-editar').style.display = 'none';
});

// Submissão do formulário de edição
document.getElementById('form-editar-ponto').addEventListener('submit', async (event) => {
  event.preventDefault();

  const pontoAtualizado = {
    ep: document.getElementById('editar-ep-modal').value || null,
    ponto_de_medicao: document.getElementById('editar-nome-modal').value || null,
    vazao_m3_h: parseFloat(document.getElementById('editar-vazao-modal').value) || null,
    pressao_mca: parseFloat(document.getElementById('editar-pressao-modal').value) || null,
    latitude: parseFloat(document.getElementById('editar-latitude-modal').value) || null,
    longitude: parseFloat(document.getElementById('editar-longitude-modal').value) || null,
    observacao: document.getElementById('editar-observacao-modal').value || null,
  };

  try {
    await fetch(`${apiBaseUrl}/pontos/${pontoSelecionado.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pontoAtualizado),
    });
    document.getElementById('modal-editar').style.display = 'none';
    carregarPontos(); // Atualiza a lista após edição
  } catch (error) {
    console.error('Erro ao atualizar o ponto de medição:', error);
  }
});


// Exportar pontos de medição
document.getElementById('exportar-planilha').addEventListener('click', () => {
  window.location.href = `${apiBaseUrl}/pontos/exportar`;
});

// Função para carregar gráficos
async function carregarGraficos() {
  try {
    const response = await fetch(`${apiBaseUrl}/pontos/relatorios/dados-graficos`);
    const dados = await response.json();

    if (dados.length === 0) return;

    // Gráfico de Barras
    const barCtx = document.getElementById('graficoBarras').getContext('2d');
    new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: dados.map((d) => d.categoria),
        datasets: [
          {
            label: 'Vazão por Setor (m³/h)',
            data: dados.map((d) => d.total),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
          },
        ],
      },
    });

    // Gráfico de Pizza
    const pieCtx = document.getElementById('graficoPizza').getContext('2d');
    new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: dados.map((d) => d.categoria),
        datasets: [
          {
            data: dados.map((d) => d.total),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
          },
        ],
      },
    });
  } catch (error) {
    console.error('Erro ao carregar gráficos:', error.message);
  }
}
