const form = document.querySelector("#formBusca");
const inputBusca = document.querySelector("#inputBusca");
const mensagem = document.querySelector("#mensagem");
const cartaoPokemon = document.querySelector("#cartaoPokemon");
const gifPokebola = document.querySelector("#gifPokebola");
const textoMensagem = document.querySelector("#textoMensagem");

const ui = {
    nome: document.querySelector("#nomePokemon"),
    numero: document.querySelector("#numeroPokemon"),
    imagem: document.querySelector("#imagemPokemon"),
    tipos: document.querySelector("#tiposPokemon"),
    descricao: document.querySelector("#descricaoPokemon"),
    peso: document.querySelector("#pesoPokemon"),
    altura: document.querySelector("#alturaPokemon"),
    listaStatus: document.querySelector("#listaStatus")
};

const botoes = {
    anterior: document.querySelector("#btnAnterior"),
    proximo: document.querySelector("#btnProximo"),
    shiny: document.querySelector("#btnShiny"),
    capturar: document.querySelector("#botao-capturar")
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
    fairy: "#D685AD"
};

const nomesDosStatus = {
    hp: "Vida",
    attack: "Ataque",
    defense: "Defesa",
    "special-attack": "Atq. Esp",
    "special-defense": "Def. Esp",
    speed: "Veloc."
};

let idAtual = 1;
let dadosAtuais = null;
let mostrandoShiny = false;

const cacheTraducoes = new Map();

const traduzirParaPortugues = async (texto) => {
    if (cacheTraducoes.has(texto)) {
        return cacheTraducoes.get(texto);
    }

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=en|pt-BR`;

        const resposta = await fetch(url);
        const json = await resposta.json();

        const traduzido = json.responseData.translatedText;

        if (json.responseStatus !== 200 || !traduzido) {
            return texto;
        }

        cacheTraducoes.set(texto, traduzido);

        return traduzido;

    } catch (erro) {
        return texto;
    }
};

const buscarDescricao = (dadosEspecie) => {
    const entradas = dadosEspecie.flavor_text_entries;

    const portugues = entradas.find(
        (item) => item.language.name === "pt"
    );

    if (portugues) {
        return portugues.flavor_text.replace(/[\n\f]/g, " ");
    }

    const ingles = entradas.find(
        (item) => item.language.name === "en"
    );

    return ingles
        ? ingles.flavor_text.replace(/[\n\f]/g, " ")
        : null;
};

const buscarPokemon = async (query) => {
    if (!query) return;

    mostrarMensagem("Buscando...", true);
    cartaoPokemon.hidden = true;

    try {
        const resposta = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${query}`
        );

        if (!resposta.ok) {
            throw new Error("Pokémon não encontrado");
        }

        const dados = await resposta.json();

        try {
            const respostaEspecie = await fetch(dados.species.url);
            const dadosEspecie = await respostaEspecie.json();

            const descricao = buscarDescricao(dadosEspecie);

            dados.textoDescricao = descricao
                ? await traduzirParaPortugues(descricao)
                : "Sem descrição disponível.";

        } catch (erro) {
            dados.textoDescricao = "Sem descrição disponível.";
        }

        idAtual = dados.id;
        dadosAtuais = dados;
        mostrandoShiny = false;

        renderizarInterface(dados);

    } catch (erro) {
        mostrarMensagem(
            "Pokémon não encontrado. Tente outro nome ou número.",
            true,
            true
        );
    }
};

