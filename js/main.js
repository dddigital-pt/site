/* =========================================================
   DD DIGITAL — main.js
   Script único, partilhado pela versão PT e pela versão EN.
   Sem bibliotecas: só JavaScript puro.

   O que faz:
   1. Abre/fecha o menu em telemóvel
   2. Fecha o menu ao escolher uma ligação ou ao clicar fora
   3. Mostra o ano atual no rodapé
   4. Anima os blocos ao aparecerem no ecrã (respeita "reduzir movimento")
   5. Valida e envia o formulário de contacto (Web3Forms) por JavaScript,
      para o visitante não saltar para outra página
   6. Separadores (abas) da secção de Serviços
   ========================================================= */
(function () {
  'use strict';

  /* ---- 1. Menu em telemóvel ---- */
  var botaoMenu = document.querySelector('.menu-botao');
  var nav = document.querySelector('.nav');

  if (botaoMenu && nav) {
    botaoMenu.addEventListener('click', function () {
      var aberto = nav.classList.toggle('esta-aberto');
      botaoMenu.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });

    /* 2. Fecha o menu ao escolher uma ligação */
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('esta-aberto');
        botaoMenu.setAttribute('aria-expanded', 'false');
      });
    });

    /* Fecha o menu ao clicar fora dele */
    document.addEventListener('click', function (evento) {
      var dentro = nav.contains(evento.target) || botaoMenu.contains(evento.target);
      if (!dentro && nav.classList.contains('esta-aberto')) {
        nav.classList.remove('esta-aberto');
        botaoMenu.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- 3. Ano atual no rodapé ---- */
  var anoEl = document.getElementById('ano');
  if (anoEl) { anoEl.textContent = new Date().getFullYear(); }

  /* ---- 4. Animação ao entrar no ecrã ---- */
  var preferenceReduzida = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var blocos = document.querySelectorAll('.surge');

  if (preferenceReduzida || !('IntersectionObserver' in window)) {
    // Sem animação: mostra tudo já visível
    blocos.forEach(function (bloco) { bloco.classList.add('e-visivel'); });
  } else {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('e-visivel');
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    blocos.forEach(function (bloco) { observador.observe(bloco); });
  }

  /* ---- 4b. Brilho em cadeia nos 4 passos do "Como trabalhamos" ---- */
  var caminho = document.querySelector('.caminho');
  if (caminho && !preferenceReduzida && 'IntersectionObserver' in window) {
    var observadorCaminho = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          caminho.classList.add('caminho--relevo');
          observadorCaminho.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.4 });

    observadorCaminho.observe(caminho);
  }

  /* ---- 6. Separadores (abas) da secção de Serviços ---- */
  var abas = document.querySelectorAll('.aba-botao');
  var dashboard = document.querySelector('.servicos-dashboard');

  if (abas.length && dashboard) {
    function mudaAba(abaNova) {
      abas.forEach(function (aba) {
        var painel = document.getElementById(aba.getAttribute('aria-controls'));
        var estaAtiva = aba === abaNova;
        aba.classList.toggle('is-ativo', estaAtiva);
        aba.setAttribute('aria-selected', estaAtiva ? 'true' : 'false');
        aba.setAttribute('tabindex', estaAtiva ? '0' : '-1');
        if (painel) {
          painel.classList.toggle('is-ativo', estaAtiva);
          painel.hidden = !estaAtiva;
        }
      });
    }

    abas.forEach(function (aba, indice) {
      aba.addEventListener('click', function () { mudaAba(aba); });

      // Setas do teclado para navegar entre as abas (padrão de acessibilidade)
      aba.addEventListener('keydown', function (evento) {
        var proximoIndice = null;
        if (evento.key === 'ArrowRight') { proximoIndice = (indice + 1) % abas.length; }
        if (evento.key === 'ArrowLeft') { proximoIndice = (indice - 1 + abas.length) % abas.length; }
        if (proximoIndice !== null) {
          evento.preventDefault();
          abas[proximoIndice].focus();
          mudaAba(abas[proximoIndice]);
        }
      });
    });
  }

  /* ---- 5. Formulário de contacto (Web3Forms) ---- */
  var formulario = document.querySelector('.formulario');
  if (!formulario) { return; }

  var aviso = formulario.querySelector('.formulario__aviso');
  var botaoEnviar = formulario.querySelector('button[type="submit"]');
  var textoIdioma = formulario.getAttribute('data-idioma') === 'en';

  var mensagens = textoIdioma
    ? {
        aEnviar: 'Sending…',
        sucesso: 'Thank you! Your message was sent — we will reply within one business day.',
        erro: 'Something went wrong. Please try again or contact us directly by email or Instagram.',
        chaveFalta: 'The contact form is not set up yet. Please use the direct contact options below.'
      }
    : {
        aEnviar: 'A enviar…',
        sucesso: 'Mensagem enviada! Vamos responder no próximo dia útil.',
        erro: 'Não foi possível enviar. Tente novamente ou contacte-nos diretamente por email ou Instagram.',
        chaveFalta: 'O formulário ainda não está configurado. Use os contactos diretos abaixo, por favor.'
      };

  function mostraAviso(texto, tipo) {
    aviso.textContent = texto;
    aviso.classList.remove('e-sucesso', 'e-erro');
    aviso.classList.add('esta-visivel', tipo === 'sucesso' ? 'e-sucesso' : 'e-erro');
  }

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();

    // Campo-armadilha: se vier preenchido, é um robô — ignora silenciosamente
    var honeypot = formulario.querySelector('input[name="bot_check"]');
    if (honeypot && honeypot.value) { return; }

    var chave = formulario.querySelector('input[name="access_key"]');
    if (!chave || !chave.value || chave.value.indexOf('SUBSTITUIR') !== -1) {
      mostraAviso(mensagens.chaveFalta, 'erro');
      return;
    }

    if (!formulario.checkValidity()) {
      formulario.reportValidity();
      return;
    }

    var dados = new FormData(formulario);
    botaoEnviar.disabled = true;
    var textoOriginal = botaoEnviar.textContent;
    botaoEnviar.textContent = mensagens.aEnviar;

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: dados
    })
      .then(function (resposta) { return resposta.json(); })
      .then(function (resultado) {
        if (resultado.success) {
          mostraAviso(mensagens.sucesso, 'sucesso');
          formulario.reset();
        } else {
          mostraAviso(mensagens.erro, 'erro');
        }
      })
      .catch(function () {
        mostraAviso(mensagens.erro, 'erro');
      })
      .finally(function () {
        botaoEnviar.disabled = false;
        botaoEnviar.textContent = textoOriginal;
      });
  });
})();
