
const imagens = document.querySelectorAll("img");
const lightbox = document.getElementById("lightbox");
const imagemGrande = document.getElementById("imagem-grande");
const fechar = document.getElementById("fechar");

imagens.forEach((imagem) => {
    // Ignora a imagem que aparece dentro da própria lightbox
    if (imagem.id === "imagem-grande") return;

    imagem.addEventListener("click", () => {
        imagemGrande.src = imagem.src;
        imagemGrande.alt = imagem.alt;
        lightbox.style.display = "flex";
    });
});

// Fechar pelo X
fechar.addEventListener("click", () => {
    lightbox.style.display = "none";
});

// Fechar clicando no fundo escuro
lightbox.addEventListener("click", (evento) => {
    if (evento.target === lightbox) {
        lightbox.style.display = "none";
    }
});

// Fechar apertando ESC
document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
        lightbox.style.display = "none";
    }
});