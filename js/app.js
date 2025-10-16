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
  });
});

// Currency input formatting
function formatCurrencyInput(event) {
  const input = event.target;
  const cursorPosition = input.selectionStart;
  let value = input.value;

  // Allow numbers, decimal point, and commas
  value = value.replace(/[^0-9.,]/g, '');

  // Remove existing commas for processing
  const rawValue = value.replace(/,/g, '');

  // If it's a valid number, format it
  if (rawValue && !isNaN(rawValue)) {
    const parts = rawValue.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '';

    // Format integer part with commas
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Reconstruct the value
    let formattedValue = formattedInteger;
    if (decimalPart || value.includes('.')) {
      formattedValue += '.' + decimalPart;
    }

    input.value = formattedValue;

    // Try to maintain cursor position
    const newCursorPosition = Math.min(cursorPosition + (formattedValue.length - value.length), formattedValue.length);
    input.setSelectionRange(newCursorPosition, newCursorPosition);
  } else if (value === '' || value === '.') {
    input.value = value;
  }
}
document.querySelectorAll('.currency-input').forEach(input => {
  input.addEventListener('input', formatCurrencyInput);
});

// Toggle handlers
const mortDownToggle = document.getElementById('mort-down-toggle');
const mortDownInput = document.getElementById('mort-down-payment');
const mortDownWrapper = document.getElementById('mort-down-wrapper');

mortDownToggle.addEventListener('change', function() {
  if (this.checked) {
    // Switched to percent mode - remove dollar sign
    mortDownWrapper.classList.remove('input-wrapper');
    mortDownInput.placeholder = '20';
    mortDownInput.classList.remove('currency-input');
    mortDownInput.type = 'number';
    mortDownInput.step = '0.01';
    mortDownInput.value = '';
    mortDownInput.style.paddingLeft = '0.75rem';
  } else {
    // Switched to amount mode - add dollar sign
    mortDownWrapper.classList.add('input-wrapper');
    mortDownInput.placeholder = '0.00';
    mortDownInput.classList.add('currency-input');
    mortDownInput.type = 'text';
    mortDownInput.removeAttribute('step');
    mortDownInput.value = '';
    mortDownInput.style.paddingLeft = '2rem';
    mortDownInput.addEventListener('input', formatCurrencyInput);
  }
});

// Loan term toggle handler
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

