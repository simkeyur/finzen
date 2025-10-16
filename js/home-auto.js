/**
 * Home & Auto Module
 * Handles Mortgage and Auto Loan calculator logic
 */

// Mortgage Calculator
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

// Auto Loan Calculator
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

// Load home & auto data from localStorage
function loadHomeAutoData() {
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
          const mortDownWrapper = document.getElementById('mort-down-wrapper');
          const mortDownInput = document.getElementById('mort-down-payment');
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

// Event listeners
document.getElementById('mort-form').addEventListener('submit', e => {
  e.preventDefault();
  calculateMortgage();
});

document.getElementById('loan-form').addEventListener('submit', e => {
  e.preventDefault();
  calculateLoan();
});
