const toggle = document.getElementById('themeToggle');
const appsGrid = document.getElementById('appsGrid');
const appList = document.getElementById('appList');
const appMenuToggle = document.getElementById('appMenuToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const storedTheme = localStorage.getItem('portfolio-theme');

let appsData = [];
let currentSlideIndex = 0;
let wheelLocked = false;
let touchStartY = 0;
let touchStartX = 0;
let touchLocked = false;

const setTheme = (isDark) => {
  document.documentElement.classList.toggle('dark', isDark);
  document.body.classList.toggle('dark', isDark);
  toggle.setAttribute('aria-pressed', String(isDark));
  toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  toggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  localStorage.setItem('portfolio-theme', isDark ? 'dark' : 'light');
};

const createText = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
};

const createIcon = (pathData, label) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  svg.setAttribute('class', 'icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  path.setAttribute('d', pathData);

  if (label) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);
  } else {
    svg.setAttribute('aria-hidden', 'true');
  }

  svg.append(path);
  return svg;
};

const createFallbackImageUrl = (app, index) => {
  const seed = encodeURIComponent(`${app.title || 'app'}-${index + 1}`);
  return `https://picsum.photos/seed/${seed}/900/1100`;
};

const getAppImageUrl = (app, index) => {
  if (app.imageLoadFailed) return '';
  return app.loadedImage || app.image || createFallbackImageUrl(app, index);
};

const loadImage = (src) => new Promise((resolve, reject) => {
  if (!src) {
    reject(new Error('Missing image source'));
    return;
  }

  const image = new Image();
  image.onload = () => resolve(src);
  image.onerror = () => reject(new Error(`Could not load image: ${src}`));
  image.src = src;
});

const preloadAppImage = async (app, index) => {
  const fallbackUrl = createFallbackImageUrl(app, index);
  const primaryUrl = app.image || fallbackUrl;

  try {
    app.loadedImage = await loadImage(primaryUrl);
  } catch (error) {
    if (primaryUrl !== fallbackUrl) {
      try {
        app.loadedImage = await loadImage(fallbackUrl);
      } catch (fallbackError) {
        console.warn(fallbackError);
        app.imageLoadFailed = true;
      }
      return;
    }

    console.warn(error);
    app.imageLoadFailed = true;
  }
};

const preloadAppImages = async (apps) => {
  await Promise.all(apps.map((app, index) => preloadAppImage(app, index)));
};

const renderLoadingState = () => {
  appsGrid.replaceChildren();
  const loading = document.createElement('section');
  loading.className = 'hero';
  loading.append(
    createText('h1', '', 'Loading previews.'),
    createText('p', 'loading-copy', 'Preparing images before the experience starts.')
  );
  appsGrid.append(loading);
};

const warmBrowserCache = (apps) => {
  apps.forEach((app, index) => {
    if (!getAppImageUrl(app, index)) return;
    const image = new Image();
    image.src = getAppImageUrl(app, index);
  });
};

const createAppMedia = (app, index) => {
  const media = document.createElement('div');
  media.className = 'app-media';
  const imageUrl = getAppImageUrl(app, index);

  if (!imageUrl) {
    media.classList.add('app-media-empty');
    media.textContent = (app.title || 'App').trim().slice(0, 2).toUpperCase();
    return media;
  }

  const image = document.createElement('img');
  image.src = imageUrl;
  image.alt = app.imageAlt || `${app.title || 'App'} preview`;
  image.loading = 'eager';
  image.decoding = 'async';
  media.append(image);
  return media;
};

const setActiveSlide = () => {
  appList.querySelectorAll('.app-list-item').forEach((item, index) => {
    item.classList.toggle('active', index === currentSlideIndex);
  });
};

const createIntroSlide = () => {
  const section = document.createElement('section');
  section.className = 'hero';
  section.setAttribute('aria-labelledby', 'hero-title');

  const title = createText('h1', '', 'Small apps, built with care.');
  title.id = 'hero-title';

  const copy = document.createElement('div');
  copy.className = 'hero-copy';
  copy.append(createText(
    'p',
    '',
    'A concise collection of browser tools and experiments. Each project is kept simple: one job, fast to open, easy to understand.'
  ));

  const links = document.createElement('div');
  links.className = 'hero-links';
  links.setAttribute('aria-label', 'Page actions');

  const startButton = document.createElement('button');
  startButton.className = 'button';
  startButton.type = 'button';
  startButton.append(createText('span', '', 'View work'), createIcon('M12 5v14M5 12l7 7 7-7'));
  startButton.addEventListener('click', () => goToSlide(1));

  const contact = document.createElement('a');
  contact.className = 'button secondary';
  contact.href = 'mailto:nguyenminhnh4t@gmail.com';
  contact.append(createIcon('M4 6h16v12H4V6Zm0 1 8 6 8-6'), createText('span', '', 'Contact'));

  links.append(startButton, contact);
  copy.append(links);
  section.append(title, copy);
  return section;
};