// Calculator functions
function formatCurrency(amount) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function calculateInvestment() {
  const initial = parseFloat(document.getElementById('inv-initial').value.replace(/,/g, '')) || 0;
  const contributionAmount = parseFloat(document.getElementById('inv-contribution').value.replace(/,/g, '')) || 0;
  const isYearly = document.getElementById('inv-contribution-toggle').checked;
  const monthly = isYearly ? contributionAmount / 12 : contributionAmount;
  const rate = parseFloat(document.getElementById('inv-rate').value) / 100;
  const inflationRate = parseFloat(document.getElementById('inv-inflation').value) / 100;
  const years = parseFloat(document.getElementById('inv-years').value) || 0;
  const startDate = new Date(document.getElementById('inv-start-date').value);

  // Save to localStorage
  localStorage.setItem('inv-data', JSON.stringify({
    initial: document.getElementById('inv-initial').value,
    contribution: document.getElementById('inv-contribution').value,
    isYearly: isYearly,
    rate: document.getElementById('inv-rate').value,
    inflation: document.getElementById('inv-inflation').value,
    years: years,
    startDate: document.getElementById('inv-start-date').value
  }));

  let balance = initial;
  let totalPrincipal = initial;
  const monthlyRate = rate / 12;

  // Calculate final values
  for (let i = 1; i <= years * 12; i++) {
    balance = balance * (1 + monthlyRate) + monthly;
    totalPrincipal += monthly;
  }

  const futureValue = balance;
  const totalInterest = futureValue - totalPrincipal;
  
  // Calculate inflation-adjusted value
  const inflationAdjustedValue = futureValue / Math.pow(1 + inflationRate, years);

  document.getElementById('inv-future').textContent = formatCurrency(futureValue);
  document.getElementById('inv-inflation-adjusted').textContent = formatCurrency(inflationAdjustedValue);
  document.getElementById('inv-principal').textContent = formatCurrency(totalPrincipal);
  document.getElementById('inv-interest').textContent = formatCurrency(totalInterest);

  // Show results
  document.querySelector('#investment .results').classList.add('visible');
  document.querySelector('#investment .amortization').classList.add('visible');

  // Yearly amortization table
  const tbody = document.querySelector('#inv-table tbody');
  tbody.innerHTML = '';
  balance = initial;
  let yearlyPrincipal = initial;

  for (let year = 1; year <= years; year++) {
    const startBalance = balance;
    const yearDate = new Date(startDate);
    yearDate.setFullYear(startDate.getFullYear() + year);
    
    // Calculate for this year (12 months)
    for (let month = 1; month <= 12; month++) {
      balance = balance * (1 + monthlyRate) + monthly;
      yearlyPrincipal += monthly;
    }
    
    const yearContributions = monthly * 12;
    const yearInterest = balance - startBalance - yearContributions;
    const inflationAdjustedBalance = balance / Math.pow(1 + inflationRate, year);
    
    const row = tbody.insertRow();
    row.insertCell(0).textContent = yearDate.getFullYear();
    row.insertCell(1).textContent = year;
    row.insertCell(2).textContent = formatCurrency(yearContributions);
    row.insertCell(3).textContent = formatCurrency(yearInterest);
    row.insertCell(4).textContent = formatCurrency(balance);
    row.insertCell(5).textContent = formatCurrency(inflationAdjustedBalance);
  }
}

document.getElementById('inv-form').addEventListener('submit', e => {
  e.preventDefault();
  calculateInvestment();
});

let retChart = null;

