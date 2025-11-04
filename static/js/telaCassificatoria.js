import { db3, db4 } from './firebase.js'; 
import { ref, get, set, push } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// --- FUNÇÃO PARA INJETAR ESTILOS NO HEAD (MANTIDA) ---
function injetarEstilos() {
    const css = `
        /* Estilo para as células classificados */
        .classificado-cell {
            background-color: lightgreen !important; /* Cor verde clara */
            color: black !important; /* Texto escuro */
            font-weight: bold !important;
        }
        /* Estilo para garantir visibilidade */
        .empty-message {
            text-align: center;
            font-style: italic;
            color: #6c757d;
        }
        /* Estilo base para a classe foto-atleta */
        .foto-atleta {
            /* O CSS externo controla o tamanho da foto na tabela */
            width: 50px; 
            height: 50px;
            border-radius: 50%;
            object-fit: cover;
        }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    injetarEstilos();

    const tabelaContainer = document.getElementById('tabela-secundaria2');
    const seletorCategoria = document.getElementById('seletor-categoria2');
    const seletorFaseGrupo = document.getElementById('seletor-fase-grupo2');
    const statusMessage = document.getElementById('statusMessage2');

    // 🛑 REFERÊNCIAS CORRIGIDAS PARA OS CORPOS DAS DUAS TABELAS 🛑
    const tabela3Body = document.querySelector('#tabela-secundaria3 tbody');
    const tabela4Body = document.querySelector('#tabela-secundaria4 tbody');

    window.volta4 = function() {
        if (tabelaContainer) {
            tabelaContainer.style.display = 'none';
        }
    }
    
    // Funções de busca no Firebase
    async function getUniqueCategories(fase) {
        if (!fase || fase === 'Selecionar') return [];
        try {
            const faseRef = ref(db3, `Fase/${fase}`);
            const snapshot = await get(faseRef);
            if (snapshot.exists()) {
                return Object.keys(snapshot.val()).sort(); 
            }
            return [];
        } catch (error) {
            console.error("Erro ao buscar categorias:", error);
            return [];
        }
    }

    async function getAtletas(fase, categoria) {
        if (!fase || !categoria) return [];
        try {
            const atletasRef = ref(db3, `Fase/${fase}/${categoria}/atletas`);
            const snapshot = await get(atletasRef);
            if (snapshot.exists()) {
                const atletasArray = Object.values(snapshot.val());
                return atletasArray;
            }
            return [];
        } catch (error) {
            console.error(`Erro ao buscar atletas para Fase:${fase}, Categoria:${categoria}`, error);
            return [];
        }
    }


    // 3. FUNÇÃO PARA RENDERIZAR E DIVIDIR OS DADOS NAS DUAS TABELAS
    function renderTabela(atletas) { 
        // 1. Limpa o conteúdo das duas tabelas
        tabela3Body.innerHTML = ''; 
        tabela4Body.innerHTML = ''; 

        if (atletas.length === 0) {
            const tr = document.createElement('tr');
            // colspan precisa ser 10, que é o número de colunas da sua tabela (9 colunas de th + foto)
            tr.innerHTML = `<td colspan="10" class="empty-message">Nenhum dado encontrado</td>`; 
            tabela3Body.appendChild(tr);
            statusMessage.style.display = 'none';
            return;
        }

        // Ordenação
        atletas.sort((a, b) => (a.posicao ?? Infinity) - (b.posicao ?? Infinity));

        // 2. LÓGICA DE DIVISÃO
        const pontoDeCorte = Math.ceil(atletas.length / 2);
        const atletasTabela1 = atletas.slice(0, pontoDeCorte);
        const atletasTabela2 = atletas.slice(pontoDeCorte);
        
        // Função auxiliar para criar e anexar as linhas
        function criarEAnexarLinhas(listaAtletas, tbodyAlvo) {
            listaAtletas.forEach(atleta => {
                const tr = document.createElement('tr');
                
                // Lógica de classificação
                const statusClassificado = String(atleta.classificado || "").toLowerCase();
                const isClassificado = statusClassificado === 'sim' || statusClassificado === 'classificado';
                const textoProximaFase = isClassificado ? "Classificado" : "";

                // Lendo os jogos
                const jogo1 = String(atleta.jogos?.["1º Jogo"] ?? '');
                const jogo2 = String(atleta.jogos?.["2º Jogo"] ?? '');
                const jogo3 = String(atleta.jogos?.["3º Jogo"] ?? '');
                
                // HTML da Foto
                const fotoHtml = atleta.foto 
                    ? `<img src="${atleta.foto}" class="foto-atleta">` 
                    : 'N/A';

                // Geração do HTML da Linha
                tr.innerHTML = `
                    <td>${fotoHtml}</td>
                    <td>${atleta.posicao ?? ''}</td> 
                    <td>${atleta.nome ?? ''}</td>
                    <td>${atleta.categoria ?? ''}</td>
                    <td>${jogo1}</td>
                    <td>${jogo2}</td>
                    <td>${jogo3}</td>
                    <td>${atleta.notaFinal ?? ''}</td> 
                    <td>${textoProximaFase}</td> 
                `;

                // Aplica estilo em cada TD individualmente se classificado
                if (isClassificado) {
                    [...tr.children].forEach(td => {
                        td.classList.add('classificado-cell');
                    });
                }
                
                tbodyAlvo.appendChild(tr);
            });
        }
    
        // 3. ANEXAR DADOS NAS TABELAS CORRETAS
        criarEAnexarLinhas(atletasTabela1, tabela3Body);
        criarEAnexarLinhas(atletasTabela2, tabela4Body);
    
        if (statusMessage) {
             statusMessage.style.display = 'none';
        }
    }


    // 4. FUNÇÃO PARA PREENCHER CATEGORIAS
    async function popularCategorias(fase, categoriaAntiga = '') {
        if(seletorCategoria) {
            seletorCategoria.innerHTML = '<option value="">Todas</option>';
        }
        
        if (fase && fase !== 'Selecionar') {
            const categorias = await getUniqueCategories(fase);
            
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria;
                option.textContent = categoria.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' '); 
                
                if(seletorCategoria) {
                    seletorCategoria.appendChild(option);
                }
            });
            
            if (categoriaAntiga && categorias.includes(categoriaAntiga) && seletorCategoria) {
                seletorCategoria.value = categoriaAntiga;
            }
        }
    }
    
    // 5. Função principal de filtro e carregamento
    async function carregarDados() {
        const faseSelecionada = seletorFaseGrupo ? seletorFaseGrupo.value : null;
        const categoriaAntiga = seletorCategoria ? seletorCategoria.value : ''; 
        
        if (!faseSelecionada || faseSelecionada === 'Selecionar') {
            if (tabela3Body) {
                tabela3Body.innerHTML = '<tr><td colspan="10" class="empty-message">Selecione uma Fase</td></tr>';
            }
            if (tabela4Body) {
                tabela4Body.innerHTML = ''; // Limpa a tabela 4
            }
            await popularCategorias('', categoriaAntiga); 
            return;
        }

        await popularCategorias(faseSelecionada, categoriaAntiga);
        
        const categoriaSelecionada = seletorCategoria ? seletorCategoria.value : '';

        let atletasFase = [];

        if (categoriaSelecionada === "" || categoriaSelecionada === "Todas") {
            const categoriasDaFase = await getUniqueCategories(faseSelecionada);
            const promises = categoriasDaFase.map(categoria => getAtletas(faseSelecionada, categoria));
            const resultados = await Promise.all(promises);
            atletasFase = resultados.flat(); 
        } else {
            atletasFase = await getAtletas(faseSelecionada, categoriaSelecionada);
        }

        renderTabela(atletasFase);
    }


    // 6. Listeners
    if (seletorFaseGrupo) {
        seletorFaseGrupo.addEventListener('change', carregarDados);
    }
    if (seletorCategoria) {
        seletorCategoria.addEventListener('change', carregarDados);
    }

    // Inicialização
    carregarDados();
});