const renderCurrentSlide = () => {
  appsGrid.replaceChildren();

  if (currentSlideIndex === 0) {
    appsGrid.append(createIntroSlide());
    setActiveSlide();
    return;
  }

  if (!Array.isArray(appsData) || appsData.length === 0) {
    appsGrid.append(createText('p', 'empty', 'No projects are listed yet.'));
    return;
  }

  const appIndex = currentSlideIndex - 1;
  const app = appsData[appIndex];
  const section = document.createElement('article');
  section.className = 'app-section';

  const meta = createText(
    'span',
    'app-index',
    `Project ${String(appIndex + 1).padStart(2, '0')} / ${String(appsData.length).padStart(2, '0')}`
  );
  const title = createText('h3', '', app.title || 'Untitled project');
  const description = createText('p', '', app.description || 'A small web project.');
  const link = document.createElement('a');
  link.className = 'app-link';
  link.href = app.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.append(createText('span', '', app.label || 'Open project'), createIcon('M7 17 17 7M9 7h8v8'));

  const content = document.createElement('div');
  content.className = 'app-detail';
  content.append(meta, title, description, link);

  section.append(createAppMedia(app, appIndex), content);
  appsGrid.append(section);
  setActiveSlide();
};

const goToSlide = (index) => {
  const total = appsData.length + 1;
  if (!total) return;
  currentSlideIndex = Math.max(0, Math.min(index, total - 1));
  renderCurrentSlide();
  setAppMenuOpen(false);
};

const setAppMenuOpen = (isOpen) => {
  appMenuToggle.setAttribute('aria-expanded', String(isOpen));
  appMenuToggle.closest('.app-sidebar').classList.toggle('open', isOpen);
};

const createListItem = (label, index) => {
  const button = document.createElement('button');
  button.className = 'app-list-item';
  button.type = 'button';
  button.append(
    createText('span', 'app-list-marker', ''),
    createText('span', 'app-list-name', label)
  );
  button.addEventListener('click', () => goToSlide(index));
  return button;
};

const renderAppList = () => {
  appList.replaceChildren();

  const fragment = document.createDocumentFragment();
  fragment.append(createListItem('Home', 0));
  appsData.forEach((app, index) => {
    fragment.append(createListItem(app.title || 'Untitled project', index + 1));
  });
  appList.append(fragment);
};

const handleWheel = (event) => {
  if (appsData.length === 0) return;
  event.preventDefault();

  if (wheelLocked || Math.abs(event.deltaY) < 12) return;
  wheelLocked = true;
  goToSlide(currentSlideIndex + (event.deltaY > 0 ? 1 : -1));

  window.setTimeout(() => {
    wheelLocked = false;
  }, 520);
};

const handleTouchStart = (event) => {
  if (!event.touches.length) return;
  touchStartY = event.touches[0].clientY;
  touchStartX = event.touches[0].clientX;
  touchLocked = false;
};

const handleTouchMove = (event) => {
  if (appsData.length === 0 || !event.touches.length || touchLocked) return;
  if (event.target.closest('.app-sidebar')) return;

  const currentY = event.touches[0].clientY;
  const currentX = event.touches[0].clientX;
  const deltaY = touchStartY - currentY;
  const deltaX = touchStartX - currentX;

  if (Math.abs(deltaY) < 42 || Math.abs(deltaY) < Math.abs(deltaX)) return;

  event.preventDefault();
  touchLocked = true;
  goToSlide(currentSlideIndex + (deltaY > 0 ? 1 : -1));
};

const loadApps = async () => {
  try {
    const response = await fetch('apps.json');
    if (!response.ok) throw new Error('Could not load apps.json');
    appsData = await response.json();
    currentSlideIndex = 0;
    renderLoadingState();
    await preloadAppImages(appsData);
    warmBrowserCache(appsData);
    renderAppList();
    renderCurrentSlide();
  } catch (error) {
    appsGrid.replaceChildren(createText('p', 'error', 'Unable to load the project list.'));
    console.error(error);
  }
};

setTheme(storedTheme ? storedTheme === 'dark' : prefersDark);
toggle.addEventListener('click', () => {
  setTheme(!document.body.classList.contains('dark'));
});
appMenuToggle.addEventListener('click', () => {
  setAppMenuOpen(appMenuToggle.getAttribute('aria-expanded') !== 'true');
});
window.addEventListener('wheel', handleWheel, { passive: false });
window.addEventListener('touchstart', handleTouchStart, { passive: true });
window.addEventListener('touchmove', handleTouchMove, { passive: false });
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setAppMenuOpen(false);
  if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') goToSlide(currentSlideIndex - 1);
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') goToSlide(currentSlideIndex + 1);
});
loadApps();
