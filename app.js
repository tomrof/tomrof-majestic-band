document.documentElement.classList.add('js');
const $ = (selector) => document.querySelector(selector);
const content = window.TOMROF_CONTENT;
const menu = $('#menu-toggle');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  $('#navigation').classList.toggle('open', open);
});

const soundButton = $('#nav-sound');
const AudioContext = window.AudioContext || window.webkitAudioContext;
let soundEnabled = false;
let audioContext;
const recordings = {
  mail: './son-courrier.mp3',
  cash: './son-caisse.mp3',
};
const soundBuffers = new Map();

function loadRecording(effect) {
  if (!soundBuffers.has(effect)) {
    const decoded = fetch(recordings[effect]).then(response => {
      if (!response.ok) throw new Error('Effet sonore indisponible');
      return response.arrayBuffer();
    }).then(bytes => audioContext.decodeAudioData(bytes)).catch(error => {
      soundBuffers.delete(effect);
      throw error;
    });
    soundBuffers.set(effect, decoded);
  }
  return soundBuffers.get(effect);
}

async function playSiteSound(effect, frequency) {
  audioContext ||= new AudioContext();
  if (audioContext.state !== 'running') await audioContext.resume();
  if (!soundEnabled) return;

  const start = audioContext.currentTime;
  if (effect === 'jack') {
    ring(55, start, 0.145, 'sawtooth', 0.065);
    ring(110, start + 0.006, 0.10, 'square', 0.025);
    ring(380, start, 0.03, 'triangle', 0.045);
    return;
  }
  if (effect in recordings) {
    const buffer = await loadRecording(effect);
    if (!soundEnabled || audioContext.state !== 'running') return;
    const source = audioContext.createBufferSource();
    const volume = audioContext.createGain();
    source.buffer = buffer;
    volume.gain.value = 0.45;
    source.connect(volume).connect(audioContext.destination);
    source.start();
    return;
  }
  ring(frequency, start, 0.19, 'triangle', 0.10);
}

function ring(frequency, start, duration, type, peak) {
  const note = audioContext.createOscillator();
  const volume = audioContext.createGain();
  note.type = type;
  note.frequency.value = frequency;
  volume.gain.setValueAtTime(0.001, start);
  volume.gain.exponentialRampToValueAtTime(peak, start + 0.008);
  volume.gain.exponentialRampToValueAtTime(0.001, start + duration - 0.01);
  note.connect(volume).connect(audioContext.destination);
  note.start(start);
  note.stop(start + duration);
}

if (AudioContext) {
  soundButton.hidden = false;
  syncSoundButton();
  soundButton.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    if (soundEnabled) {
      audioContext ||= new AudioContext();
      audioContext.resume().then(syncSoundButton).catch(() => {});
      for (const effect of Object.keys(recordings)) loadRecording(effect).catch(() => {});
    }
    syncSoundButton();
  });
}

const menuNotes = {
  '#musique': 329.63,
  '#groupe': 392,
  '#concerts': 440,
  '#actualites': 493.88,
  '#boutique': 587.33,
};

$('#navigation').addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (link) {
    menu.setAttribute('aria-expanded', 'false');
    $('#navigation').classList.remove('open');
  }
});

function syncSoundButton() {
  soundButton.textContent = soundEnabled && audioContext?.state === 'running'
    ? 'Sons du site · activés'
    : 'Activer les sons du site';
}

function bindSound(target, effect, frequency) {
  const play = () => {
    if (soundEnabled && audioContext?.state === 'running') {
      playSiteSound(effect, frequency).catch(() => {});
    }
  };
  target.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') play();
  });
  target.addEventListener('click', event => {
    if (event.pointerType === 'touch') play();
  });
}

