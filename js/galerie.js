/* Galerie : visionneuse plein écran (boutons, clavier, balayage tactile). */
document.addEventListener("DOMContentLoaded", () => {
    const items = [...document.querySelectorAll(".gallery-item")];
    if (!items.length) return;

    document.body.insertAdjacentHTML("beforeend", `
        <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Visionneuse d’images" hidden>
            <button type="button" class="lb-btn lb-close" aria-label="Fermer la visionneuse">✕</button>
            <button type="button" class="lb-btn lb-prev" aria-label="Image précédente">‹</button>
            <figure class="lb-figure"><img class="lb-img" alt=""><figcaption class="lb-cap"></figcaption></figure>
            <button type="button" class="lb-btn lb-next" aria-label="Image suivante">›</button>
        </div>`);
    const box = document.getElementById("lightbox");
    const img = box.querySelector(".lb-img");
    const cap = box.querySelector(".lb-cap");
    let index = 0, opener = null, touchX = null;

    function show(i) {
        index = (i + items.length) % items.length;
        const alt = items[index].querySelector("img").alt;
        img.src = items[index].href;
        img.alt = alt;
        cap.textContent = alt + " — " + (index + 1) + " / " + items.length;
    }
    function openBox(i, trigger) {
        opener = trigger;
        show(i);
        box.hidden = false;
        document.body.classList.add("no-scroll");
        box.querySelector(".lb-close").focus();
    }
    function closeBox() {
        if (box.hidden) return;
        box.hidden = true;
        document.body.classList.remove("no-scroll");
        if (opener) opener.focus();
    }

    items.forEach((link, i) => link.addEventListener("click", e => { e.preventDefault(); openBox(i, link); }));
    box.querySelector(".lb-close").addEventListener("click", closeBox);
    box.querySelector(".lb-prev").addEventListener("click", () => show(index - 1));
    box.querySelector(".lb-next").addEventListener("click", () => show(index + 1));
    box.addEventListener("click", e => { if (e.target === box) closeBox(); });   // clic sur le fond
    img.addEventListener("error", () => { cap.textContent = "Photo indisponible"; });

    document.addEventListener("keydown", e => {
        if (box.hidden) return;
        if (e.key === "Escape") closeBox();
        else if (e.key === "ArrowLeft") show(index - 1);
        else if (e.key === "ArrowRight") show(index + 1);
        else if (e.key === "Tab") {   // garde le focus dans la visionneuse
            const f = [...box.querySelectorAll("button")];
            if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
            else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        }
    });

    box.addEventListener("touchstart", e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", e => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    });
});
