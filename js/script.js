const form = document.querySelector("#formBusca");
const inputBusca = document.querySelector("#inputBusca");
const mensagem = document.querySelector("#mensagem");
const cartaoPokemon = document.querySelector("#cartaoPokemon");

const ui = {
  nome: document.querySelector("#nomePokemon"),
  numero: document.querySelector("#numeroPokemon"),
  imagem: document.querySelector("#imagemPokemon"),
  tipos: document.querySelector("#tiposPokemon"),
  descricao: document.querySelector("#descricaoPokemon"),
  peso: document.querySelector("#pesoPokemon"),
  altura: document.querySelector("#alturaPokemon"),
  listaStatus: document.querySelector("#listaStatus"),
};

const botoes = {
  anterior: document.querySelector("#btnAnterior"),
  proximo: document.querySelector("#btnProximo"),
  shiny: document.querySelector("#btnShiny"),
  som: document.querySelector("#btnSom"),
};

const coresDosTipos = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

const nomesDosStatus = {
  hp: "Vida",
  attack: "Ataque",
  defense: "Defesa",
  "special-attack": "Atq. Esp",
  "special-defense": "Def. Esp",
  speed: "Veloc.",
};

let idAtual = 1;
let dadosAtuais = null;
let mostrandoShiny = false;

const buscarPokemon = async (query) => {
  if (!query) return;

  mostrarMensagem("Buscando...", true);
  cartaoPokemon.hidden = true;

  try {
    const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
    if (!resposta.ok) throw new Error("Não encontrado");

    const dados = await resposta.json();

    try {
      const resEspecie = await fetch(dados.species.url);
      const dadosEspecie = await resEspecie.json();
      const entrada =
        dadosEspecie.flavor_text_entries.find(
          (e) => e.language.name === "es"
        ) ||
        dadosEspecie.flavor_text_entries.find((e) => e.language.name === "en");
      dados.textoDescricao = entrada
        ? entrada.flavor_text.replace(/[\n\f]/g, " ")
        : "Sem descrição disponível.";
    } catch (err) {
      dados.textoDescricao = "Sem descrição disponível.";
    }

    idAtual = dados.id;
    dadosAtuais = dados;
    mostrandoShiny = false;

    renderizarInterface(dados);
  } catch (erro) {
    mostrarMensagem(
      "Pokémon não encontrado. Tente outro nome ou número.",
      true
    );
  }
};

const renderizarInterface = (dados) => {
  mostrarMensagem("", false);
  cartaoPokemon.hidden = false;

  ui.nome.textContent = dados.name;
  ui.numero.textContent = `#${String(dados.id).padStart(3, "0")}`;
  ui.peso.textContent = `${dados.weight / 10} kg`;
  ui.altura.textContent = `${dados.height / 10} m`;
  ui.descricao.textContent = `"${dados.textoDescricao}"`;

  atualizarImagem();

  ui.tipos.innerHTML = "";
  const tipoPrincipal = dados.types[0].type.name;
  const corTema = coresDosTipos[tipoPrincipal] || "#A8A77A";

  document.documentElement.style.setProperty("--cor-tipo", corTema);

  dados.types.forEach((tipo) => {
    const span = document.createElement("span");
    span.textContent = tipo.type.name;
    span.className = "tipo-badge";
    span.style.background = coresDosTipos[tipo.type.name];
    ui.tipos.appendChild(span);
  });

  ui.listaStatus.innerHTML = "";
  dados.stats.forEach((stat) => {
    const porcentagem = Math.min((stat.base_stat / 255) * 100, 100);
    const nomeTraduzido = nomesDosStatus[stat.stat.name] || stat.stat.name;

    ui.listaStatus.innerHTML += `
      <div class="status-linha">
        <span class="status-nome">${nomeTraduzido}</span>
        <span class="status-valor">${stat.base_stat}</span>
        <div class="status-barra">
          <div class="status-progresso" style="width: ${porcentagem}%"></div>
        </div>
      </div>
    `;
  });

  botoes.anterior.disabled = idAtual <= 1;
};

const atualizarImagem = () => {
  const artwork = dadosAtuais.sprites.other["official-artwork"];
  const sprite = dadosAtuais.sprites;

  const imgNormal = artwork.front_default || sprite.front_default;
  const imgShiny = artwork.front_shiny || sprite.front_shiny;

  ui.imagem.src = mostrandoShiny ? imgShiny || imgNormal : imgNormal;
};

const mostrarMensagem = (texto, exibir) => {
  mensagem.textContent = texto;
  mensagem.style.display = exibir ? "block" : "none";
};

// Eventos
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const valor = inputBusca.value.toLowerCase().trim();
  buscarPokemon(valor);
  inputBusca.value = "";
});

botoes.anterior.addEventListener("click", () => {
  if (idAtual > 1) buscarPokemon(idAtual - 1);
});

botoes.proximo.addEventListener("click", () => {
  buscarPokemon(idAtual + 1);
});

botoes.shiny.addEventListener("click", () => {
  if (!dadosAtuais) return;
  mostrandoShiny = !mostrandoShiny;
  atualizarImagem();
});

botoes;
