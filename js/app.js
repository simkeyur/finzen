// Currency formatting utility
function formatCurrency(amount) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// Set default dates to today
const today = new Date().toISOString().split('T')[0];
document.getElementById('mort-start-date').value = today;
document.getElementById('loan-start-date').value = today;
document.getElementById('inv-start-date').value = today;

// Tab switching
const tabs = document.querySelectorAll('.tab');
const calculators = document.querySelectorAll('.calculator');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    calculators.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
    closeAllDropdowns();
  });
});

// Mobile dropdown navigation
function setupMobileDropdowns() {
  const projectionBtn = document.getElementById('projection-btn');
  const homeAutoBtn = document.getElementById('home-auto-btn');
  const taxesBtn = document.getElementById('taxes-btn');
  const projectionMenu = document.getElementById('projection-menu');
  const homeAutoMenu = document.getElementById('home-auto-menu');
  const taxesMenu = document.getElementById('taxes-menu');

  if (projectionBtn && homeAutoBtn && taxesBtn && projectionMenu && homeAutoMenu && taxesMenu) {
    projectionBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown(projectionMenu, projectionBtn);
      closeDropdown(homeAutoMenu, homeAutoBtn);
      closeDropdown(taxesMenu, taxesBtn);
    });

    homeAutoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown(homeAutoMenu, homeAutoBtn);
      closeDropdown(projectionMenu, projectionBtn);
      closeDropdown(taxesMenu, taxesBtn);
    });

    taxesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown(taxesMenu, taxesBtn);
      closeDropdown(projectionMenu, projectionBtn);
      closeDropdown(homeAutoMenu, homeAutoBtn);
    });
  }
}

function toggleDropdown(menu, btn) {
  menu.classList.toggle('show');
  btn.classList.toggle('active');
}

function closeDropdown(menu, btn) {
  menu.classList.remove('show');
  btn.classList.remove('active');
}

function closeAllDropdowns() {
  const menus = document.querySelectorAll('.dropdown-menu');
  const btns = document.querySelectorAll('.dropdown-btn');
  menus.forEach(menu => menu.classList.remove('show'));
  btns.forEach(btn => btn.classList.remove('active'));
}

function setupClickOutsideHandler() {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-container') && !e.target.closest('.dropdown-btn')) {
      closeAllDropdowns();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupMobileDropdowns();
    setupClickOutsideHandler();
  });
} else {
  setupMobileDropdowns();
  setupClickOutsideHandler();
}

// Currency input formatting
function formatCurrencyInput(event) {
  const input = event.target;
  const cursorPosition = input.selectionStart;
  let value = input.value;

  value = value.replace(/[^0-9.,]/g, '');
  const rawValue = value.replace(/,/g, '');

  if (rawValue && !isNaN(rawValue)) {
    const parts = rawValue.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '';
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    let formattedValue = formattedInteger;
    if (decimalPart || value.includes('.')) {
      formattedValue += '.' + decimalPart;
    }

    input.value = formattedValue;
    const newCursorPosition = Math.min(cursorPosition + (formattedValue.length - value.length), formattedValue.length);
    input.setSelectionRange(newCursorPosition, newCursorPosition);
  }
}

document.querySelectorAll('.currency-input').forEach(input => {
  input.addEventListener('input', formatCurrencyInput);
});

// Form toggles for conditional inputs
const retContributionToggle = document.getElementById('ret-contribution-toggle');
const retContributionInput = document.getElementById('ret-contribution');

retContributionToggle.addEventListener('change', function() {
  retContributionInput.value = '';
  if (this.checked) {
    retContributionInput.placeholder = 'Yearly Amount';
  } else {
    retContributionInput.placeholder = 'Monthly Amount';
  }
});

const invContributionToggle = document.getElementById('inv-contribution-toggle');
const invContributionInput = document.getElementById('inv-contribution');

invContributionToggle.addEventListener('change', function() {
  invContributionInput.value = '';
  if (this.checked) {
    invContributionInput.placeholder = 'Yearly Amount';
  } else {
    invContributionInput.placeholder = 'Monthly Amount';
  }
});

const mortDownToggle = document.getElementById('mort-down-toggle');
const mortDownInput = document.getElementById('mort-down-payment');
const mortDownWrapper = document.getElementById('mort-down-wrapper');

mortDownToggle.addEventListener('change', function() {
  mortDownInput.value = '';
  if (this.checked) {
    mortDownWrapper.classList.add('input-wrapper');
    mortDownInput.placeholder = '20';
    mortDownInput.classList.add('currency-input');
    mortDownInput.type = 'number';
    mortDownInput.step = '0.01';
    mortDownInput.style.paddingLeft = '2rem';
    mortDownInput.addEventListener('input', formatCurrencyInput);
  } else {
    mortDownWrapper.classList.remove('input-wrapper');
    mortDownInput.placeholder = '0.00';
    mortDownInput.classList.remove('currency-input');
    mortDownInput.type = 'text';
    mortDownInput.style.paddingLeft = '2rem';
    mortDownInput.addEventListener('input', formatCurrencyInput);
  }
});

const loanTermToggle = document.getElementById('loan-term-toggle');
const loanTermInput = document.getElementById('loan-term');

loanTermToggle.addEventListener('change', function() {
  loanTermInput.value = '';
  if (this.checked) {
    loanTermInput.placeholder = 'Years';
  } else {
    loanTermInput.placeholder = 'Months';
  }
});

// Load saved data
function loadSavedData() {
  if (typeof loadProjectionData === 'function') {
    loadProjectionData();
  }
  if (typeof loadHomeAutoData === 'function') {
    loadHomeAutoData();
  }
}

// Settings modal
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');

settingsBtn.addEventListener('click', () => {
  settingsModal.classList.add('active');
});

closeSettings.addEventListener('click', () => {
  settingsModal.classList.remove('active');
});

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove('active');
  }
});

document.getElementById('reset-app').addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
    localStorage.clear();
    location.reload();
  }
});

// PWA registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(reg => console.log('SW registered'))
    .catch(err => console.log('SW registration failed'));
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
  loadSavedData();
});