const renderizarInterface = (dados) => {
    mostrarMensagem("", false);
    cartaoPokemon.hidden = false;

    ui.nome.textContent = dados.name;

    ui.numero.textContent =
        `#${String(dados.id).padStart(3, "0")}`;

    ui.peso.textContent = `${dados.weight / 10} kg`;
    ui.altura.textContent = `${dados.height / 10} m`;

    ui.descricao.textContent = `"${dados.textoDescricao}"`;

    atualizarImagem();

    ui.tipos.innerHTML = "";

    const tipoPrincipal = dados.types[0].type.name;
    const corTema = coresDosTipos[tipoPrincipal] || "#A8A77A";

    document.documentElement.style.setProperty(
        "--cor-tipo",
        corTema
    );

    dados.types.forEach((tipo) => {
        const span = document.createElement("span");

        span.textContent = tipo.type.name;
        span.className = "tipo-badge";
        span.style.background = coresDosTipos[tipo.type.name];

        ui.tipos.appendChild(span);
    });

    ui.listaStatus.innerHTML = "";

    dados.stats.forEach((stat) => {
        const porcentagem = Math.min(
            (stat.base_stat / 255) * 100,
            100
        );

        const nomeTraduzido =
            nomesDosStatus[stat.stat.name] || stat.stat.name;

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

    const imagemNormal =
        artwork.front_default || sprite.front_default;

    const imagemShiny =
        artwork.front_shiny || sprite.front_shiny;

    ui.imagem.src = mostrandoShiny
        ? imagemShiny || imagemNormal
        : imagemNormal;
};

const mostrarMensagem = (texto, exibir, alerta = false) => {
    mensagem.textContent = texto;
    mensagem.style.display = exibir ? "block" : "none";
    mensagem.classList.toggle("alerta", alerta);
};

const LIMITE_PARTY = 6;

const carregarLista = (chave) => {
    try {
        const lista = JSON.parse(localStorage.getItem(chave));

        return Array.isArray(lista) ? lista : [];

    } catch (erro) {
        return [];
    }
};

const janela = document.querySelector("#dialogo-troca");
const textoTroca = document.querySelector("#texto-troca");
const opcoesTroca = document.querySelector("#opcoes-troca");
const btnCancelar = document.querySelector("#cancelar-captura");

let pokemonPendente = null;

let party = carregarLista("pokedex-party");
let carvalho = carregarLista("pokedex-carvalho");

const salvarEDesenhar = () => {
    localStorage.setItem("pokedex-party", JSON.stringify(party));
    localStorage.setItem("pokedex-carvalho", JSON.stringify(carvalho));

    desenharParty();
    desenharCarvalho();
};

const montarItem = (pokemon, textoBotao, aoClicar) => {
    const li = document.createElement("li");

    const img = document.createElement("img");
    img.src = pokemon.imagem;
    img.alt = pokemon.nome;

    const nome = document.createElement("span");
    nome.textContent = pokemon.nome;

    const botao = document.createElement("button");
    botao.textContent = textoBotao;

    botao.addEventListener("click", aoClicar);

    li.append(img, nome, botao);

    return li;
};

const desenharParty = () => {
    const lista = document.querySelector("#party");

    lista.innerHTML = "";

    for (let i = 0; i < LIMITE_PARTY; i++) {
        const pokemon = party[i];

        if (pokemon === undefined) {
            const li = document.createElement("li");

            li.className = "vazio";
            li.textContent = "Vazio";

            lista.appendChild(li);

        } else {
            const li = montarItem(
                pokemon,
                "Enviar ao Prof. Carvalho",
                () => enviarAoProfessor(pokemon.codigo)
            );

            lista.appendChild(li);
        }
    }

    document.querySelector("#titulo-party").textContent =
        `Minha party (${party.length}/${LIMITE_PARTY})`;
};

const desenharCarvalho = () => {
    const lista = document.querySelector("#carvalho");

    lista.innerHTML = "";

    carvalho.forEach((pokemon) => {
        const li = montarItem(
            pokemon,
            "Pegar de volta",
            () => pegarDeVolta(pokemon.codigo)
        );

        lista.appendChild(li);
    });

    document.querySelector("#titulo-carvalho").textContent =
        `Com o Professor Carvalho (${carvalho.length})`;

    document.querySelector("#carvalho-vazio").hidden =
        carvalho.length > 0;
};

const esperar = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

const capturarPokemon = async () => {
    if (!dadosAtuais) return;

    const novo = {
        codigo: Date.now(),
        id: dadosAtuais.id,
        nome: dadosAtuais.name,
        imagem:
            dadosAtuais.sprites.front_default ||
            dadosAtuais.sprites.other["official-artwork"].front_default
    };

    if (mostrandoShiny && dadosAtuais.sprites.front_shiny) {
        novo.imagem = dadosAtuais.sprites.front_shiny;
    }

    botoes.capturar.disabled = true;

    mostrarMensagem("A pokébola está balançando...", true);

    await esperar(1500);

    botoes.capturar.disabled = false;

    if (Math.random() >= 0.7) {
        mostrarMensagem(
            `${novo.nome} escapou da pokébola! Tente de novo.`,
            true,
            true
        );

        return;
    }

    if (party.length < LIMITE_PARTY) {
        party.push(novo);

        salvarEDesenhar();

        mostrarMensagem(
            `Você capturou ${novo.nome}!`,
            true
        );

    } else {
        pedirSubstituicao(novo);
    }
};

const pedirSubstituicao = (novo) => {
    pokemonPendente = novo;

    textoTroca.textContent =
        `Quem vai para o Professor Carvalho para abrir espaço para o ${novo.nome}?`;

    opcoesTroca.innerHTML = "";

    party.forEach((pokemon) => {
        const li = montarItem(
            pokemon,
            `Enviar ${pokemon.nome}`,
            () => trocarPokemon(pokemon.codigo)
        );

        opcoesTroca.appendChild(li);
    });

    janela.showModal();
};

const trocarPokemon = (codigo) => {
    const novo = pokemonPendente;

    if (!novo) return;

    const pokemon = party.find(
        (p) => p.codigo === codigo
    );

    if (!pokemon) return;

    party = party.filter(
        (p) => p.codigo !== codigo
    );

    carvalho.push(pokemon);
    party.push(novo);
    pokemonPendente = null;
    salvarEDesenhar();
    janela.close();
    mostrarMensagem(
        `Você capturou ${novo.nome}!`,
        true
    );
};

const pegarDeVolta = (codigo) => {
    if (party.length >= LIMITE_PARTY) {
      mostrarMensagem("A party está cheia. Envie alguém ao Professor Carvalho primeiro.",true,true);
      return;
    }
    const pokemon = carvalho.find(
        (p) => p.codigo === codigo
    );
    if (!pokemon) return;
    carvalho = carvalho.filter(
        (p) => p.codigo !== codigo
    );
    party.push(pokemon);
    salvarEDesenhar();
    mostrarMensagem(
        `${pokemon.nome} voltou para a party.`,
        true
    );
};

const enviarAoProfessor = (codigo) => {
    const pokemon = party.find(
        (p) => p.codigo === codigo
    );
    if (!pokemon) return;
    party = party.filter(
        (p) => p.codigo !== codigo
    );
    carvalho.push(pokemon);
    salvarEDesenhar();
    mostrarMensagem(
        `${pokemon.nome} foi enviado ao Professor Carvalho.`,
        true
    );
};

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const valor = inputBusca.value.toLowerCase().trim();
    buscarPokemon(valor);
    inputBusca.value = "";
});

