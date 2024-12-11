const apiBaseUrl = 'http://localhost:3000/api';

// Inicializar o mapa com Leaflet
const map = L.map('map').setView([-1.455, -48.502], 10); // Coordenadas padrão
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
}).addTo(map);

document.addEventListener('DOMContentLoaded', () => {
  carregarSetores();
  carregarPontos();

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
      marker.bindPopup(`<b>${ponto.ponto_de_medicao}</b><br>Setor: ${ponto.setor_id}`).openPopup();
    }
  });
}