function calculateRetirement() {
  const currentAge = parseFloat(document.getElementById('ret-current-age').value);
  const targetAge = parseFloat(document.getElementById('ret-target-age').value);
  const currentSavings = parseFloat(document.getElementById('ret-current-savings').value.replace(/,/g, '')) || 0;
  const contributionAmount = parseFloat(document.getElementById('ret-contribution').value.replace(/,/g, '')) || 0;
  const isYearly = document.getElementById('ret-contribution-toggle').checked;
  const monthly = isYearly ? contributionAmount / 12 : contributionAmount;
  const rate = parseFloat(document.getElementById('ret-rate').value) / 100;
  const inflationRate = parseFloat(document.getElementById('ret-inflation').value) / 100;
  const monthlyRate = rate / 12;
  const monthlyInflationRate = inflationRate / 12;
  const years = targetAge - currentAge;
  const months = years * 12;

  // Save to localStorage
  localStorage.setItem('ret-data', JSON.stringify({
    currentAge: currentAge,
    targetAge: targetAge,
    currentSavings: document.getElementById('ret-current-savings').value,
    contribution: document.getElementById('ret-contribution').value,
    isYearly: isYearly,
    rate: document.getElementById('ret-rate').value,
    inflation: document.getElementById('ret-inflation').value
  }));

  let balance = currentSavings;
  let totalContributions = currentSavings;

  // Calculate final balance
  for (let i = 1; i <= months; i++) {
    balance = balance * (1 + monthlyRate) + monthly;
    totalContributions += monthly;
  }

  const totalGrowth = balance - totalContributions;
  
  // Calculate inflation-adjusted value
  const inflationAdjustedValue = balance / Math.pow(1 + inflationRate, years);

  document.getElementById('ret-savings').textContent = formatCurrency(balance);
  document.getElementById('ret-inflation-adjusted').textContent = formatCurrency(inflationAdjustedValue);
  document.getElementById('ret-contributions').textContent = formatCurrency(totalContributions);
  document.getElementById('ret-growth').textContent = formatCurrency(totalGrowth);

  // Show results
  document.querySelector('#retirement .results').classList.add('visible');
  document.getElementById('ret-chart').classList.add('visible');
  document.querySelector('#retirement .amortization').classList.add('visible');

  // Yearly amortization table
  const tbody = document.querySelector('#ret-table tbody');
  tbody.innerHTML = '';
  balance = currentSavings;
  let yearlyContributions = currentSavings;
  const currentYear = new Date().getFullYear();

  for (let year = 1; year <= years; year++) {
    const startBalance = balance;
    const age = currentAge + year;
    const displayYear = currentYear + year;
    
    // Calculate for this year (12 months)
    for (let month = 1; month <= 12; month++) {
      balance = balance * (1 + monthlyRate) + monthly;
      yearlyContributions += monthly;
    }
    
    const yearContributions = monthly * 12;
    const yearGrowth = balance - startBalance - yearContributions;
    const inflationAdjustedBalance = balance / Math.pow(1 + inflationRate, year);
    
    const row = tbody.insertRow();
    row.insertCell(0).textContent = displayYear;
    row.insertCell(1).textContent = year;
    row.insertCell(2).textContent = age;
    row.insertCell(3).textContent = formatCurrency(yearContributions);
    row.insertCell(4).textContent = formatCurrency(yearGrowth);
    row.insertCell(5).textContent = formatCurrency(balance);
    row.insertCell(6).textContent = formatCurrency(inflationAdjustedBalance);
  }

  // Destroy previous chart if exists
  if (retChart) {
    retChart.destroy();
  }

  // Pie chart for contributions vs growth
  const options = {
    chart: {
      type: 'donut',
      background: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    series: [Math.round(totalContributions), Math.round(totalGrowth)],
    labels: ['Contributions', 'Growth'],
    colors: ['#0088a3', '#00b894'],
    theme: {
      mode: 'light'
    },
    legend: {
      position: 'bottom',
      labels: {
        colors: '#1a1a1a',
        useSeriesColors: false
      },
      fontSize: '13px',
      fontWeight: 600
    },
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return val.toFixed(1) + '%';
      },
      style: {
        fontSize: '15px',
        fontFamily: 'Inter',
        fontWeight: 700,
        colors: ['#ffffff']
      },
      dropShadow: {
        enabled: true,
        blur: 2,
        opacity: 0.5
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Savings',
              formatter: function(w) {
                return formatCurrency(balance);
              },
              color: '#1a1a1a',
              fontSize: '18px',
              fontWeight: 700
            }
          }
        }
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: function(value) {
          return formatCurrency(value);
        }
      },
      style: {
        fontSize: '13px'
      }
    }
  };

  retChart = new ApexCharts(document.querySelector("#ret-chart"), options);
  retChart.render();
}

document.getElementById('ret-form').addEventListener('submit', e => {
  e.preventDefault();
  calculateRetirement();
});

