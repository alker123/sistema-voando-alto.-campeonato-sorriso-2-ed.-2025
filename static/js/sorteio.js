import { db2 } from './firebase1.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Variável para armazenar o ID (número) do atleta que deve ser excluído do Jogo 2.
// null significa que a condição de exclusão ainda não foi cumprida.
let atletaCondicionalmenteExcluido = null;

// Primeiro conjunto de elementos para a primeira fase
const seletorCategoria1 = document.getElementById("seletor-categoria9");
const seletorFase1 = document.getElementById("seletor-fase5");
const tabelaBody1 = document.querySelector("#tabela-sorteio tbody");
const botaoSortear1 = document.getElementById("btn-sortear");

// Segundo conjunto de elementos para a segunda fase
const seletorCategoria2 = document.getElementById("seletor-categoria8");
const seletorFase2 = document.getElementById("seletor-fase6");
const tabelaBody2 = document.querySelector("#tabela-sorteio1 tbody");
const botaoSortear2 = document.getElementById("btn-sortear1");

let atletasPorCategoria = {}; // Guarda atletas da fase selecionada

botaoSortear1.addEventListener("click", sortearAtletas1);
botaoSortear2.addEventListener("click", sortearAtletas2);

// Lista fixa de fases
const fases = ['classificatória', 'oitavas', 'quartas', 'semi-final', 'final'];

// Preencher seletor de fases
fases.forEach(fase => {
    const opt1 = criarOpcaoDeFase(fase);
    const opt2 = criarOpcaoDeFase(fase);

    seletorFase1.appendChild(opt1);
    seletorFase2.appendChild(opt2);
});

// Quando mudar a fase, carregar categorias do db
seletorFase1.addEventListener("change", () => carregarCategorias(seletorFase1, seletorCategoria1));
seletorFase2.addEventListener("change", () => carregarCategorias(seletorFase2, seletorCategoria2));

async function carregarCategorias(seletorFase, seletorCategoria) {
    const faseSelecionada = seletorFase.value;

    seletorCategoria.innerHTML = '<option value="">Selecione a categoria</option>';

    if (!faseSelecionada) return;

    try {
        const snap = await get(ref(db2, faseSelecionada));
        if (!snap.exists()) return;

        const data = snap.val();
        atletasPorCategoria = data;

        Object.keys(data).forEach(cat => {
            const opt = criarOpcaoDeCategoria(cat);
            seletorCategoria.appendChild(opt);
        });
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
    }
}

function criarOpcaoDeFase(fase) {
    const opt = document.createElement("option");
    opt.value = fase;
    opt.textContent = fase.charAt(0).toUpperCase() + fase.slice(1);
    return opt;
}

function criarOpcaoDeCategoria(categoria) {
    const opt = document.createElement("option");
    opt.value = categoria;
    opt.textContent = categoria;
    return opt;
}

function embaralharAtletas(atletas) {
    return atletas.sort(() => Math.random() - 0.5);
}

function separarAtletasPorParidade(atletas, tipo) {
    return atletas.filter(atleta => tipo === 'impar' ? atleta.numero % 2 !== 0 : atleta.numero % 2 === 0);
}

// Função para gerar pares de atletas (MANTENDO LÓGICA ÍMPAR/PAR DO JOGO 1)
function gerarPares(atletasImpares, atletasPares) {
    let pares = [];
    const numImpares = atletasImpares.length;
    const numPares = atletasPares.length;

    const minLength = Math.min(numImpares, numPares);

    for (let i = 0; i < minLength; i++) {
        const atletaImpar = atletasImpares[i];
        const atletaPar = atletasPares[i];
        pares.push([atletaImpar, atletaPar]);
    }

    // Lógica para emparelhar se sobrou um ímpar ou um par (usando o primeiro atleta do oposto)
    if (numImpares > numPares) {
        const ultimoImpar = atletasImpares[minLength];
        const primeiroPar = atletasPares[0];
        pares.push([ultimoImpar, primeiroPar]);
    } else if (numPares > numImpares) {
        const ultimoPar = atletasPares[minLength];
        const primeiroImpar = atletasImpares[0];
        pares.push([ultimoPar, primeiroImpar]);
    }

    return pares;
}

