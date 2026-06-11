const toggle = document.getElementById('themeToggle');
const themeLabel = toggle.querySelector('.theme-label');
const appsGrid = document.getElementById('appsGrid');
const appList = document.getElementById('appList');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const storedTheme = localStorage.getItem('portfolio-theme');

let appsData = [];
let currentSlideIndex = 0;
let wheelLocked = false;

const setTheme = (isDark) => {
  document.documentElement.classList.toggle('dark', isDark);
  document.body.classList.toggle('dark', isDark);
  themeLabel.textContent = isDark ? 'Light' : 'Dark';
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

const createAppMedia = (app) => {
  const media = document.createElement('div');
  media.className = 'app-media';

  if (app.image) {
    const image = document.createElement('img');
    image.src = app.image;
    image.alt = app.imageAlt || `${app.title || 'App'} preview`;
    image.loading = 'lazy';
    media.append(image);
    return media;
  }

  media.classList.add('app-media-empty');
  media.textContent = (app.title || 'App').trim().slice(0, 2).toUpperCase();
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

  section.append(createAppMedia(app), content);
  appsGrid.append(section);
  setActiveSlide();
};

const goToSlide = (index) => {
  const total = appsData.length + 1;
  if (!total) return;
  currentSlideIndex = Math.max(0, Math.min(index, total - 1));
  renderCurrentSlide();
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

const loadApps = async () => {
  try {
    const response = await fetch('apps.json');
    if (!response.ok) throw new Error('Could not load apps.json');
    appsData = await response.json();
    currentSlideIndex = 0;
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
window.addEventListener('wheel', handleWheel, { passive: false });
window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') goToSlide(currentSlideIndex - 1);
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') goToSlide(currentSlideIndex + 1);
});
loadApps();