function calculateMortgage() {
  const homePrice = parseFloat(document.getElementById('mort-home-price').value.replace(/,/g, ''));
  const downPaymentValue = parseFloat(document.getElementById('mort-down-payment').value.replace(/,/g, '')) || 0;
  const isPercent = document.getElementById('mort-down-toggle').checked;
  const downPayment = isPercent ? (homePrice * downPaymentValue / 100) : downPaymentValue;
  const loanAmount = homePrice - downPayment;
  const term = parseFloat(document.getElementById('mort-term').value);
  const rate = parseFloat(document.getElementById('mort-rate').value) / 100 / 12;
  const payments = term * 12;
  const startDate = new Date(document.getElementById('mort-start-date').value);

  // Save to localStorage
  localStorage.setItem('mort-data', JSON.stringify({
    homePrice: document.getElementById('mort-home-price').value,
    downPayment: document.getElementById('mort-down-payment').value,
    isPercent: isPercent,
    term: term,
    rate: document.getElementById('mort-rate').value,
    startDate: document.getElementById('mort-start-date').value
  }));

  const monthlyPayment = loanAmount * (rate * Math.pow(1 + rate, payments)) / (Math.pow(1 + rate, payments) - 1);
  const totalPaid = monthlyPayment * payments;
  const totalInterest = totalPaid - loanAmount;

  document.getElementById('mort-monthly').textContent = formatCurrency(monthlyPayment);
  document.getElementById('mort-total').textContent = formatCurrency(totalPaid);
  document.getElementById('mort-interest').textContent = formatCurrency(totalInterest);

  // Show results
  document.querySelector('#mortgage .results').classList.add('visible');
  document.querySelector('#mortgage .amortization').classList.add('visible');

  // Monthly amortization table
  const tbody = document.querySelector('#mort-table tbody');
  tbody.innerHTML = '';
  let balance = loanAmount;
  
  for (let i = 1; i <= payments; i++) {
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(startDate.getMonth() + i);
    
    const interest = balance * rate;
    const principal = monthlyPayment - interest;
    balance -= principal;
    
    const row = tbody.insertRow();
    row.insertCell(0).textContent = `${paymentDate.getMonth() + 1}/${paymentDate.getFullYear()}`;
    row.insertCell(1).textContent = i;
    row.insertCell(2).textContent = formatCurrency(principal);
    row.insertCell(3).textContent = formatCurrency(interest);
    row.insertCell(4).textContent = formatCurrency(Math.max(balance, 0));
  }
}

document.getElementById('mort-form').addEventListener('submit', e => {
  e.preventDefault();
  calculateMortgage();
});

function calculateLoan() {
  const loanAmount = parseFloat(document.getElementById('loan-amount').value.replace(/,/g, ''));
  const termValue = parseFloat(document.getElementById('loan-term').value);
  const isYears = document.getElementById('loan-term-toggle').checked;
  const payments = isYears ? termValue * 12 : termValue;
  const rate = parseFloat(document.getElementById('loan-rate').value) / 100 / 12;
  const startDate = new Date(document.getElementById('loan-start-date').value);

  // Save to localStorage
  localStorage.setItem('loan-data', JSON.stringify({
    loanAmount: document.getElementById('loan-amount').value,
    term: termValue,
    isYears: isYears,
    rate: document.getElementById('loan-rate').value,
    startDate: document.getElementById('loan-start-date').value
  }));

  const monthlyPayment = loanAmount * (rate * Math.pow(1 + rate, payments)) / (Math.pow(1 + rate, payments) - 1);
  const totalPaid = monthlyPayment * payments;
  const totalInterest = totalPaid - loanAmount;

  document.getElementById('loan-monthly').textContent = formatCurrency(monthlyPayment);
  document.getElementById('loan-total').textContent = formatCurrency(totalPaid);
  document.getElementById('loan-interest').textContent = formatCurrency(totalInterest);

  // Show results
  document.querySelector('#loan .results').classList.add('visible');
  document.querySelector('#loan .amortization').classList.add('visible');

  // Monthly amortization table
  const tbody = document.querySelector('#loan-table tbody');
  tbody.innerHTML = '';
  let balance = loanAmount;
  
  for (let i = 1; i <= payments; i++) {
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(startDate.getMonth() + i);
    
    const interest = balance * rate;
    const principal = monthlyPayment - interest;
    balance -= principal;
    
    const row = tbody.insertRow();
    row.insertCell(0).textContent = `${paymentDate.getMonth() + 1}/${paymentDate.getFullYear()}`;
    row.insertCell(1).textContent = i;
    row.insertCell(2).textContent = formatCurrency(principal);
    row.insertCell(3).textContent = formatCurrency(interest);
    row.insertCell(4).textContent = formatCurrency(Math.max(balance, 0));
  }
}

document.getElementById('loan-form').addEventListener('submit', e => {
  e.preventDefault();
  calculateLoan();
});

