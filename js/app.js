/**
 * CrackStreams & MethStreams - Core Application Script
 * Category Card Navigation, Live Match List, 1-Second Countdown Ticker & Live Player Engine
 */

(function () {
    'use strict';

    const PUBLIC_BASE_URL = window.PUBLIC_BASE_URL || 'https://hostinfo.cfd';
    const API_ENDPOINT = 'https://aurasports.xyz/api/schedule';
    const FALLBACK_ENDPOINT = 'api_sample.json';

    // 10 Official Homepage Sports (Exact match with StreamKing layout)
    const SPORTS_CONFIG = [
        {
            id: 'nfl',
            title: 'NFL',
            pageTitle: 'NFL Streams',
            subtitle: 'NFL GRIDIRON SUNDAY ACTION & REDZONE MULTI-FEEDS',
            desc: 'Watch free NFL streams online on CrackStreams Hub. Follow every touchdown and field goal in crisp 1080p HD, featuring MethStreams and StreamEast mirror feeds.',
            icon: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
            apiKeys: ['nfl', 'american-football']
        },
        {
            id: 'nba',
            title: 'NBA',
            pageTitle: 'NBA Streams',
            subtitle: 'NBA COURT ACTION & FASTBREAK HIGHLIGHTS LIVE',
            desc: 'Watch free NBA basketball streams on CrackStreams. Track regular season matchups, buzzer-beaters, and the NBA Finals in pristine 60FPS video clarity.',
            icon: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
            apiKeys: ['nba']
        },
        {
            id: 'cfb',
            title: 'CFB',
            pageTitle: 'CFB Streams',
            subtitle: 'COLLEGE FOOTBALL SATURDAY RIVALRIES & CFP CHASE',
            desc: 'Stream live college football games on CrackStreams. Full high-definition coverage for SEC, Big Ten, Big 12, ACC showdowns, and New Year bowl games.',
            icon: 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
            apiKeys: ['cfb', 'ncaaf', 'college-football']
        },
        {
            id: 'soccer',
            title: 'Soccer',
            pageTitle: 'Soccer Streams',
            subtitle: 'WORLDWIDE FOOTBALL DERBIES & CHAMPIONS LEAGUE NIGHTS',
            desc: 'Watch free soccer streams on CrackStreams. Premier League fixtures, UEFA Champions League nights, La Liga, and international qualifiers in smooth HD.',
            icon: 'https://a.espncdn.com/i/leaguelogos/soccer/500/uefacl.png',
            apiKeys: ['soccer', 'serie-a', 'carabao-cup', 'dfb-pokal', 'mls', 'brazil-serie-a', 'premier-league', 'la-liga', 'bundesliga', 'ligue-1']
        },
        {
            id: 'mma',
            title: 'UFC / Boxing',
            pageTitle: 'UFC & Boxing Streams',
            subtitle: 'UFC FIGHT NIGHTS & CHAMPIONSHIP RINGWALKS',
            desc: 'Stream free UFC pay-per-views and marquee world boxing championship cards on CrackStreams. Crystal-clear octagon action with multi-server backup feeds.',
            icon: 'https://a.espncdn.com/i/teamlogos/leagues/500/mma.png',
            apiKeys: ['mma', 'ufc', 'bellator', 'boxing']
        },
        {
            id: 'nhl',
            title: 'NHL',
            pageTitle: 'NHL Streams',
            subtitle: 'NHL ICE HOCKEY MATCHUPS & STANLEY CUP PURSUIT',
            desc: 'Watch live NHL streams on CrackStreams. Fast-action hockey coverage featuring power plays, overtime thrillers, and the road to the Stanley Cup in HD.',
            icon: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
            apiKeys: ['nhl', 'hockey']
        },
        {
            id: 'mlb',
            title: 'MLB',
            pageTitle: 'MLB Streams',
            subtitle: 'MAJOR LEAGUE BASEBALL DIAMOND PENNANT ACTION',
            desc: 'Stream free MLB games online on CrackStreams. Complete regular season coverage, walk-off drama, and World Series matchups with home and away audio.',
            icon: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
            apiKeys: ['mlb', 'baseball']
        },
        {
            id: 'f1',
            title: 'F1',
            pageTitle: 'Formula 1 Streams',
            subtitle: 'FORMULA 1 GRAND PRIX RACING & QUALIFYING SESSIONS',
            desc: 'Watch free F1 live streams on CrackStreams. Experience high-speed circuit racing, practice runs, and pole-position qualifying sessions with 60FPS video.',
            icon: 'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png',
            apiKeys: ['f1', 'formula-1', 'motorsport']
        },
        {
            id: 'wwe',
            title: 'WWE',
            pageTitle: 'WWE Streams',
            subtitle: 'WWE ENTERTAINMENT & PREMIUM LIVE EVENT CARDS',
            desc: 'Watch free WWE streams on CrackStreams. Catch WWE Raw, SmackDown, WrestleMania, Royal Rumble, and high-stakes ring rivalries in high-definition.',
            icon: 'https://a.espncdn.com/i/teamlogos/leagues/500/wwe.png',
            apiKeys: ['wwe', 'wrestling', 'aew']
        }
    ];

    // State
    let rawApiData = [];
    let matchesBySport = {};
    let allMatchesById = {};
    let currentSportId = null;
    let currentMatchId = null;
    let homeSearchQuery = '';
    let categorySearchQuery = '';
    let categoryFilterState = 'all'; // 'all', 'live', 'upcoming'
    let liveTickerTimer = null;

    // DOM Elements
    const homeView = document.getElementById('home-view');
    const categoryView = document.getElementById('category-view');
    const playerView = document.getElementById('player-view');

    const sportsGrid = document.getElementById('sports-grid');
    const categoryMatchesList = document.getElementById('category-matches-list');
    const catHeadingText = document.getElementById('cat-heading-text');
    const catSearchInput = document.getElementById('cat-search-input');
    const btnBackToHome = document.getElementById('btn-back-to-home');
    const searchInput = document.getElementById('search-input');
    const toast = document.getElementById('toast');
    const liveCoverageBadge = document.getElementById('live-coverage-badge');

    // Player View Elements
    const playerSportIcon = document.getElementById('player-sport-icon');
    const playerMatchTitle = document.getElementById('player-match-title');
    const playerSportBadge = document.getElementById('player-sport-badge');
    const playerKickoffTime = document.getElementById('player-kickoff-time');
    const playerCountdown = document.getElementById('player-countdown');
    const btnPlayerBackMatches = document.getElementById('btn-player-back-matches');
    const btnPlayerBackHome = document.getElementById('btn-player-back-home');
    const streamIframe = document.getElementById('stream-iframe');
    const playerSourcesList = document.getElementById('player-sources-list');

    document.addEventListener('DOMContentLoaded', () => {
        initApp();
        initUIHandlers();
    });

    async function initApp() {
        bindSportCardClicks();
        handleHashRouting();
        startLiveSecondTicker();

        // 1. INSTANT LOAD: Load cached schedule in 0ms
        const cached = loadLocalScheduleCache();
        if (cached && cached.length > 0) {
            rawApiData = cached;
            groupMatchesBySport();
            updateSportCardPills();
        }

        // 2. Load local dataset in background without blocking UI
        loadLocalDataset().then(() => {
            groupMatchesBySport();
            updateSportCardPills();
            if (currentSportId) {
                renderCategoryMatches(currentSportId);
            }
        });

        // 3. BACKGROUND SYNC: Check live API in background
        syncLiveScheduleInBackground();
    }

    function bindSportCardClicks() {
        if (!sportsGrid) return;
        sportsGrid.querySelectorAll('.sport-card').forEach(card => {
            card.onclick = () => {
                const sportId = card.getAttribute('data-sport-id');
                navigateToCategory(sportId);
            };
        });
    }

    function updateSportCardPills() {
        if (!sportsGrid) return;
        const now = Date.now();
        SPORTS_CONFIG.forEach(sport => {
            const card = sportsGrid.querySelector(`.sport-card[data-sport-id="${sport.id}"]`);
            if (!card) return;
            const matches = matchesBySport[sport.id] || [];
            const liveCount = matches.filter(m => isLive(m, now)).length;
            const totalCount = matches.length;
            const pill = card.querySelector('.sport-card__count-pill');
            if (pill) {
                if (liveCount > 0) {
                    pill.className = 'sport-card__count-pill has-live';
                    pill.innerHTML = `🔴 ${liveCount} LIVE`;
                } else if (totalCount > 0) {
                    pill.className = 'sport-card__count-pill';
                    pill.innerHTML = `${totalCount} Matches`;
                } else {
                    pill.className = 'sport-card__count-pill';
                    pill.innerHTML = `Live HD`;
                }
            }
        });
    }

    /**
     * Load schedule from localStorage (0ms Instant Load)
     */
    function loadLocalScheduleCache() {
        try {
            const raw = localStorage.getItem('crackstreams_schedule_cache');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('LocalStorage read error:', e);
        }
        return null;
    }

    /**
     * Load bundled local dataset fallback
     */
    async function loadLocalDataset() {
        try {
            const res = await fetch(FALLBACK_ENDPOINT);
            if (res.ok) {
                rawApiData = await res.json();
                try {
                    localStorage.setItem('crackstreams_schedule_cache', JSON.stringify(rawApiData));
                } catch (e) {}
            }
        } catch (e) {
            console.error('All schedule sources failed:', e);
            rawApiData = [];
        }
    }

    /**
     * Background Non-Blocking Live Schedule Sync
     * Runs completely in background - NEVER freezes or delays page render
     */
    async function syncLiveScheduleInBackground() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            const res = await fetch(API_ENDPOINT, {
                signal: controller.signal,
                cache: 'default'
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const freshData = await res.json();
                if (Array.isArray(freshData) && freshData.length > 0) {
                    rawApiData = freshData;
                    try {
                        localStorage.setItem('crackstreams_schedule_cache', JSON.stringify(freshData));
                    } catch (e) {}
                    groupMatchesBySport();
                    renderSportCards();
                    if (currentSportId) {
                        renderCategoryMatches(currentSportId);
                    }
                }
            }
        } catch (err) {
            // Silently handled: cached schedule is already active and working
        }
    }

    /**
     * Group API matches into 10 official sports & index by match ID
     */
    function groupMatchesBySport() {
        matchesBySport = {};
        allMatchesById = {};

        SPORTS_CONFIG.forEach(sport => {
            matchesBySport[sport.id] = [];
        });

        if (!Array.isArray(rawApiData)) return;

        const now = Date.now();

        rawApiData.forEach(catGroup => {
            const catName = (catGroup.category_name || '').toLowerCase();
            const schedule = catGroup.schedule || [];

            // Find matching sport config
            const matchedSport = SPORTS_CONFIG.find(s => s.apiKeys.includes(catName));

            schedule.forEach(item => {
                const matchTime = item.date || (item.date_iso ? new Date(item.date_iso).getTime() : 0);
                const matchId = String(item.id || item.match_id || Math.random().toString(36).substr(2, 9));

                const defaultSources = [
                    { name: 'Stream 1 (HD)', url: item.iframeUrl || item.watchUrl || 'https://play.aurasportsplayer.cfd/live' },
                    { name: 'Stream 2 (Backup)', url: item.watchUrl || item.iframeUrl || 'https://play.aurasportsplayer.cfd/live' }
                ];

                const sources = Array.isArray(item.sources) && item.sources.length > 0
                    ? item.sources.map((s, idx) => ({
                        name: s.name || `Stream ${idx + 1}`,
                        url: s.url || item.iframeUrl || item.watchUrl
                    }))
                    : defaultSources;

                const matchObj = {
                    id: matchId,
                    sportId: matchedSport ? matchedSport.id : 'soccer',
                    sportTitle: matchedSport ? matchedSport.title : 'Sports',
                    sportIcon: matchedSport ? matchedSport.icon : (item.league_icon || 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png'),
                    title: item.title || `${item.teams?.away?.name || 'Away Team'} vs ${item.teams?.home?.name || 'Home Team'}`,
                    leagueName: item.league_name || (matchedSport ? matchedSport.title : formatCategoryName(catName)),
                    leagueIcon: item.league_icon || (matchedSport ? matchedSport.icon : ''),
                    homeTeam: item.teams?.home || { name: 'Home Team', badge: '' },
                    awayTeam: item.teams?.away || { name: 'Away Team', badge: '' },
                    dateMs: matchTime,
                    dateIso: item.date_iso || new Date(matchTime).toISOString(),
                    status: item.status || 'scheduled',
                    sources: sources,
                    iframeUrl: item.iframeUrl || sources[0].url,
                    watchUrl: item.watchUrl || sources[0].url
                };

                allMatchesById[matchId] = matchObj;

                if (matchedSport) {
                    matchesBySport[matchedSport.id].push(matchObj);
                }
            });
        });

        // Sort each sport's matches
        Object.keys(matchesBySport).forEach(sportId => {
            matchesBySport[sportId].sort((a, b) => {
                const aLive = isLive(a, now);
                const bLive = isLive(b, now);
                if (aLive && !bLive) return -1;
                if (!aLive && bLive) return 1;
                return a.dateMs - b.dateMs;
            });
        });
    }

    function isLive(match, now) {
        if (!now) now = Date.now();
        if (match.status === 'live') return true;
        const start = match.dateMs;
        const end = start + (3.5 * 60 * 60 * 1000);
        return now >= start && now <= end;
    }

    function isEnded(match, now) {
        if (!now) now = Date.now();
        if (match.status === 'finished') return true;
        return now > (match.dateMs + 3.5 * 3600000);
    }

    function formatCategoryName(cat) {
        return cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Real-time Countdown Calculator
     * Returns exact days, hours, minutes, seconds ticking down
     */
    function getLiveCountdown(targetMs, now) {
        if (!now) now = Date.now();
        const diff = targetMs - now;

        if (diff <= 0) {
            if (now <= targetMs + (3.5 * 3600000)) {
                return { isLive: true, text: 'LIVE NOW' };
            } else {
                return { isEnded: true, text: 'Match Ended' };
            }
        }

        const totalSeconds = Math.floor(diff / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        let timeStr = '';
        if (days > 0) {
            timeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        } else if (hours > 0) {
            timeStr = `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            timeStr = `${minutes}m ${seconds}s`;
        } else {
            timeStr = `${seconds}s`;
        }

        return { isUpcoming: true, text: timeStr };
    }

    /**
     * Start live 1-second countdown ticker
     * Ticks second-by-second in real time
     */
    function startLiveSecondTicker() {
        if (liveTickerTimer) clearInterval(liveTickerTimer);

        liveTickerTimer = setInterval(() => {
            const now = Date.now();

            // Update all category match list countdown badges
            document.querySelectorAll('.match-countdown-val').forEach(el => {
                const targetMs = parseInt(el.getAttribute('data-target'), 10);
                if (targetMs) {
                    const c = getLiveCountdown(targetMs, now);
                    if (c.isLive) {
                        el.textContent = 'LIVE NOW';
                        const parentBadge = el.closest('.match-row-card__countdown-badge');
                        if (parentBadge && !parentBadge.classList.contains('is-live')) {
                            parentBadge.classList.add('is-live');
                        }
                    } else if (c.isEnded) {
                        el.textContent = 'Match Ended';
                    } else {
                        el.textContent = c.text;
                    }
                }
            });

            // Update player countdown if active
            if (currentMatchId && allMatchesById[currentMatchId] && playerCountdown) {
                const currentMatch = allMatchesById[currentMatchId];
                const c = getLiveCountdown(currentMatch.dateMs, now);
                if (c.isLive) {
                    playerCountdown.textContent = 'LIVE NOW';
                    playerCountdown.classList.add('is-live');
                } else if (c.isEnded) {
                    playerCountdown.textContent = '(Match Ended)';
                    playerCountdown.classList.remove('is-live');
                } else {
                    playerCountdown.textContent = `(${c.text})`;
                    playerCountdown.classList.remove('is-live');
                }
            }
        }, 1000);
    }

    /**
     * Render the 10 Sport Category Cards on Homepage
     */
    function renderSportCards() {
        if (!sportsGrid) return;

        const query = homeSearchQuery.trim().toLowerCase();
        if (!query && sportsGrid.querySelectorAll('.sport-card').length >= SPORTS_CONFIG.length) {
            updateSportCardPills();
            positionHomeAd();
            return;
        }

        let html = '';

        SPORTS_CONFIG.forEach(sport => {
            const matches = matchesBySport[sport.id] || [];

            // Search filter
            if (query) {
                const matchesSearch = matches.some(m =>
                    `${m.title} ${m.leagueName} ${m.homeTeam.name} ${m.awayTeam.name}`.toLowerCase().includes(query)
                );
                const titleSearch = sport.title.toLowerCase().includes(query);
                if (!matchesSearch && !titleSearch) return;
            }

            const totalCount = matches.length;
            const liveCount = matches.filter(m => isLive(m, now)).length;

            let pillHtml = '';
            if (liveCount > 0) {
                pillHtml = `<span class="sport-card__count-pill has-live">🔴 ${liveCount} LIVE</span>`;
            } else if (totalCount > 0) {
                pillHtml = `<span class="sport-card__count-pill">${totalCount} Matches</span>`;
            } else {
                pillHtml = `<span class="sport-card__count-pill" style="opacity:0.6;">0 Scheduled</span>`;
            }

            html += `
                <div class="sport-card" data-sport-id="${sport.id}" role="button" tabindex="0">
                    <div class="sport-card__icon-box">
                        <img src="${sport.icon}" alt="${sport.title} Streams" loading="lazy" onerror="this.src='https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png'" />
                    </div>
                    <div class="sport-card__info">
                        <div class="sport-card__title-row">
                            <h2 class="sport-card__title">${sport.title}</h2>
                            ${pillHtml}
                        </div>
                        <h3 class="sport-card__subtitle">${sport.subtitle}</h3>
                        <p class="sport-card__desc">${sport.desc}</p>
                    </div>
                    <svg class="sport-card__arrow" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            `;
        });

        sportsGrid.innerHTML = html;
        positionHomeAd();

        // When any category card is clicked -> Open that category match list
        sportsGrid.querySelectorAll('.sport-card').forEach(card => {
            card.addEventListener('click', () => {
                const sportId = card.getAttribute('data-sport-id');
                navigateToCategory(sportId);
            });
        });
    }

    /**
     * Navigate inside a Sport Category
     */
    function navigateToCategory(sportId) {
        const sport = SPORTS_CONFIG.find(s => s.id === sportId) || SPORTS_CONFIG[0];
        currentSportId = sport.id;
        currentMatchId = null;
        window.location.hash = `category-${sport.id}`;

        // Stop any running video iframe
        if (streamIframe) streamIframe.src = '';

        // Update Heading
        if (catHeadingText) {
            catHeadingText.textContent = `Watch ${sport.title} Games Live`;
        }

        // Reset Category Filters
        categoryFilterState = 'all';
        categorySearchQuery = '';
        if (catSearchInput) catSearchInput.value = '';
        document.querySelectorAll('.btn-filter-pill').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === 'all');
        });

        // Render horizontal match cards
        renderCategoryMatches(sport.id);

        // Switch View
        document.body.classList.remove('in-player-mode');
        if (homeView) homeView.style.display = 'none';
        if (playerView) playerView.classList.remove('active');
        if (categoryView) {
            categoryView.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (liveCoverageBadge) liveCoverageBadge.style.display = 'none';
    }

    /**
     * Render matches inside the category list (Exact match with screenshot media_1793201646533_6e452f98.png)
     */
    function renderCategoryMatches(sportId) {
        if (!categoryMatchesList) return;

        let matches = matchesBySport[sportId] || [];
        const now = Date.now();

        // Apply Search Filter inside Category
        const query = categorySearchQuery.trim().toLowerCase();
        if (query) {
            matches = matches.filter(m =>
                `${m.title} ${m.leagueName} ${m.homeTeam.name} ${m.awayTeam.name}`.toLowerCase().includes(query)
            );
        }

        // Apply Tab Filter (All, Live, Upcoming)
        if (categoryFilterState === 'live') {
            matches = matches.filter(m => isLive(m, now));
        } else if (categoryFilterState === 'upcoming') {
            matches = matches.filter(m => !isLive(m, now) && !isEnded(m, now));
        }

        if (matches.length === 0) {
            const sport = SPORTS_CONFIG.find(s => s.id === sportId);
            const sportName = sport ? sport.title : 'Sport';
            categoryMatchesList.innerHTML = `
                <div style="text-align: center; padding: 48px 20px; background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; color: #ffffff;">
                    <p style="font-size: 18px; font-weight: 700; margin-bottom: 6px;">No ${categoryFilterState === 'live' ? 'Live' : ''} ${sportName} Matches Currently Scheduled</p>
                    <p style="font-size: 13.5px; color: #94a3b8; max-width: 500px; margin: 0 auto;">Live streams and video links update 1 hour before scheduled start time. Check back shortly or join our Discord server for game alerts.</p>
                </div>
            `;
            return;
        }

        let listHtml = '';
        matches.forEach(match => {
            const live = isLive(match, now);
            const dateObj = new Date(match.dateMs);

            // Date format: "Thu, Oct 29, 05:00 AM" (matching screenshot media_1793201646533_6e452f98.png)
            const dateFormatted = dateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            }) + ', ' + dateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Countdown ticker calculation
            const countdown = getLiveCountdown(match.dateMs, now);

            let countdownPillHtml = '';
            if (live || countdown.isLive) {
                countdownPillHtml = `
                    <span class="match-row-card__countdown-badge is-live">
                        <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                        <span class="match-countdown-val" data-target="${match.dateMs}">LIVE NOW</span>
                    </span>
                `;
            } else if (countdown.isEnded) {
                countdownPillHtml = `
                    <span class="match-row-card__countdown-badge">
                        <span class="match-countdown-val" data-target="${match.dateMs}">Match Ended</span>
                    </span>
                `;
            } else {
                countdownPillHtml = `
                    <span class="match-row-card__countdown-badge">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        <span class="match-countdown-val" data-target="${match.dateMs}">${countdown.text}</span>
                    </span>
                `;
            }

            const iconSrc = match.leagueIcon || match.sportIcon || 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png';

            listHtml += `
                <article class="match-row-card" data-match-id="${match.id}" role="button" tabindex="0">
                    <div class="match-row-card__left">
                        <div class="match-row-card__icon-box">
                            <img src="${iconSrc}" alt="${escapeHtml(match.leagueName)}" loading="lazy" onerror="this.src='https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png'" />
                        </div>
                        <div class="match-row-card__body">
                            <h3 class="match-row-card__title" title="${escapeHtml(match.title)}">${escapeHtml(match.title)}</h3>
                            <div class="match-row-card__date">${dateFormatted}</div>
                            <div class="match-row-card__meta">
                                <span class="match-row-card__cat">${escapeHtml(match.sportTitle)}</span>
                                ${countdownPillHtml}
                            </div>
                        </div>
                    </div>
                    <button type="button" class="match-row-card__btn" data-match-id="${match.id}" aria-label="Watch ${escapeHtml(match.title)}">
                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        <span>Watch Stream</span>
                    </button>
                </article>
            `;
        });

        categoryMatchesList.innerHTML = listHtml;

        // When any match card or "Watch Stream" button is clicked -> Open Match Player!
        categoryMatchesList.querySelectorAll('.match-row-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const matchId = card.getAttribute('data-match-id');
                openMatchPlayer(matchId);
            });
        });
    }

    /**
     * Open Dedicated Match Player View (Matching screenshot media_1793201979784_dde72c0b.png)
     */
    function openMatchPlayer(matchId) {
        // Trigger popunder ad on match / player click (kept off homepage)
        loadPopunder();

        const match = allMatchesById[matchId];
        if (!match) {
            console.error('Match not found:', matchId);
            return;
        }

        currentMatchId = matchId;
        window.location.hash = `match-${matchId}`;
        if (liveCoverageBadge) liveCoverageBadge.style.display = 'none';

        // Populate Player Header
        if (playerSportIcon) {
            playerSportIcon.src = match.leagueIcon || match.sportIcon || 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png';
        }
        if (playerMatchTitle) {
            playerMatchTitle.textContent = match.title;
        }
        if (playerSportBadge) {
            playerSportBadge.textContent = match.sportTitle;
        }

        // Date format: "Oct 29, 04:00 AM" (compact single line)
        const dateObj = new Date(match.dateMs);
        const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
        const day = dateObj.getDate();
        const timeFormatted = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dateFormatted = `${monthShort} ${day}, ${timeFormatted}`;

        if (playerKickoffTime) {
            playerKickoffTime.textContent = dateFormatted;
        }

        // Live countdown calculation
        const now = Date.now();
        const countdown = getLiveCountdown(match.dateMs, now);
        if (playerCountdown) {
            if (countdown.isLive) {
                playerCountdown.textContent = 'LIVE NOW';
                playerCountdown.classList.add('is-live');
            } else if (countdown.isEnded) {
                playerCountdown.textContent = '(Match Ended)';
                playerCountdown.classList.remove('is-live');
            } else {
                playerCountdown.textContent = `(${countdown.text})`;
                playerCountdown.classList.remove('is-live');
            }
        }

        // Load stream into iframe
        const initialStreamUrl = match.sources[0]?.url || match.iframeUrl || match.watchUrl;
        if (streamIframe) {
            streamIframe.src = initialStreamUrl;
        }

        // Render stream source switcher buttons (matching screenshot)
        if (playerSourcesList) {
            let sourcesHtml = '';
            match.sources.forEach((source, index) => {
                const isActive = index === 0 ? 'active' : '';
                let serverLabel = source.name || `Server ${index + 1}`;
                if (!serverLabel.toLowerCase().startsWith('server')) {
                    serverLabel = `Server ${index + 1}: ${match.sportTitle} (HD • English)`;
                } else if (!serverLabel.includes(':')) {
                    serverLabel = `${serverLabel}: ${match.sportTitle} (HD • English)`;
                }

                sourcesHtml += `
                    <button type="button" class="btn-server-pill ${isActive}" data-src-url="${escapeHtml(source.url)}">
                        <span class="dot-green"></span>
                        <span>${escapeHtml(serverLabel)}</span>
                    </button>
                `;
            });
            playerSourcesList.innerHTML = sourcesHtml;

            // Switch stream source on button click
            playerSourcesList.querySelectorAll('.btn-server-pill').forEach(btn => {
                btn.addEventListener('click', () => {
                    playerSourcesList.querySelectorAll('.btn-server-pill').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const newUrl = btn.getAttribute('data-src-url');
                    if (streamIframe) {
                        streamIframe.src = newUrl;
                    }
                    showToast(`Switched to ${btn.textContent.trim()}`);
                });
            });
        }

        // Switch View: Show Player, Hide Home and Category
        document.body.classList.add('in-player-mode');
        if (homeView) homeView.style.display = 'none';
        if (categoryView) categoryView.classList.remove('active');
        if (playerView) {
            playerView.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * Return back to Home Cards
     */
    function navigateToHome() {
        document.body.classList.remove('in-player-mode');
        currentSportId = null;
        currentMatchId = null;
        if (window.location.hash) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        // Stop video iframe
        if (streamIframe) streamIframe.src = '';

        if (categoryView) categoryView.classList.remove('active');
        if (playerView) playerView.classList.remove('active');
        if (homeView) {
            homeView.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (liveCoverageBadge) liveCoverageBadge.style.display = '';
    }

    /**
     * Return from Player back to current Category matches
     */
    function backToCategoryMatches() {
        document.body.classList.remove('in-player-mode');
        if (currentMatchId && allMatchesById[currentMatchId]) {
            const match = allMatchesById[currentMatchId];
            navigateToCategory(match.sportId);
        } else if (currentSportId) {
            navigateToCategory(currentSportId);
        } else {
            navigateToCategory('nhl');
        }
    }

    /**
     * URL Hash Routing
     */
    function handleHashRouting() {
        const hash = window.location.hash.replace('#', '');
        if (hash.startsWith('match-')) {
            const matchId = hash.replace('match-', '');
            openMatchPlayer(matchId);
        } else if (hash.startsWith('category-')) {
            const sportId = hash.replace('category-', '');
            navigateToCategory(sportId);
        } else {
            navigateToHome();
        }
    }

    window.addEventListener('hashchange', handleHashRouting);

    function renderLoading() {
        if (!sportsGrid) return;
        sportsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                <div style="width: 44px; height: 44px; border: 3px solid rgba(0, 229, 153, 0.2); border-top-color: var(--accent-emerald); border-radius: 50%; margin: 0 auto 16px; animation: spin 0.8s linear infinite;"></div>
                <p style="font-weight: 700; color: #ffffff;">Loading sports categories & live streams...</p>
                <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Syncing NFL, NBA, Soccer, MLB, NHL, and CFB from live API</p>
            </div>
        `;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function initUIHandlers() {
        // Homepage Search Bar
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                homeSearchQuery = e.target.value;
                if (currentSportId || currentMatchId) {
                    navigateToHome();
                }
                renderSportCards();
            });
        }

        // Category Search Bar
        if (catSearchInput) {
            catSearchInput.addEventListener('input', (e) => {
                categorySearchQuery = e.target.value;
                if (currentSportId) {
                    renderCategoryMatches(currentSportId);
                }
            });
        }

        // Category Filter Pills (All Games, Live Now, Upcoming)
        document.querySelectorAll('.btn-filter-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-filter-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                categoryFilterState = btn.getAttribute('data-filter') || 'all';
                if (currentSportId) {
                    renderCategoryMatches(currentSportId);
                }
            });
        });

        // Category Back Button
        if (btnBackToHome) {
            btnBackToHome.addEventListener('click', navigateToHome);
        }

        // Player Back to Matches Button
        if (btnPlayerBackMatches) {
            btnPlayerBackMatches.addEventListener('click', backToCategoryMatches);
        }

        // Player Back to Home Button
        if (btnPlayerBackHome) {
            btnPlayerBackHome.addEventListener('click', navigateToHome);
        }

        // Logo brand click -> Go Home
        document.querySelectorAll('.brand, .nav-link[href="#home"]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                navigateToHome();
            });
        });

        // Mobile Drawer
        const mobileToggle = document.getElementById('mobile-toggle');
        const mobileClose = document.getElementById('mobile-close');
        const mobileDrawer = document.getElementById('mobile-drawer');
        const drawerOverlay = document.getElementById('drawer-overlay');

        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                if (mobileDrawer) mobileDrawer.classList.add('active');
                if (drawerOverlay) drawerOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        function closeDrawer() {
            if (mobileDrawer) mobileDrawer.classList.remove('active');
            if (drawerOverlay) drawerOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        if (mobileClose) mobileClose.addEventListener('click', closeDrawer);
        if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
        document.querySelectorAll('.drawer__link').forEach(link => {
            link.addEventListener('click', closeDrawer);
        });

        // FAQ Accordion
        document.querySelectorAll('.faq-item').forEach(item => {
            const questionBtn = item.querySelector('.faq-question');
            if (questionBtn) {
                questionBtn.addEventListener('click', () => {
                    const isOpen = item.classList.contains('open');
                    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
                    if (!isOpen) item.classList.add('open');
                });
            }
        });

        // Bookmark Guide Button
        const bookmarkBtn = document.getElementById('save-how-btn');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => {
                const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                const shortcut = isMac ? 'Cmd + D' : 'Ctrl + D';
                showToast(`Press ${shortcut} on your keyboard to bookmark CrackStreams!`);
            });
        }

        // Share Bar / Copy Link
        const shareCopyBtn = document.getElementById('share-copy-btn');
        if (shareCopyBtn) {
            shareCopyBtn.addEventListener('click', () => {
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href).then(() => {
                        showToast('Website link copied to clipboard!');
                    });
                } else {
                    showToast('Link copied: ' + window.location.href);
                }
            });
        }
    }

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

})();

    /**
     * Load Popunder script exclusively when a user views a match / player
     * (Strictly removed from homepage)
     */
    function loadPopunder() {
        if (document.getElementById('popunder-script')) return;
        const s = document.createElement('script');
        s.id = 'popunder-script';
        s.setAttribute('data-cfasync', 'false');
        s.src = 'https://capitalhospitals.org/1/00075875b9bf0ce94f31a8b190fe8e24';
        document.head.appendChild(s);
    }

    /**
     * Position Homepage Responsive Native Banner Ad:
     * - Always positioned at the end of all sports cards
     */
    function positionHomeAd() {
        const adEl = document.getElementById('home-responsive-ad');
        const grid = document.getElementById('sports-grid');
        if (!adEl || !grid) return;

        grid.after(adEl);
    }

    window.addEventListener('resize', positionHomeAd);
