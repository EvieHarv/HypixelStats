if (store.get('enableDarkMode')) {
    // terribly janky lmfao.
    $(".navbar")[0].classList.remove("bg-white");
    $("#content")[0].style.background = "#212121";
    $(".navbar")[0].style.background = "#0f0f0f";

    stylesheet = document.styleSheets[document.styleSheets.length - 1];
    stylesheet.insertRule(".card { background-color: #333333!important ;}", stylesheet.rules.length);
    stylesheet.insertRule(".card.card { background-color: rgba(0, 0, 0, 0.5)!important ;}", stylesheet.rules.length);
    stylesheet.insertRule(".card { border: none!important ;}", stylesheet.rules.length);
    stylesheet.insertRule(".text-gray-800 { color: #ffffff!important ;}", stylesheet.rules.length);
    stylesheet.insertRule(".sidebar { background-image: linear-gradient(180deg,hsl(225deg 69% 20%) 10%,hsl(0deg 0% 0%) 100%)!important; }", stylesheet.rules.lenth);
    stylesheet.insertRule(".sidebar-brand-icon { background-color: #0f0f0f!important; }", stylesheet.rules.lenth);
    stylesheet.insertRule(".sidebar-brand-text { color: #e3e4e8!important; }", stylesheet.rules.lenth);
};