// Load saved data from localStorage
function loadSavedData() {
  // Load investment data
  const invData = localStorage.getItem('inv-data');
  if (invData) {
    try {
      const data = JSON.parse(invData);
      if (data.initial) document.getElementById('inv-initial').value = data.initial;
      if (data.contribution) document.getElementById('inv-contribution').value = data.contribution;
      if (data.isYearly !== undefined) document.getElementById('inv-contribution-toggle').checked = data.isYearly;
      if (data.rate) document.getElementById('inv-rate').value = data.rate;
      if (data.inflation) document.getElementById('inv-inflation').value = data.inflation;
      if (data.years) document.getElementById('inv-years').value = data.years;
      if (data.startDate) document.getElementById('inv-start-date').value = data.startDate;
    } catch (e) {
      console.error('Error loading investment data:', e);
    }
  }

  // Load retirement data
  const retData = localStorage.getItem('ret-data');
  if (retData) {
    try {
      const data = JSON.parse(retData);
      if (data.currentAge) document.getElementById('ret-current-age').value = data.currentAge;
      if (data.targetAge) document.getElementById('ret-target-age').value = data.targetAge;
      if (data.currentSavings) document.getElementById('ret-current-savings').value = data.currentSavings;
      if (data.contribution) document.getElementById('ret-contribution').value = data.contribution;
      if (data.isYearly !== undefined) document.getElementById('ret-contribution-toggle').checked = data.isYearly;
      if (data.rate) document.getElementById('ret-rate').value = data.rate;
      if (data.inflation) document.getElementById('ret-inflation').value = data.inflation;
    } catch (e) {
      console.error('Error loading retirement data:', e);
    }
  }

  // Load mortgage data
  const mortData = localStorage.getItem('mort-data');
  if (mortData) {
    try {
      const data = JSON.parse(mortData);
      if (data.homePrice) document.getElementById('mort-home-price').value = data.homePrice;
      if (data.downPayment) document.getElementById('mort-down-payment').value = data.downPayment;
      if (data.isPercent !== undefined) {
        document.getElementById('mort-down-toggle').checked = data.isPercent;
        // Trigger the toggle change to update UI
        if (data.isPercent) {
          mortDownWrapper.classList.remove('input-wrapper');
          mortDownInput.placeholder = '20';
          mortDownInput.classList.remove('currency-input');
          mortDownInput.type = 'number';
          mortDownInput.step = '0.01';
          mortDownInput.style.paddingLeft = '0.75rem';
        }
      }
      if (data.term) document.getElementById('mort-term').value = data.term;
      if (data.rate) document.getElementById('mort-rate').value = data.rate;
      if (data.startDate) document.getElementById('mort-start-date').value = data.startDate;
    } catch (e) {
      console.error('Error loading mortgage data:', e);
    }
  }

  // Load loan data
  const loanData = localStorage.getItem('loan-data');
  if (loanData) {
    try {
      const data = JSON.parse(loanData);
      if (data.loanAmount) document.getElementById('loan-amount').value = data.loanAmount;
      if (data.term) document.getElementById('loan-term').value = data.term;
      if (data.isYears !== undefined) document.getElementById('loan-term-toggle').checked = data.isYears;
      if (data.rate) document.getElementById('loan-rate').value = data.rate;
      if (data.startDate) document.getElementById('loan-start-date').value = data.startDate;
    } catch (e) {
      console.error('Error loading loan data:', e);
    }
  }
}

// Settings modal functionality
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');

settingsBtn.addEventListener('click', () => {
  settingsModal.classList.add('active');
});

closeSettings.addEventListener('click', () => {
  settingsModal.classList.remove('active');
});

// Close modal when clicking outside
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove('active');
  }
});

// Reset app functionality
document.getElementById('reset-app').addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
    localStorage.clear();
    location.reload();
  }
});

// Load saved data on page load
loadSavedData();

// PWA registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(reg => console.log('SW registered'))
    .catch(err => console.log('SW registration failed'));
}

