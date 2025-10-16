/**
 * Projection Module
 * Handles Retirement and Investment calculator logic
 */

let retChart = null;

// Investment Calculator
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

// Retirement Calculator
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

// Load projection data from localStorage
function loadProjectionData() {
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
}

// Event listeners
document.getElementById('inv-form').addEventListener('submit', e => {
  e.preventDefault();
  calculateInvestment();
});

document.getElementById('ret-form').addEventListener('submit', e => {
  e.preventDefault();
  calculateRetirement();
});
