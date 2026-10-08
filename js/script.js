(() => {
    "use strict";

    const pad = (n) => String(n).padStart(2, "0");

    // "dupla-exposição" -> "Dupla Exposição"
    const formatarNome = (pasta) =>
        decodeURIComponent(pasta)
            .replace(/[-_]/g, " ")
            .replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());

    const pastaDaImagem = (img) => {
        const partes = img.getAttribute("src").split("/");
        return partes[partes.length - 2] || "Fotos";
    };

    /* ------------------------------------------------------
       1. Monta os blocos (número + título + contador)
       ------------------------------------------------------ */
    const artigos = document.querySelectorAll("main > section:not(:first-child) > article");
    const grupos = []; // [{ nome, imgs, bloco }]

    artigos.forEach((artigo, i) => {
        const imgs = [...artigo.querySelectorAll("img")];
        if (!imgs.length) return;

        const nome = formatarNome(pastaDaImagem(imgs[0]));

        const bloco = document.createElement("div");
        bloco.className = "bloco";
        bloco.id = `bloco-${i + 1}`;

        const topo = document.createElement("header");
        topo.className = "bloco-topo";
        topo.innerHTML = `
            <span class="bloco-num">${pad(i + 1)}</span>
            <h2 class="bloco-titulo">${nome}</h2>
            <span class="bloco-qtd">${pad(imgs.length)} ${imgs.length === 1 ? "foto" : "fotos"}</span>
        `;

        artigo.before(bloco);
        bloco.append(topo, artigo);
        artigo.style.setProperty("--cols", Math.min(imgs.length, 3));

        imgs.forEach((img, j) => {
            if (!img.alt) img.alt = `${nome} — foto ${j + 1}`;
            img.loading = "lazy";
            img.tabIndex = 0;
            img.classList.add("revelar");
            img.style.transitionDelay = `${(j % 3) * 90}ms`;
            img.addEventListener("error", () => img.classList.add("quebrada"));
        });

        grupos.push({ nome, imgs, bloco });
    });

    /* ------------------------------------------------------
       2. Rodapé
       ------------------------------------------------------ */
    const rodape = document.createElement("footer");
    rodape.className = "rodape";
    rodape.innerHTML = `
        <strong>Atelie de Arte</strong>
        <span>© ${new Date().getFullYear()} · Arthur Ferreira Almeida</span>
    `;
    document.body.append(rodape);

    /* ------------------------------------------------------
       3. Barra de progresso
       ------------------------------------------------------ */
    const barra = document.createElement("div");
    barra.className = "progresso";
    document.body.prepend(barra);

    let esperando = false;
    const atualizarBarra = () => {
        const total = document.documentElement.scrollHeight - innerHeight;
        const p = total > 0 ? scrollY / total : 0;
        barra.style.transform = `scaleX(${Math.min(Math.max(p, 0), 1)})`;
        esperando = false;
    };

    addEventListener(
        "scroll",
        () => {
            if (!esperando) {
                esperando = true;
                requestAnimationFrame(atualizarBarra);
            }
        },
        { passive: true }
    );
    atualizarBarra();

    /* ------------------------------------------------------
       4. Aparecer ao rolar
       ------------------------------------------------------ */
    const obsReveal = new IntersectionObserver(
        (entradas) => {
            entradas.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add("visivel");
                    obsReveal.unobserve(e.target);
                }
            });
        },
        { threshold: 0.12 }
    );
    document.querySelectorAll(".revelar").forEach((el) => obsReveal.observe(el));

    /* ------------------------------------------------------
       5. Índice lateral
       ------------------------------------------------------ */
    if (grupos.length > 1) {
        const indice = document.createElement("nav");
        indice.className = "indice";
        indice.setAttribute("aria-label", "Categorias");

        const links = grupos.map((g, i) => {
            const a = document.createElement("a");
            a.href = `#${g.bloco.id}`;
            a.textContent = pad(i + 1);
            a.title = g.nome;
            indice.append(a);
            return a;
        });
        document.body.append(indice);

        // só aparece depois do hero
        const hero = document.getElementById("titulo");
        const obsHero = new IntersectionObserver(([e]) => {
            indice.style.opacity = e.isIntersecting ? "0" : "1";
            indice.style.pointerEvents = e.isIntersecting ? "none" : "auto";
        });
        indice.style.transition = "opacity 0.3s";
        if (hero) obsHero.observe(hero);

        const obsAtivo = new IntersectionObserver(
            (entradas) => {
                entradas.forEach((e) => {
                    if (e.isIntersecting) {
                        const i = grupos.findIndex((g) => g.bloco === e.target);
                        links.forEach((l, k) => l.classList.toggle("ativo", k === i));
                    }
                });
            },
            { rootMargin: "-45% 0px -45% 0px" }
        );
        grupos.forEach((g) => obsAtivo.observe(g.bloco));
    }

    /* ------------------------------------------------------
       6. Lightbox
       ------------------------------------------------------ */
    const lb = document.createElement("div");
    lb.className = "lb";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Visualizador de fotos");
    lb.innerHTML = `
        <button class="lb-fechar" aria-label="Fechar">✕</button>
        <button class="lb-ant" aria-label="Foto anterior">←</button>
        <button class="lb-prox" aria-label="Próxima foto">→</button>
        <figure class="lb-figura">
            <img class="lb-img" alt="">
            <figcaption class="lb-legenda"></figcaption>
        </figure>
    `;
    document.body.append(lb);

    const lbImg = lb.querySelector(".lb-img");
    const lbLegenda = lb.querySelector(".lb-legenda");
    const btnFechar = lb.querySelector(".lb-fechar");
    const btnAnt = lb.querySelector(".lb-ant");
    const btnProx = lb.querySelector(".lb-prox");

    let grupoAtual = null;
    let indiceAtual = 0;
    let ultimoFoco = null;

    const mostrar = () => {
        const img = grupoAtual.imgs[indiceAtual];
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt;
        lbLegenda.innerHTML =
            `<b>${pad(indiceAtual + 1)}</b> / ${pad(grupoAtual.imgs.length)} — ${grupoAtual.nome}`;

        const unica = grupoAtual.imgs.length === 1;
        btnAnt.hidden = unica;
        btnProx.hidden = unica;
    };

    const abrir = (grupo, i) => {
        grupoAtual = grupo;
        indiceAtual = i;
        ultimoFoco = document.activeElement;
        mostrar();
        lb.classList.add("aberto");
        document.body.classList.add("travado");
        btnFechar.focus();
    };

    const fechar = () => {
        lb.classList.remove("aberto");
        document.body.classList.remove("travado");
        if (ultimoFoco) ultimoFoco.focus({ preventScroll: true });
    };

    const navegar = (passo) => {
        const n = grupoAtual.imgs.length;
        indiceAtual = (indiceAtual + passo + n) % n;
        mostrar();
    };

    grupos.forEach((grupo) => {
        grupo.imgs.forEach((img, i) => {
            img.addEventListener("click", () => abrir(grupo, i));
            img.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    abrir(grupo, i);
                }
            });
        });
    });

    btnFechar.addEventListener("click", fechar);
    btnAnt.addEventListener("click", () => navegar(-1));
    btnProx.addEventListener("click", () => navegar(1));

    // clicar no fundo fecha
    lb.addEventListener("click", (e) => {
        if (e.target === lb || e.target.classList.contains("lb-figura")) fechar();
    });

    // teclado
    addEventListener("keydown", (e) => {
        if (!lb.classList.contains("aberto")) return;
        if (e.key === "Escape") fechar();
        if (e.key === "ArrowLeft") navegar(-1);
        if (e.key === "ArrowRight") navegar(1);
    });

    // deslizar no celular
    let inicioX = 0;
    lb.addEventListener("touchstart", (e) => (inicioX = e.changedTouches[0].clientX), { passive: true });
    lb.addEventListener(
        "touchend",
        (e) => {
            const dx = e.changedTouches[0].clientX - inicioX;
            if (Math.abs(dx) > 50 && grupoAtual.imgs.length > 1) navegar(dx > 0 ? -1 : 1);
        },
        { passive: true }
    );
})();