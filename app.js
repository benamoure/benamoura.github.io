// 1. Création et injection du Header
const headerHTML = `
<header class="app-header">
        <button id="backBtn" class="back-btn" title="Retour" aria-label="Retour">
            <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h1 id="headerTitle" class="app-title" title="Triple-cliquez pour connexion admin">Benamoura</h1>

        <a id="whatsappBtn" href="https://whatsapp.com/channel/0029Vb6gBha8F2pDLuILTH1o" target="_blank" rel="noopener noreferrer" class="whatsapp-sub-btn" title="S'abonner à notre chaîne WhatsApp">
            <i class="fa-brands fa-whatsapp"></i>
            <span>S'abonner</span>
        </a>

        <button id="refreshBtn" class="refresh-btn" title="Actualiser" aria-label="Actualiser la liste">
            <i class="fa-solid fa-rotate-right"></i>
        </button>
    </header>
`;
document.getElementById('layout-header').innerHTML = headerHTML;

// 2. Création et injection de la Sidebar (Barre latérale)
const sidebarHTML = `
    <aside style="background-color: #f4f4f4; width: 200px; padding: 15px; height: 300px;">
        <h3>Navigation</h3>
        <ul>
            <li><a href="#">Lien 1</a></li>
            <li><a href="#">Lien 2</a></li>
            <li><a href="#">Lien 3</a></li>
        </ul>
    </aside>
`;
document.getElementById('layout-sidebar').innerHTML = sidebarHTML;

// 3. Création et injection du Footer
const footerHTML = `
       <footer class="app-footer">
        <nav class="bottom-nav">
            <button type="button" id="navHome" class="nav-item">
                <i class="fa-solid fa-house"></i>
                <span>Accueil</span>
            </button>
            <button type="button" id="navSeries" class="nav-item active">
                <i class="fa-solid fa-book-open"></i>
                <span>Séries</span>
            </button>
            <button type="button" id="navProfile" class="nav-item">
                <i class="fa-solid fa-user"></i>
                <span>Profil</span>
            </button>
            <a href="editeur.html" id="navEditor" class="nav-item">
                <i class="fa-solid fa-pen-to-square"></i>
                <span>Éditeur</span>
            </a>
        </nav>
    </footer>
`;
document.getElementById('layout-footer').innerHTML = footerHTML;
