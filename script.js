const headerTitle = document.getElementById('headerTitle');
        const backBtn = document.getElementById('backBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        const loader = document.getElementById('loader');
        const appContentScroll = document.getElementById('appContentScroll');
        const whatsappBtn = document.getElementById('whatsappBtn');
        whatsappBtn.href = WHATSAPP_CHANNEL_URL;

        const homeView = document.getElementById('homeView');
        const seriesView = document.getElementById('seriesView');
        const episodesView = document.getElementById('episodesView');
        const readerView = document.getElementById('readerView');
        const profileView = document.getElementById('profileView');

        const navHome = document.getElementById('navHome');
        const navSeries = document.getElementById('navSeries');
        const navProfile = document.getElementById('navProfile');
        const navEditor = document.getElementById('navEditor');
        const btnExploreFromHome = document.getElementById('btnExploreFromHome');
        const fabAddProfile = document.getElementById('fabAddProfile');
        const profilesList = document.getElementById('profilesList');

        const seriesGrid = document.getElementById('seriesGrid');
        const episodesList = document.getElementById('episodesList');
        const readerTitle = document.getElementById('readerTitle');
        const readerContent = document.getElementById('readerContent');

        const nextEpisodeContainer = document.getElementById('nextEpisodeContainer');
        const btnNextEpisode = document.getElementById('btnNextEpisode');

        const commentsListContainer = document.getElementById('commentsListContainer');
        const commentsCountLabel = document.getElementById('commentsCountLabel');
        const commentPseudo = document.getElementById('commentPseudo');
        const commentMsg = document.getElementById('commentMsg');
        const btnSendComment = document.getElementById('btnSendComment');

        let currentView = 'series';
        let currentSeries = null;
        let currentEpisode = null;
        let allSeriesList = [];
        let allCurrentEpisodes = [];

        /* ========================================================
           FILTRE DES VISITES : MODE LOCAL & LISTE NOIRE D'UTILISATEURS
           ======================================================== */
        
        // Liste des identifiants utilisateurs dont les visites sont bloquées
        // Ajoutez simplement d'autres ID séparés par une virgule
        const BLOCKED_VISITOR_IDS = [
            "USER_3r3mt41mvkdg35m",
            "USER_r7kic66mvkjbdqj",
            "USER_igzz666mviv5o0e"
            // Exemple : "USER_autre_id",
        ];

        // Vérification de l'environnement local (localhost, file:///, 127.0.0.1)
        function isLocalEnvironment() {
            const hostname = window.location.hostname;
            const protocol = window.location.protocol;
            return (
                protocol === 'file:' ||
                hostname === 'localhost' ||
                hostname === '127.0.0.1' ||
                hostname === '0.0.0.0' ||
                hostname.endsWith('.local')
            );
        }

        /* ========================================================
           MODULE DE GÉOLOCALISATION & STATISTIQUES EN TEMPS RÉEL
           ======================================================== */
        let userCountry = "Inconnu";

        async function detectUserCountry() {
            const cachedCountry = localStorage.getItem('benamoura_user_country');
            if (cachedCountry) {
                userCountry = cachedCountry;
                return userCountry;
            }

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5 secondes max
                const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
                clearTimeout(timeoutId);
                const data = await res.json();
                if (data && data.country_name) {
                    userCountry = data.country_name;
                    localStorage.setItem('benamoura_user_country', userCountry);
                    return userCountry;
                }
            } catch (e) {
                // Secours basé sur le fuseau horaire de l'appareil
                try {
                    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    if (tz) {
                        userCountry = tz.split('/')[0] || "Inconnu";
                    }
                } catch (err) {}
            }
            return userCountry;
        }

        function getDeviceType() {
            const ua = navigator.userAgent;
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                return 'Tablette';
            }
            if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
                return 'Mobile';
            }
            return 'Ordinateur (PC)';
        }

        function getOS() {
            const ua = navigator.userAgent;
            if (ua.indexOf("Win") !== -1) return "Windows";
            if (ua.indexOf("Android") !== -1) return "Android";
            if (ua.indexOf("iPhone") !== -1 || ua.indexOf("iPad") !== -1) return "iOS";
            if (ua.indexOf("Mac") !== -1) return "MacOS";
            if (ua.indexOf("Linux") !== -1) return "Linux";
            return "Autre";
        }

        function getBrowser() {
            const ua = navigator.userAgent;
            if (ua.indexOf("Chrome") !== -1 && ua.indexOf("Edg") === -1) return "Chrome";
            if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) return "Safari";
            if (ua.indexOf("Firefox") !== -1) return "Firefox";
            if (ua.indexOf("Edg") !== -1) return "Edge";
            return "Autre";
        }

        function getVisitorId() {
            let vid = localStorage.getItem('benamoura_vid');
            if (!vid) {
                vid = 'USER_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
                localStorage.setItem('benamoura_vid', vid);
            }
            return vid;
        }

        function trackAnalytics(eventType, targetTitle = '', targetId = '') {
            try {
                // 1. Ne rien envoyer si le site est ouvert en local (localhost / fichier)
                if (isLocalEnvironment()) {
                    return;
                }

                const visitorId = getVisitorId();

                // 2. Ne rien envoyer si l'utilisateur est dans la liste des utilisateurs bloqués
                if (BLOCKED_VISITOR_IDS.includes(visitorId)) {
                    return;
                }

                const country = localStorage.getItem('benamoura_user_country') || userCountry;
                const payload = {
                    type: 'analytics',
                    visitorId: visitorId,
                    eventType: eventType,
                    targetTitle: targetTitle,
                    targetId: targetId,
                    pays: country,
                    device: getDeviceType(),
                    os: getOS(),
                    browser: getBrowser()
                };

                fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                }).catch(() => {});
            } catch (e) {}
        }

        function checkAdminStatus() {
            const isAdmin = localStorage.getItem('benamoura_is_admin') === 'true';
            if (isAdmin && navEditor) {
                navEditor.style.display = 'flex';
            } else if (navEditor) {
                navEditor.style.display = 'none';
            }
        }

        let titleClickCount = 0;
        let titleClickTimer = null;
        headerTitle.addEventListener('click', () => {
            titleClickCount++;
            clearTimeout(titleClickTimer);
            titleClickTimer = setTimeout(() => {
                titleClickCount = 0;
            }, 1000);

            if (titleClickCount >= 3) {
                titleClickCount = 0;
                const isCurrentlyAdmin = localStorage.getItem('benamoura_is_admin') === 'true';
                if (isCurrentlyAdmin) {
                    if (confirm("Voulez-vous vous déconnecter du mode Administrateur ?")) {
                        localStorage.removeItem('benamoura_is_admin');
                        checkAdminStatus();
                        alert("Mode administrateur désactivé.");
                    }
                } else {
                    const pass = prompt("Entrez le code d'accès administrateur :");
                    if (pass === ADMIN_PASSCODE) {
                        localStorage.setItem('benamoura_is_admin', 'true');
                        checkAdminStatus();
                        alert("Accès administrateur validé ! Le bouton Éditeur est maintenant accessible.");
                    } else if (pass !== null) {
                        alert("Code incorrect.");
                    }
                }
            }
        });

        function stripHtmlToText(html) {
            if (!html) return "Aucune description disponible...";
            const tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return (tmp.textContent || tmp.innerText || "").trim() || "Aucune description disponible...";
        }

        function getDirectSeriesUrl(seriesId) {
            const baseUrl = window.location.origin + window.location.pathname;
            return `${baseUrl}?serie=${encodeURIComponent(seriesId)}`;
        }

        function getDirectEpisodeUrl(seriesId, episodeId) {
            const baseUrl = window.location.origin + window.location.pathname;
            return `${baseUrl}?serie=${encodeURIComponent(seriesId)}&episode=${encodeURIComponent(episodeId)}`;
        }

        function updateBrowserUrl(params) {
            if (window.history.pushState) {
                const newUrl = window.location.origin + window.location.pathname + (params ? `?${params}` : '');
                window.history.pushState({ path: newUrl }, '', newUrl);
            }
        }

        /* GESTION DE L'AFFICHAGE DES PROFILS — GOOGLE SHEETS + SECOURS LOCAL */
        let profilesRequestInProgress = false;

        async function renderProfiles() {
            if (!profilesList || profilesRequestInProgress) return;
            profilesRequestInProgress = true;
            profilesList.innerHTML = `
                <div class="empty-profiles-card">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <h4>Chargement des profils...</h4>
                    <p>Récupération des profils enregistrés.</p>
                </div>`;

            let profiles = [];
            let loadedFromSheet = false;

            try {
                const response = await fetch(`${SCRIPT_URL}?action=getProfiles&_=${Date.now()}`, {
                    method: 'GET',
                    cache: 'no-store'
                });
                if (!response.ok) throw new Error('Réponse serveur : ' + response.status);
                const result = await response.json();
                if (result.status !== 'success' || !Array.isArray(result.data)) {
                    throw new Error(result.message || 'Réponse invalide du serveur.');
                }

                // Les noms de champs correspondent à l'action getProfiles du code GS.
                profiles = result.data.map(prof => ({
                    id: prof.id || '',
                    name: prof.nom || 'Utilisateur',
                    email: prof.email || '',
                    telephone: prof.telephone || '',
                    pays: prof.pays || '',
                    ville: prof.ville || '',
                    adresse: prof.adresse || '',
                    orientation: prof.orientation || '',
                    role: prof.role || '',
                    date: prof.date || '',
                    likes: Number(prof.likes) || 0,
                    dislikes: Number(prof.dislikes) || 0,
                    source: 'sheet'
                }));
                loadedFromSheet = true;
            } catch (error) {
                console.error('Erreur de chargement des profils Google Sheets :', error);
                // En cas de panne réseau, conserver l'affichage des anciens profils locaux.
                try {
                    const localProfiles = JSON.parse(localStorage.getItem('benamoura_profiles')) || [];
                    profiles = localProfiles.map(prof => ({
                        ...prof,
                        name: prof.name || prof.nom || 'Utilisateur',
                        date: prof.date || 'Enregistré',
                        source: 'local'
                    }));
                } catch (e) {
                    profiles = [];
                }

                if (profiles.length === 0) {
                    profilesList.innerHTML = `
                        <div class="empty-profiles-card">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <h4>Impossible de charger les profils</h4>
                            <p>Vérifiez votre connexion, l’URL du déploiement Apps Script et l’accès au service Google Sheets, puis appuyez sur Actualiser.</p>
                        </div>`;
                    profilesRequestInProgress = false;
                    return;
                }
            }

            // Conserver le comportement de secours existant pour le pseudo local.
            const savedPseudo = localStorage.getItem('benamoura_last_pseudo');
            if (!loadedFromSheet && profiles.length === 0 && savedPseudo) {
                profiles.push({
                    name: savedPseudo,
                    bio: 'Lecteur actif Benamoura',
                    date: 'Récemment',
                    source: 'local'
                });
            }

            profilesList.innerHTML = '';
            if (profiles.length === 0) {
                profilesList.innerHTML = `
                    <div class="empty-profiles-card">
                        <i class="fa-solid fa-id-badge"></i>
                        <h4>Aucun profil enregistré</h4>
                        <p>Créez votre profil pour le retrouver ici.</p>
                    </div>`;
                profilesRequestInProgress = false;
                return;
            }

            profiles.forEach((prof, idx) => {
                const card = document.createElement('div');
                card.className = 'profile-card';

                const name = prof.name || 'Utilisateur';
                const initial = name.trim().charAt(0).toUpperCase() || 'P';
                const avatar = document.createElement('div');
                avatar.className = 'profile-avatar';
                avatar.textContent = initial;

                const info = document.createElement('div');
                info.className = 'profile-info';

                const title = document.createElement('h4');
                title.className = 'profile-name';
                title.textContent = name;
                info.appendChild(title);

                const details = [];
                if (prof.email) details.push(['fa-envelope', prof.email]);
                if (prof.telephone) details.push(['fa-phone', prof.telephone]);
                const location = [prof.ville, prof.pays].filter(Boolean).join(', ');
                if (location) details.push(['fa-location-dot', location]);
                if (prof.orientation) {
                    details.push(['fa-heart', prof.orientation + (prof.role ? ' · ' + prof.role : '')]);
                }
                if (prof.adresse) details.push(['fa-map-pin', prof.adresse]);
                if (prof.bio && details.length === 0) details.push(['fa-user', prof.bio]);
                if (details.length === 0) details.push(['fa-book-open', 'Lecteur Benamoura']);

                details.forEach(([iconName, value]) => {
                    const line = document.createElement('p');
                    line.className = 'profile-detail';
                    const icon = document.createElement('i');
                    icon.className = 'fa-solid ' + iconName;
                    icon.style.marginRight = '5px';
                    line.appendChild(icon);
                    line.appendChild(document.createTextNode(value));
                    info.appendChild(line);
                });

                const date = document.createElement('span');
                date.className = 'profile-date';
                const dateIcon = document.createElement('i');
                dateIcon.className = 'fa-regular fa-clock';
                dateIcon.style.marginRight = '4px';
                date.appendChild(dateIcon);
                date.appendChild(document.createTextNode(prof.date || 'Enregistré'));
                info.appendChild(date);

                card.appendChild(avatar);
                card.appendChild(info);

                // L'API GS ne possède pas d'action de suppression : le bouton supprimer
                // reste uniquement pour les profils stockés localement, sans fausse suppression Sheets.
                if (prof.source === 'local') {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'profile-delete-btn';
                    deleteBtn.title = 'Supprimer ce profil local';
                    deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
                    deleteBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        if (confirm(`Supprimer le profil local « ${name} » ?`)) deleteProfile(idx);
                    });
                    card.appendChild(deleteBtn);
                }

                profilesList.appendChild(card);
            });
            profilesRequestInProgress = false;
        }

        function deleteProfile(index) {
            try {
                let profiles = JSON.parse(localStorage.getItem('benamoura_profiles')) || [];
                profiles.splice(index, 1);
                localStorage.setItem('benamoura_profiles', JSON.stringify(profiles));
                renderProfiles();
            } catch(e) {
                console.error('Impossible de supprimer le profil local :', e);
            }
        }

        function switchView(viewName) {
            currentView = viewName;
            homeView.classList.remove('active');
            seriesView.classList.remove('active');
            episodesView.classList.remove('active');
            readerView.classList.remove('active');
            profileView.classList.remove('active');

            navHome.classList.remove('active');
            navSeries.classList.remove('active');
            navProfile.classList.remove('active');

            // Affichage du bouton flottant "Add" uniquement dans la vue profil
            if (fabAddProfile) {
                fabAddProfile.style.display = (viewName === 'profile') ? 'inline-flex' : 'none';
            }

            if (viewName === 'home') {
                headerTitle.textContent = "Benamoura - Accueil";
                backBtn.style.display = 'none';
                homeView.classList.add('active');
                navHome.classList.add('active');
                updateBrowserUrl('');
                trackAnalytics('Onglet_Visite', 'Accueil');
            } else if (viewName === 'series') {
                headerTitle.textContent = "Benamoura";
                backBtn.style.display = 'none';
                seriesView.classList.add('active');
                navSeries.classList.add('active');
                updateBrowserUrl('');
                trackAnalytics('Onglet_Visite', 'Séries');
            } else if (viewName === 'profile') {
                headerTitle.textContent = "Profil";
                backBtn.style.display = 'none';
                profileView.classList.add('active');
                navProfile.classList.add('active');
                updateBrowserUrl('');
                renderProfiles();
                trackAnalytics('Onglet_Visite', 'Profil');
            } else if (viewName === 'episodes') {
                headerTitle.textContent = currentSeries ? currentSeries.titre : "Épisodes";
                backBtn.style.display = 'flex';
                episodesView.classList.add('active');
                navSeries.classList.add('active');
                if (currentSeries) {
                    updateBrowserUrl(`serie=${encodeURIComponent(currentSeries.id)}`);
                    trackAnalytics('Lecture_Serie', currentSeries.titre, currentSeries.id);
                }
            } else if (viewName === 'reader') {
                backBtn.style.display = 'flex';
                readerView.classList.add('active');
                navSeries.classList.add('active');
                if (currentSeries && currentEpisode) {
                    updateBrowserUrl(`serie=${encodeURIComponent(currentSeries.id)}&episode=${encodeURIComponent(currentEpisode.id)}`);
                    trackAnalytics('Lecture_Episode', (currentSeries.titre ? currentSeries.titre + ' - ' : '') + currentEpisode.titre, currentEpisode.id);
                }
            }
            appContentScroll.scrollTop = 0;
        }

        function getUserLocalVote(targetId) {
            return localStorage.getItem(`voted_${targetId}`) || null;
        }

        function setUserLocalVote(targetId, voteType) {
            if (voteType) {
                localStorage.setItem(`voted_${targetId}`, voteType);
            } else {
                localStorage.removeItem(`voted_${targetId}`);
            }
        }

        async function sendInteractionToSheet(targetType, targetId, likeDelta, dislikeDelta, shareDelta) {
            try {
                fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        type: 'interaction',
                        targetType: targetType,
                        targetId: targetId,
                        likeDelta: likeDelta,
                        dislikeDelta: dislikeDelta,
                        shareDelta: shareDelta
                    })
                });
            } catch (e) {
                console.error("Erreur mise à jour interaction:", e);
            }
        }

        async function fetchSeries(initialTargetSeriesId = null, initialTargetEpisodeId = null) {
            loader.style.display = 'flex';
            seriesGrid.innerHTML = '';

            try {
                const response = await fetch(`${SCRIPT_URL}?action=getSeries`);
                const result = await response.json();

                loader.style.display = 'none';

                if (result.status === 'success' && result.data.length > 0) {
                    allSeriesList = result.data;
                    seriesGrid.innerHTML = '';

                    result.data.forEach(serie => {
                        const card = document.createElement('div');
                        card.className = 'card';

                        const imgCover = serie.image ? serie.image : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60';
                        const textPreview = stripHtmlToText(serie.contenu);
                        const userVote = getUserLocalVote(serie.id);

                        let currentLikes = serie.likes || 0;
                        let currentDislikes = serie.dislikes || 0;

                        card.innerHTML = `
                            <div class="card-cover-wrapper" data-action="open">
                                <img src="${imgCover}" class="card-img" alt="${serie.titre}" loading="lazy">
                                <div class="badge-episodes" id="badge-${serie.id}">
                                    <i class="fa-solid fa-film"></i> <span>...</span>
                                </div>
                            </div>
                            <div class="card-body" data-action="open">
                                <h3 class="card-title">${serie.titre}</h3>
                                <p class="line-clamp-3">${textPreview}</p>
                            </div>
                            <div class="card-actions-bar">
                                <div class="vote-group">
                                    <button class="btn-action ${userVote === 'like' ? 'active-like' : ''}" data-vote="like">
                                        <i class="fa-solid fa-thumbs-up"></i> <span class="like-count">${currentLikes}</span>
                                    </button>
                                    <button class="btn-action ${userVote === 'dislike' ? 'active-dislike' : ''}" data-vote="dislike">
                                        <i class="fa-solid fa-thumbs-down"></i> <span class="dislike-count">${currentDislikes}</span>
                                    </button>
                                </div>
                                <button class="btn-action" data-action="share">
                                    <i class="fa-solid fa-share-nodes"></i> <span>Partager</span>
                                </button>
                            </div>
                        `;

                        card.querySelectorAll('[data-action="open"]').forEach(el => {
                            el.addEventListener('click', () => {
                                currentSeries = serie;
                                fetchEpisodes(serie.id);
                            });
                        });

                        const likeBtn = card.querySelector('[data-vote="like"]');
                        const dislikeBtn = card.querySelector('[data-vote="dislike"]');
                        const likeCountEl = card.querySelector('.like-count');
                        const dislikeCountEl = card.querySelector('.dislike-count');

                        likeBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            let currentVote = getUserLocalVote(serie.id);
                            let lDelta = 0, dDelta = 0;

                            if (currentVote === 'like') {
                                currentLikes = Math.max(0, currentLikes - 1);
                                setUserLocalVote(serie.id, null);
                                likeBtn.classList.remove('active-like');
                                lDelta = -1;
                            } else {
                                if (currentVote === 'dislike') {
                                    currentDislikes = Math.max(0, currentDislikes - 1);
                                    dislikeBtn.classList.remove('active-dislike');
                                    dDelta = -1;
                                }
                                currentLikes += 1;
                                setUserLocalVote(serie.id, 'like');
                                likeBtn.classList.add('active-like');
                                lDelta = 1;
                            }
                            likeCountEl.textContent = currentLikes;
                            dislikeCountEl.textContent = currentDislikes;
                            sendInteractionToSheet('serie', serie.id, lDelta, dDelta, 0);
                        });

                        dislikeBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            let currentVote = getUserLocalVote(serie.id);
                            let lDelta = 0, dDelta = 0;

                            if (currentVote === 'dislike') {
                                currentDislikes = Math.max(0, currentDislikes - 1);
                                setUserLocalVote(serie.id, null);
                                dislikeBtn.classList.remove('active-dislike');
                                dDelta = -1;
                            } else {
                                if (currentVote === 'like') {
                                    currentLikes = Math.max(0, currentLikes - 1);
                                    likeBtn.classList.remove('active-like');
                                    lDelta = -1;
                                }
                                currentDislikes += 1;
                                setUserLocalVote(serie.id, 'dislike');
                                dislikeBtn.classList.add('active-dislike');
                                dDelta = 1;
                            }
                            likeCountEl.textContent = currentLikes;
                            dislikeCountEl.textContent = currentDislikes;
                            sendInteractionToSheet('serie', serie.id, lDelta, dDelta, 0);
                        });

                        card.querySelector('[data-action="share"]').addEventListener('click', async (e) => {
                            e.stopPropagation();
                            sendInteractionToSheet('serie', serie.id, 0, 0, 1);
                            
                            const directUrl = getDirectSeriesUrl(serie.id);
                            const textDesc = stripHtmlToText(serie.contenu);
                            const shareMessage = `${serie.titre}\n\n${textDesc}\n\nCliquez sur le lien pour regarder cette série :\n${directUrl}`;

                            if (navigator.share) {
                                try {
                                    await navigator.share({
                                        title: serie.titre,
                                        text: shareMessage
                                    });
                                } catch (err) {}
                            } else {
                                await navigator.clipboard.writeText(shareMessage);
                                alert("Lien et détails de la série copiés avec succès !");
                            }
                        });

                        seriesGrid.appendChild(card);
                        loadSeriesEpisodeCount(serie.id);
                    });

                    if (initialTargetSeriesId) {
                        const matchedSerie = allSeriesList.find(s => String(s.id) === String(initialTargetSeriesId));
                        if (matchedSerie) {
                            currentSeries = matchedSerie;
                            fetchEpisodes(matchedSerie.id, initialTargetEpisodeId);
                            return;
                        }
                    }

                    switchView('series');
                } else {
                    seriesGrid.innerHTML = `<p style="text-align:center; color: var(--text-secondary); margin-top: 40px;">Aucune série trouvée.</p>`;
                    switchView('series');
                }
            } catch (err) {
                loader.style.display = 'none';
                seriesGrid.innerHTML = `<p style="text-align:center; color: red;">Erreur de connexion à Google Sheets.</p>`;
            }
        }

        async function loadSeriesEpisodeCount(seriesId) {
            try {
                const res = await fetch(`${SCRIPT_URL}?action=getEpisodes&seriesId=${encodeURIComponent(seriesId)}`);
                const json = await res.json();
                const badge = document.getElementById(`badge-${seriesId}`);
                if (badge && json.status === 'success') {
                    const count = json.data ? json.data.length : 0;
                    badge.innerHTML = `<i class="fa-solid fa-film"></i> <span>${count} ${count > 1 ? 'épisodes' : 'épisode'}</span>`;
                }
            } catch (e) {
                const badge = document.getElementById(`badge-${seriesId}`);
                if (badge) badge.style.display = 'none';
            }
        }

        async function fetchEpisodes(seriesId, initialEpisodeId = null) {
            loader.style.display = 'flex';
            episodesList.innerHTML = '';
            switchView('episodes');

            try {
                const response = await fetch(`${SCRIPT_URL}?action=getEpisodes&seriesId=${encodeURIComponent(seriesId)}`);
                const result = await response.json();

                loader.style.display = 'none';

                if (result.status === 'success' && result.data.length > 0) {
                    allCurrentEpisodes = result.data;
                    episodesList.innerHTML = '';

                    result.data.forEach(ep => {
                        const card = document.createElement('div');
                        card.className = 'episode-card';

                        const epImg = ep.image ? ep.image : (currentSeries && currentSeries.image ? currentSeries.image : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=60');
                        const epTextPreview = stripHtmlToText(ep.contenu);

                        card.innerHTML = `
                            <img src="${epImg}" class="episode-thumb" alt="${ep.titre}" loading="lazy">
                            <div class="episode-content-wrapper">
                                <h4 class="episode-title">${ep.titre}</h4>
                                <p class="line-clamp-3">${epTextPreview}</p>
                            </div>
                        `;

                        card.addEventListener('click', () => {
                            openReader(ep);
                        });

                        episodesList.appendChild(card);
                    });

                    if (initialEpisodeId) {
                        const matchedEp = allCurrentEpisodes.find(ep => String(ep.id) === String(initialEpisodeId));
                        if (matchedEp) {
                            openReader(matchedEp);
                            return;
                        }
                    }

                } else {
                    allCurrentEpisodes = [];
                    episodesList.innerHTML = `<p style="text-align:center; color: var(--text-secondary); margin-top: 40px;">Aucun épisode disponible pour cette série.</p>`;
                }
            } catch (err) {
                loader.style.display = 'none';
                episodesList.innerHTML = `<p style="text-align:center; color: red;">Impossible de charger les épisodes.</p>`;
            }
        }

        function openReader(episode) {
            currentEpisode = episode;
            headerTitle.textContent = episode.titre;
            readerTitle.textContent = episode.titre;
            
            const rawContent = episode.contenu || "<p>Contenu vide.</p>";
            let contentHTML = "";

            const hasAlreadyImageInHtml = /<img\s+[^>]*src=/i.test(rawContent);
            const containsSameImageUrl = episode.image && rawContent.indexOf(episode.image) !== -1;

            if (episode.image && !hasAlreadyImageInHtml && !containsSameImageUrl) {
                contentHTML += `<img src="${episode.image}" class="reader-img" alt="${episode.titre}">`;
            }

            contentHTML += rawContent;
            readerContent.innerHTML = contentHTML;

            checkNextEpisode(episode);
            setupEpisodeInteractions(episode);
            fetchComments(episode.id);

            switchView('reader');
        }

        function checkNextEpisode(currentEp) {
            const currentIndex = allCurrentEpisodes.findIndex(ep => String(ep.id) === String(currentEp.id));
            if (currentIndex !== -1 && currentIndex < allCurrentEpisodes.length - 1) {
                const nextEp = allCurrentEpisodes[currentIndex + 1];
                nextEpisodeContainer.style.display = 'block';
                btnNextEpisode.onclick = () => {
                    openReader(nextEp);
                };
            } else {
                nextEpisodeContainer.style.display = 'none';
                btnNextEpisode.onclick = null;
            }
        }

        function setupEpisodeInteractions(ep) {
            const container = document.getElementById('episodeVoteGroup');
            const userVote = getUserLocalVote(ep.id);
            let epLikes = ep.likes || 0;
            let epDislikes = ep.dislikes || 0;

            container.innerHTML = `
                <button class="btn-action ${userVote === 'like' ? 'active-like' : ''}" id="epLikeBtn">
                    <i class="fa-solid fa-thumbs-up"></i> <span id="epLikeCount">${epLikes}</span>
                </button>
                <button class="btn-action ${userVote === 'dislike' ? 'active-dislike' : ''}" id="epDislikeBtn">
                    <i class="fa-solid fa-thumbs-down"></i> <span id="epDislikeCount">${epDislikes}</span>
                </button>
            `;

            const likeBtn = document.getElementById('epLikeBtn');
            const dislikeBtn = document.getElementById('epDislikeBtn');
            const likeTxt = document.getElementById('epLikeCount');
            const dislikeTxt = document.getElementById('epDislikeCount');

            likeBtn.onclick = () => {
                let vote = getUserLocalVote(ep.id);
                let lD = 0, dD = 0;
                if (vote === 'like') {
                    epLikes = Math.max(0, epLikes - 1);
                    setUserLocalVote(ep.id, null);
                    likeBtn.classList.remove('active-like');
                    lD = -1;
                } else {
                    if (vote === 'dislike') {
                        epDislikes = Math.max(0, epDislikes - 1);
                        dislikeBtn.classList.remove('active-dislike');
                        dD = -1;
                    }
                    epLikes += 1;
                    setUserLocalVote(ep.id, 'like');
                    likeBtn.classList.add('active-like');
                    lD = 1;
                }
                likeTxt.textContent = epLikes;
                dislikeTxt.textContent = epDislikes;
                sendInteractionToSheet('episode', ep.id, lD, dD, 0);
            };

            dislikeBtn.onclick = () => {
                let vote = getUserLocalVote(ep.id);
                let lD = 0, dD = 0;
                if (vote === 'dislike') {
                    epDislikes = Math.max(0, epDislikes - 1);
                    setUserLocalVote(ep.id, null);
                    dislikeBtn.classList.remove('active-dislike');
                    dD = -1;
                } else {
                    if (vote === 'like') {
                        epLikes = Math.max(0, epLikes - 1);
                        likeBtn.classList.remove('active-like');
                        lD = -1;
                    }
                    epDislikes += 1;
                    setUserLocalVote(ep.id, 'dislike');
                    dislikeBtn.classList.add('active-dislike');
                    dD = 1;
                }
                likeTxt.textContent = epLikes;
                dislikeTxt.textContent = epDislikes;
                sendInteractionToSheet('episode', ep.id, lD, dD, 0);
            };

            document.getElementById('shareEpisodeBtn').onclick = async () => {
                sendInteractionToSheet('episode', ep.id, 0, 0, 1);
                const sId = currentSeries ? currentSeries.id : '';
                const directUrl = getDirectEpisodeUrl(sId, ep.id);

                let rawText = stripHtmlToText(ep.contenu);
                let excerpt = rawText;
                if (excerpt.length > 200) {
                    excerpt = excerpt.substring(0, 200).trim() + "...";
                }

                const seriesTitlePart = currentSeries && currentSeries.titre ? `${currentSeries.titre} - ` : '';
                const shareMessage = `🔥 *${seriesTitlePart}${ep.titre}*\n\n📖 *Extrait :*\n« ${excerpt} »\n\n😱 *Tu veux absolument découvrir la suite ? C'est tellement palpitant !*\n\n👉 *Lis l'épisode complet ici :*\n${directUrl}`;

                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: `${seriesTitlePart}${ep.titre}`,
                            text: shareMessage
                        });
                    } catch(e) {}
                } else {
                    await navigator.clipboard.writeText(shareMessage);
                    alert("Lien et extrait de l'épisode copiés avec succès ! Prêt à être partagé.");
                }
            };
        }

        async function fetchComments(episodeId) {
            commentsListContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); font-size: 0.85rem;">Chargement des commentaires...</p>';
            
            try {
                const res = await fetch(`${SCRIPT_URL}?action=getComments&episodeId=${encodeURIComponent(episodeId)}`);
                const json = await res.json();

                if (json.status === 'success') {
                    const comments = json.data;
                    commentsCountLabel.textContent = `Commentaires (${comments.length})`;

                    if (comments.length === 0) {
                        commentsListContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); font-size: 0.85rem;">Soyez le premier à commenter cet épisode !</p>';
                        return;
                    }

                    commentsListContainer.innerHTML = '';
                    comments.forEach(c => {
                        const item = document.createElement('div');
                        item.className = 'comment-item';
                        item.innerHTML = `
                            <div class="comment-author-bar">
                                <span class="comment-author"><i class="fa-solid fa-user-circle"></i> ${c.pseudo}</span>
                                <span class="comment-date">${c.date}</span>
                            </div>
                            <p class="comment-text">${c.message}</p>
                        `;
                        commentsListContainer.appendChild(item);
                    });
                }
            } catch (e) {
                commentsListContainer.innerHTML = '<p style="text-align: center; color: red; font-size: 0.85rem;">Erreur de chargement des commentaires.</p>';
            }
        }

        btnSendComment.addEventListener('click', async () => {
            const pseudo = commentPseudo.value.trim() || "Anonyme";
            const message = commentMsg.value.trim();

            if (!message) {
                alert("Veuillez écrire un commentaire avant de publier.");
                commentMsg.focus();
                return;
            }

            if (pseudo && pseudo !== "Anonyme") {
                localStorage.setItem('benamoura_last_pseudo', pseudo);
            }

            btnSendComment.disabled = true;
            btnSendComment.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Envoi...';

            try {
                const res = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        type: 'comment',
                        episodeId: currentEpisode.id,
                        pseudo: pseudo,
                        message: message
                    })
                });
                const json = await res.json();

                if (json.status === 'success') {
                    commentMsg.value = '';
                    await fetchComments(currentEpisode.id);
                } else {
                    alert("Erreur lors de la publication du commentaire.");
                }
            } catch (err) {
                alert("Échec de connexion avec Google Sheets.");
            } finally {
                btnSendComment.disabled = false;
                btnSendComment.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publier';
            }
        });

        navHome.addEventListener('click', () => {
            switchView('home');
        });

        navSeries.addEventListener('click', () => {
            switchView('series');
        });

        navProfile.addEventListener('click', () => {
            switchView('profile');
        });

        btnExploreFromHome.addEventListener('click', () => {
            switchView('series');
        });

        backBtn.addEventListener('click', () => {
            if (currentView === 'reader') {
                switchView('episodes');
            } else if (currentView === 'episodes') {
                switchView('series');
            } else if (currentView === 'home' || currentView === 'profile') {
                switchView('series');
            }
        });

        refreshBtn.addEventListener('click', () => {
            if (currentView === 'series' || currentView === 'home') {
                fetchSeries();
            } else if (currentView === 'profile') {
                renderProfiles();
            } else if (currentView === 'episodes' && currentSeries) {
                fetchEpisodes(currentSeries.id);
            } else if (currentView === 'reader' && currentEpisode) {
                fetchComments(currentEpisode.id);
            }
        });

        window.addEventListener('DOMContentLoaded', async () => {
            const urlParams = new URLSearchParams(window.location.search);
            
            if (urlParams.get('admin') === '1') {
                localStorage.setItem('benamoura_is_admin', 'true');
            }

            checkAdminStatus();

            // Détecte le pays en arrière-plan puis trace la visite
            await detectUserCountry();
            trackAnalytics('Visite_Site', 'Accueil');

            const targetSerieId = urlParams.get('serie');
            const targetEpisodeId = urlParams.get('episode');
            fetchSeries(targetSerieId, targetEpisodeId);
        });