// Biometric Authentication Setup
document.addEventListener('DOMContentLoaded', async () => {
  // Check biometric support and show modal if needed
  const biometricSupported = await biometricAuth.checkSupport();

  if (biometricSupported) {
    // Check if user was recently authenticated
    const wasAuthenticated = biometricAuth.loadAuthState();

    if (!wasAuthenticated) {
      showBiometricModal();
    } else {
      // User was recently authenticated, proceed normally
      initializeApp();
    }
  } else {
    // Biometrics not supported, proceed normally
    initializeApp();
  }
});

function showBiometricModal() {
  const modal = document.getElementById('biometric-modal');
  const authBtn = document.getElementById('biometric-auth-btn');
  const authText = document.getElementById('auth-text');
  const skipBtn = document.getElementById('biometric-skip');
  const infoText = document.getElementById('biometric-info');

  // Update UI based on device type
  const authType = biometricAuth.getAuthTypeDisplay();
  authText.textContent = `Authenticate with ${authType}`;
  infoText.textContent = `Use your ${authType.toLowerCase()} to unlock FinZen`;

  modal.classList.add('show');

  // Handle authentication
  authBtn.addEventListener('click', async () => {
    try {
      authBtn.classList.add('authenticating');
      authText.textContent = 'Authenticating...';

      const success = await biometricAuth.authenticate();

      if (success) {
        modal.classList.remove('show');
        initializeApp();
      }
    } catch (error) {
      authBtn.classList.remove('authenticating');
      authText.textContent = `Authenticate with ${authType}`;

      // Show error message
      infoText.textContent = error.message;
      infoText.style.color = '#ef4444';

      // Reset after 3 seconds
      setTimeout(() => {
        infoText.textContent = `Use your ${authType.toLowerCase()} to unlock FinZen`;
        infoText.style.color = 'rgba(224, 230, 237, 0.6)';
      }, 3000);
    }
  });

  // Handle skip
  skipBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    initializeApp();
  });
}

function initializeApp() {
  // Load saved data and initialize the app
  loadSavedData();

  // Add biometric toggle to settings
  addBiometricSettings();
}

function addBiometricSettings() {
  const settingsBody = document.querySelector('.settings-body');

  // Create biometric settings section
  const biometricSection = document.createElement('div');
  biometricSection.className = 'biometric-settings';
  biometricSection.innerHTML = `
    <h3 style="color: #00acc1; margin-bottom: 1rem;">Security</h3>
    <div class="setting-item">
      <div class="setting-info">
        <span class="setting-label">Biometric Authentication</span>
        <span class="setting-description">Require fingerprint or face recognition to access the app</span>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" id="biometric-enabled">
        <span class="toggle-slider"></span>
      </label>
    </div>
    <button class="biometric-test-btn" id="biometric-test-btn" style="display: none;">Test Biometric Auth</button>
  `;

  settingsBody.insertBefore(biometricSection, settingsBody.firstChild);

  // Handle biometric toggle
  const biometricToggle = document.getElementById('biometric-enabled');
  const testBtn = document.getElementById('biometric-test-btn');

  // Load current setting
  const biometricEnabled = localStorage.getItem('biometric_enabled') === 'true';
  biometricToggle.checked = biometricEnabled;

  if (biometricEnabled) {
    testBtn.style.display = 'block';
  }

  biometricToggle.addEventListener('change', () => {
    const enabled = biometricToggle.checked;
    localStorage.setItem('biometric_enabled', enabled);

    if (enabled) {
      testBtn.style.display = 'block';
      // Clear any existing auth state when enabling
      biometricAuth.logout();
    } else {
      testBtn.style.display = 'none';
      // Clear auth state when disabling
      biometricAuth.logout();
    }
  });

  // Handle test button
  testBtn.addEventListener('click', async () => {
    try {
      const success = await biometricAuth.authenticate();
      if (success) {
        alert('Biometric authentication successful!');
      }
    } catch (error) {
      alert('Authentication failed: ' + error.message);
    }
  });
}