botoes.anterior.addEventListener("click", () => {
    if (idAtual > 1) {
        buscarPokemon(idAtual - 1);
    }
});

botoes.proximo.addEventListener("click", () => {
    buscarPokemon(idAtual + 1);
});

botoes.shiny.addEventListener("click", () => {
    if (!dadosAtuais) return;

    mostrandoShiny = !mostrandoShiny;

    atualizarImagem();
});

botoes.capturar.addEventListener("click", capturarPokemon);

btnCancelar.addEventListener("click", () => {
    janela.close();
});

janela.addEventListener("close", () => {
    if (pokemonPendente) {
        mostrarMensagem(
            `Captura cancelada. ${pokemonPendente.nome} fugiu!`,
            true,
            true
        );

        pokemonPendente = null;
    }
});

function excluirTodosDoProfessor() {
  if (carvalho.length === 0) {
      mostrarMensagem("Não há Pokémon para excluir.", true, true);
      return;
  }
  const confirmar = confirm(
      "Tem certeza que deseja excluir todos os Pokémon do Professor Carvalho?"
  );
  if (!confirmar) return;
  carvalho = [];
  salvarEDesenhar();
  mostrarMensagem("Todos os Pokémon do Professor Carvalho foram excluídos!", true);
}
document.querySelector("#btnExcluirTodos").addEventListener("click", excluirTodosDoProfessor);

desenharParty();
desenharCarvalho();

buscarPokemon(idAtual);