// Função para gerar pares de atletas (SORTEIO ALEATÓRIO DO JOGO 2)
function gerarParesAleatorios(atletas) {
    let pares = [];
    // Garantir que a lista esteja embaralhada
    atletas = embaralharAtletas(atletas); 

    // Agrupar em pares
    for (let i = 0; i < atletas.length; i += 2) {
        if (i + 1 < atletas.length) {
            pares.push([atletas[i], atletas[i + 1]]);
        } else {
            // Lógica de "sobra" se houver um número ímpar de atletas
            // Para simplificar, o último atleta que sobrar é emparelhado com o primeiro atleta do grupo
            if (atletas.length >= 2) {
                pares.push([atletas[i], atletas[0]]);
                alert("AVISO: Número ímpar de atletas. O último atleta foi emparelhado com o primeiro.");
            }
        }
    }
    return pares;
}

function exibirParesNaTabela(pares, tabelaBody) {
    pares.forEach(par => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${par[0].numero} - ${par[0].nome}</td>
            <td><img src="${par[0].foto}" alt="${par[0].nome}" style="width: 50px; height: 50px; border-radius: 50%;"></td>
            <td>X</td>
            <td>${par[1].numero} - ${par[1].nome}</td>
            <td><img src="${par[1].foto}" alt="${par[1].nome}" style="width: 50px; height: 50px; border-radius: 50%;"></td>
        `;

        tabelaBody.appendChild(tr);
    });
}

// Função principal para sortear os atletas (Jogo 1)
function sortearAtletas1() {
    tabelaBody1.innerHTML = "";
    // 1. Resetar a variável de exclusão no início do Jogo 1
    atletaCondicionalmenteExcluido = null;

    const fase = seletorFase1.value;
    const categoria = seletorCategoria1.value;

    if (!fase || !categoria) {
        alert("Selecione uma fase e categoria para o Jogo 1!");
        return;
    }

    const atletasObj = atletasPorCategoria[categoria];
    if (!atletasObj) {
        alert("Nenhum atleta encontrado!");
        return;
    }

    let atletas = Object.values(atletasObj);
    atletas = embaralharAtletas(atletas);
    
    // Aplicar a regra de ÍMPAR/PAR (JOGO 1)
    const atletasImpares = separarAtletasPorParidade(atletas, 'impar');
    const atletasPares = separarAtletasPorParidade(atletas, 'par');

    const pares = gerarPares(atletasImpares, atletasPares); 
    
    // 2. Lógica de Condição de Exclusão (JOGO 1)
    if (pares.length > 0) {
        const primeiroPar = pares[0];
        const ultimoPar = pares[pares.length - 1];

        // Se o mesmo atleta estiver no primeiro par E no último par
        const atletaNoPrimeiroPar = primeiroPar.find(atleta => 
            ultimoPar.some(atletaUltimo => atletaUltimo.numero === atleta.numero)
        );

        if (atletaNoPrimeiroPar) {
            atletaCondicionalmenteExcluido = atletaNoPrimeiroPar.numero;
            console.log(`Condição de Exclusão Cumprida: Atleta ${atletaNoPrimeiroPar.numero} (primeiro e último jogo).`);
        }
    }

    exibirParesNaTabela(pares, tabelaBody1);
}


// Função para sortear atletas da segunda fase (Jogo 2)
function sortearAtletas2() {
    tabelaBody2.innerHTML = "";

    const fase = seletorFase2.value;
    const categoria = seletorCategoria2.value;

    if (!fase || !categoria) {
        alert("Selecione uma fase e categoria para o Jogo 2!");
        return;
    }

    const atletasObj = atletasPorCategoria[categoria];
    if (!atletasObj) {
        alert("Nenhum atleta encontrado!");
        return;
    }

    let atletas = Object.values(atletasObj); // Lista completa de atletas
    const atletasAntes = atletas.length;
    
    // 1. Aplica a Regra de Exclusão
    if (atletaCondicionalmenteExcluido !== null) {
        const idExcluido = atletaCondicionalmenteExcluido;
        atletas = atletas.filter(atleta => atleta.numero !== idExcluido);
        
        if (atletas.length < atletasAntes) {
             alert(`ATENÇÃO: Atleta n° ${idExcluido} foi excluído do sorteio do Jogo 2 (jogou no primeiro e último jogo do Jogo 1).`);
        }
    } else {
         alert(`AVISO: Todos os atletas estão participando do Jogo 2.`);
    }

    // 2. VERIFICAÇÃO FINAL
    if (atletas.length < 2) {
        alert("Número insuficiente de atletas para sortear o Jogo 2 (restaram apenas: " + atletas.length + ").");
        return;
    }
    
    // 3. Aplica Sorteio ALEATÓRIO (JOGO 2)
    const pares = gerarParesAleatorios(atletas); 

    // Exibir os pares sorteados na tabela
    exibirParesNaTabela(pares, tabelaBody2);
}


// sorteio pdf 

window.baixarPDF3 = function () {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
        console.error('jsPDF não carregado');
        alert('Falha ao carregar jsPDF. Verifique os scripts.');
        return;
    }

    const tabela1 = document.getElementById('tabela-sorteio');
    const tabela2 = document.getElementById('tabela-sorteio1');

    // Alerta se nenhuma tabela tem dados (melhor que apenas a Tabela 1)
    if (tabela1.querySelectorAll('tbody tr').length === 0 && tabela2.querySelectorAll('tbody tr').length === 0) {
        alert('Não há linhas nas tabelas para exportar.');
        return;
    }

    // Pegando fase e categoria (Assume que seletorFase1, seletorCategoria1 etc., são variáveis globais)
    const faseSelecionada1 = seletorFase1.value || 'Não informada';
    const categoriaSelecionada1 = seletorCategoria1.value || 'Não informada';

    const faseSelecionada2 = seletorFase2.value || 'Não informada';
    const categoriaSelecionada2 = seletorCategoria2.value || 'Não informada';

    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

    // Cabeçalho com data/hora
    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR');
    const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // --- SEÇÃO JOGO 1 ---
    doc.setFontSize(16);
    doc.text('Resultado do Sorteio - Jogo 1', 40, 40);

    doc.setFontSize(12);
    doc.text(`Fase: ${faseSelecionada1}`, 40, 80);
    doc.text(`Categoria: ${categoriaSelecionada1}`, 40, 100);

    doc.setFontSize(10);
    doc.text(`Gerado em ${data} às ${hora}`, 40, 60);

    // Tabela 1
    doc.autoTable({
        html: '#tabela-sorteio',
        startY: 120, 
        theme: 'grid',
        styles: { fontSize: 12 }, // Removemos halign: 'center' da última vez
        headStyles: { fillColor: [0, 123, 255], textColor: 255 },
    });

    // Ajustar o Y para a segunda tabela na mesma página
    let finalY = doc.lastAutoTable.finalY; 
    const espacoEntreTabelas = 30; 

    // --- SEÇÃO JOGO 2 ---
    doc.setFontSize(16);
    doc.text('Resultado do Sorteio - Jogo 2', 40, finalY + espacoEntreTabelas); 

    doc.setFontSize(12);
    doc.text(`Fase: ${faseSelecionada2}`, 40, finalY + espacoEntreTabelas + 20);
    doc.text(`Categoria: ${categoriaSelecionada2}`, 40, finalY + espacoEntreTabelas + 40);
    
    // Tabela 2
    doc.autoTable({
        html: '#tabela-sorteio1',
        startY: finalY + espacoEntreTabelas + 60, 
        theme: 'grid',
        styles: { fontSize: 12 }, // Removemos halign: 'center' da última vez
        headStyles: { fillColor: [0, 123, 255], textColor: 255 },
    });

    finalY = doc.lastAutoTable.finalY; // Atualiza o Y final após a Tabela 2

    // --- ASSINATURA DO ÁRBITRO ---
    const espacoAssinatura = 50;

    doc.setFontSize(12);
    // Linha divisória
    doc.line(40, finalY + espacoAssinatura, 200, finalY + espacoAssinatura);
    doc.line(300, finalY + espacoAssinatura, 460, finalY + espacoAssinatura); 
    
    // Texto das assinaturas
    doc.text('Assinatura do Árbitro', 50, finalY + espacoAssinatura + 15);
    doc.text('Data/Hora', 350, finalY + espacoAssinatura + 15);


    // Rodapé (Sistema de Sorteio Automático)
    const h = doc.internal.pageSize.getHeight(); 
    doc.setFontSize(9);
    doc.text('Sistema de Sorteio Automático', 40, h - 20); 

    // Salvar PDF
    doc.save(`resultado_sorteio_${faseSelecionada1}_${categoriaSelecionada1}_${faseSelecionada2}_${categoriaSelecionada2}_${data.replace(/\//g, '-')}.pdf`);
};