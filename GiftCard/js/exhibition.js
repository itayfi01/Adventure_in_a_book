document.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => {
        const dialog = document.getElementById(button.getAttribute("data-open"));
        if (!dialog || typeof dialog.showModal !== "function") return;
        if (!dialog.open) dialog.showModal();
        const title = dialog.querySelector("h2");
        if (title) title.focus();
    });
});

document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
    });
});