if (AudioContext) {
  bindSound(menu, 'jack');
  document.querySelectorAll('#navigation a').forEach(link => {
    bindSound(link, 'note', menuNotes[link.getAttribute('href')]);
  });
  const mail = document.querySelector('#boutique .order-steps a.button[href^="mailto:"]');
  if (mail) bindSound(mail, 'mail');
  document.querySelectorAll('#boutique .paypal-button').forEach(link => bindSound(link, 'cash'));
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    menu.setAttribute('aria-expanded', 'false'); $('#navigation').classList.remove('open'); menu.focus();
  }
});
function notify(message) {
  $('#toast').textContent = message; $('#toast').hidden = false;
  clearTimeout(notify.timer); notify.timer = setTimeout(() => { $('#toast').hidden = true; }, 5000);
}
$('#clip-title').textContent = content.clipTitle;
$('#play-video').addEventListener('click', () => {
  if (!navigator.onLine) { notify('Le clip nécessite une connexion Internet.'); return; }
  const frame = document.createElement('iframe');
  frame.src = 'https://www.youtube-nocookie.com/embed/rx2P3r-QR80?autoplay=1';
  frame.title = `${content.clipTitle} — lecteur YouTube`;
  frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
  frame.allowFullscreen = true; frame.referrerPolicy = 'strict-origin-when-cross-origin';
  $('#video-stage').replaceChildren(frame); frame.focus();
});
$('#share').addEventListener('click', async () => {
  try {
    if (navigator.share) await navigator.share({title: `${content.clipTitle} — Tomrof and the Majestic Band`, url: 'https://youtu.be/rx2P3r-QR80'});
    else if (navigator.clipboard) { await navigator.clipboard.writeText('https://youtu.be/rx2P3r-QR80'); notify('Lien du clip copié.'); }
    else notify('Copiez le lien depuis le bouton « Ouvrir sur YouTube ».');
  } catch (error) { if (error.name !== 'AbortError') notify('Utilisez le lien « Ouvrir sur YouTube » pour partager le clip.'); }
});
// Textes insérés sans HTML pour garder la configuration éditoriale sûre.
function textElement(tag, text) { const element = document.createElement(tag); element.textContent = text; return element; }
function renderList(selector, entries, fields) {
  if (!entries.length) return;
  const fragment = document.createDocumentFragment();
  entries.forEach((item) => {
    const article = document.createElement('article'); article.className = 'content-item';
    let textContainer = article;
    if (selector === '#musicians' && item.photo) {
      const photo = document.createElement('img');
      photo.src = item.photo; photo.alt = item.photoAlt || item.name;
      photo.className = 'musician-photo'; photo.loading = 'lazy'; photo.decoding = 'async';
      if (item.photoCredit) {
        const figure = document.createElement('figure');
        figure.className = 'musician-portrait';
        const credit = textElement('figcaption', `Photo : ${item.photoCredit}`);
        figure.append(photo, credit);
        article.append(figure);
      } else {
        article.append(photo);
      }
      article.classList.add('with-photo');
      textContainer = document.createElement('div'); textContainer.className = 'musician-text';
      article.append(textContainer);
    }
    fields.forEach(([tag, key]) => { if (item[key]) textContainer.append(textElement(tag, item[key])); });
    fragment.append(article);
  });
  $(selector).replaceChildren(fragment);
}
renderList('#musicians', content.musicians, [['h3','name'], ['p','instrument'], ['p','bio']]);
renderList('#concert-list', content.concerts, [['p','date'], ['h3','venue'], ['p','city'], ['p','details']]);
renderList('#news-list', content.news, [['p','date'], ['h3','title'], ['p','body']]);
if (content.socials.length) {
  const links = content.socials.flatMap((social) => {
    try {
      const url = new URL(social.url); if (url.protocol !== 'https:') return [];
      const a = textElement('a', `${social.label} ↗`); a.href = url.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.className = 'social-link'; return [a];
    } catch { return []; }
  });
  if (links.length) $('#social-links').replaceChildren(...links);
}
let installPrompt;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault(); installPrompt = event; $('#install').hidden = false;
});
$('#install').addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt(); await installPrompt.userChoice;
  installPrompt = null; $('#install').hidden = true;
});
window.addEventListener('appinstalled', () => { $('#install').hidden = true; notify('Application installée. À bientôt !'); });
function connectionStatus() {
  $('#app-status').textContent = navigator.onLine ? 'Les vidéos nécessitent une connexion Internet.' : 'Hors connexion : les pages déjà enregistrées restent accessibles. Les vidéos sont indisponibles.';
}
connectionStatus(); window.addEventListener('online', connectionStatus); window.addEventListener('offline', connectionStatus);
if ('serviceWorker' in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return; reloading = true; window.location.reload();
  });
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      const offerUpdate = () => {
        if (!registration.waiting || !navigator.serviceWorker.controller) return;
        $('#update-app').hidden = false;
        $('#update-app').onclick = () => registration.waiting?.postMessage('SKIP_WAITING');
      };
      offerUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed') offerUpdate(); });
      });
    } catch { $('#app-status').textContent = 'Le mode hors connexion n’a pas pu être activé. Le site reste utilisable en ligne.'; }
  });
}
