const apiBaseUrl = 'http://localhost:3000/api';

// Inicializar o mapa com Leaflet
const map = L.map('map').setView([-1.455, -48.502], 10); // Coordenadas padrão
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
}).addTo(map);

document.addEventListener('DOMContentLoaded', () => {
  carregarSetores();
  carregarPontos();
  carregarGraficos(); 


  // Formulário de Setores
  const formularioSetor = document.getElementById('setor-form');
  formularioSetor.addEventListener('submit', async (event) => {
    event.preventDefault();
    const nome = document.getElementById('setor-nome').value;
    await fetch(`${apiBaseUrl}/setores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    });
    formularioSetor.reset();
    carregarSetores();
  });

  // Formulário de Pontos
  const formularioPonto = document.getElementById('ponto-form');
  formularioPonto.addEventListener('submit', async (event) => {
    event.preventDefault();
    const nome = document.getElementById('ponto-nome').value;
    const ep = document.getElementById('ponto-ep').value;
    const vazao = parseFloat(document.getElementById('ponto-vazao').value);
    const latitude = parseFloat(document.getElementById('ponto-latitude').value);
    const longitude = parseFloat(document.getElementById('ponto-longitude').value);
    const setorId = document.getElementById('ponto-setor').value;

    await fetch(`${apiBaseUrl}/pontos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ponto_de_medicao: nome,
        ep,
        vazao_m3_h: vazao,
        latitude,
        longitude,
        setor_id: setorId,
      }),
    });
    formularioPonto.reset();
    carregarPontos();
  });
});

// Carregar setores
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

// Carregar pontos de medição e plotar no mapa
async function carregarPontos() {
  const response = await fetch(`${apiBaseUrl}/pontos`);
  const pontos = await response.json();
  const listaPontos = document.getElementById('pontos-list');
  listaPontos.innerHTML = '';
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  pontos.forEach((ponto) => {
    const li = document.createElement('li');
    li.textContent = `${ponto.ponto_de_medicao} - Setor: ${ponto.setor_id}`;
    const botaoExcluir = document.createElement('button');
    botaoExcluir.textContent = 'Excluir';
    botaoExcluir.onclick = async () => {
      await fetch(`${apiBaseUrl}/pontos/${ponto.id}`, { method: 'DELETE' });
      carregarPontos();
    };
    li.appendChild(botaoExcluir);
    listaPontos.appendChild(li);

    if (ponto.latitude && ponto.longitude) {
      const marker = L.marker([ponto.latitude, ponto.longitude]).addTo(map);

      // Adicione evento de clique no marcador
      marker.on('click', async () => {
        const response = await fetch(`${apiBaseUrl}/pontos/${ponto.id}`);
        const detalhes = await response.json();

        // Conteúdo detalhado do popup
        const popupContent = `
          <b>${detalhes.ponto_de_medicao}</b><br>
          Vazão: ${detalhes.vazao_m3_h} m³/h<br>
          Pressão: ${detalhes.pressao_mca} mca<br>
          Observação: ${detalhes.observacao || 'Nenhuma'}
        `;
        marker.bindPopup(popupContent).openPopup();
      });
    }
  });
}

// Adicionar evento para exportar planilha
document.getElementById('exportar-planilha').addEventListener('click', () => {
  window.location.href = 'http://localhost:3000/api/pontos/exportar'; // Ajuste para a URL correta do backend
});



async function carregarGraficos() {
  try {
      // Buscar os dados do backend
      const response = await fetch(`${apiBaseUrl}/pontos/relatorios/dados-graficos`);
      const dados = await response.json();

      if (dados.length === 0) {
          console.error('Nenhum dado encontrado para os gráficos.');
          return;
      }

      // Gráfico de Barras
      const barCtx = document.getElementById('graficoBarras').getContext('2d');
      new Chart(barCtx, {
          type: 'bar',
          data: {
              labels: dados.map(d => d.categoria),
              datasets: [{
                  label: 'Vazão por Setor (m³/h)',
                  data: dados.map(d => d.total),
                  backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
              }],
          },
          options: {
              responsive: true,
              plugins: {
                  legend: { position: 'top' },
              },
              scales: {
                  y: {
                      beginAtZero: true
                  }
              }
          },
      });

      // Gráfico de Pizza
      const pieCtx = document.getElementById('graficoPizza').getContext('2d');
      new Chart(pieCtx, {
          type: 'pie',
          data: {
              labels: dados.map(d => d.categoria),
              datasets: [{
                  data: dados.map(d => d.total),
                  backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
              }],
          },
          options: {
              responsive: true,
              plugins: {
                  legend: { position: 'top' },
              },
          },
      });
  } catch (error) {
      console.error('Erro ao carregar os gráficos:', error.message);
  }
}

// Chamar a função ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
  carregarGraficos();
});

