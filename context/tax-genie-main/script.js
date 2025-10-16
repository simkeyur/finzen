// Tax Calculator JavaScript Module
// 
// IMPORTANT: Manual Entry and W-2 Import data are kept COMPLETELY SEPARATE
// - Manual Entry: Uses this.income1Input, this.income2Input, and other input fields
// - W-2 Import: Uses this.w2Data object which stores person1, person2, and all deductions
// - Storage: Both are saved separately under data.manual and data.w2
// - Calculations: calculateTaxes() uses manual inputs, calculateW2Taxes() uses w2Data
//
class TaxCalculator {
    constructor() {
        this.federalTaxData = {};
        this.standardDeductions = {};
        this.childTaxCredits = {};
        this.stateTaxData = {};
        this.storageKey = 'taxGenieData';
        this.currentYear = null;
        this.taxData = null;
        
        this.loadTaxData();
    }
    
    async loadTaxData() {
        try {
            const response = await fetch('tax-brackets.json');
            this.taxData = await response.json();
            this.currentYear = this.taxData.current_year;
            
            this.initializeData();
            this.initializeDOMElements();
            this.setupEventListeners();
            this.populateStates();
            this.loadFromStorage();
            this.updateManualCalculateButton();
            this.updateW2CalculateButton();
            this.updateYearDisplay();
        } catch (error) {
            console.error('Error loading tax data:', error);
            alert('Failed to load tax data. Please refresh the page.');
        }
    }

    initializeData() {
        // Load contribution limits from JSON
        this.contributionLimits = this.taxData.contribution_limits;

        // Load FICA tax rates and limits from JSON
        this.ficaRates = this.taxData.fica_rates;
        
        // Convert null values to Infinity in FICA thresholds (already numbers in JSON)

        // Load federal tax brackets from JSON and convert null to Infinity
        const brackets = this.taxData.federal_tax_brackets;
        this.federalTaxData = {};
        this.federalTaxData[this.currentYear] = {};
        
        for (const status in brackets) {
            this.federalTaxData[this.currentYear][status] = brackets[status].map(bracket => ({
                rate: bracket.rate,
                min: bracket.min,
                max: bracket.max === null ? Infinity : bracket.max
            }));
        }

        // Load standard deductions from JSON
        this.standardDeductions = {};
        this.standardDeductions[this.currentYear] = this.taxData.standard_deductions;

        // Load child tax credits from JSON
        this.childTaxCredits = {};
        this.childTaxCredits[this.currentYear] = this.taxData.child_tax_credit;

        // Load state tax data from JSON and convert null to Infinity
        this.stateTaxData = {};
        for (const state in this.taxData.state_tax_data) {
            const stateData = this.taxData.state_tax_data[state];
            if (stateData.type === 'progressive') {
                this.stateTaxData[state] = {
                    type: stateData.type,
                    brackets: stateData.brackets.map(bracket => ({
                        rate: bracket.rate,
                        min: bracket.min,
                        max: bracket.max === null ? Infinity : bracket.max
                    }))
                };
            } else {
                this.stateTaxData[state] = stateData;
            }
        }
    }

    initializeDOMElements() {
        // Form elements
        this.income1Input = document.getElementById('income1');
        this.income2Input = document.getElementById('income2');
        this.person2IncomeGroup = document.getElementById('person2-income-group');
        this.statusSelect = document.getElementById('status');
        this.filingStatusGroup = document.getElementById('filing-status-group');
        this.stateSelect = document.getElementById('state');
        this.contribution401kInput = document.getElementById('contribution401k');
        this.contributionHsaInput = document.getElementById('contributionHsa');
        this.contributionMaxEl = document.getElementById('contribution-max');
        this.capitalLossInput = document.getElementById('capitalLoss');
        this.dependentsInput = document.getElementById('dependents');
        this.calculateBtn = document.getElementById('calculateBtn');
        
        // Hidden fields for W-2 calculations (stored but not displayed in manual mode)
        this.federalWithheld = 0;
        this.stateWithheld = 0;
        this.socialSecurityWithheld = 0;
        this.medicareWithheld = 0;
        
        // Deduction selector
        this.deductionBtns = document.querySelectorAll('.deduction-btn');
        this.itemizedDeductions = document.getElementById('itemized-deductions');
        this.mortgageInterestInput = document.getElementById('mortgageInterest');
        this.propertyTaxesInput = document.getElementById('propertyTaxes');
        this.charitableDonationsInput = document.getElementById('charitableDonations');
        this.medicalExpensesInput = document.getElementById('medicalExpenses');
        this.deductionType = 'standard';
        
        // Advanced deductions toggle
        this.advancedToggle = document.getElementById('advanced-toggle');
        this.advancedDeductions = document.getElementById('advanced-deductions');
        this.advancedExpanded = false;
        
        // People selector buttons
        this.peopleBtns = document.querySelectorAll('.people-btn');
        this.numPeople = 1;
        
        // Manual view result elements
        this.resultsDiv = document.getElementById('results');
        this.federalTaxEl = document.getElementById('federal-tax');
        this.stateTaxEl = document.getElementById('state-tax');
        this.totalTaxEl = document.getElementById('total-tax');
        this.effectiveRateEl = document.getElementById('effective-rate');
        this.errorMessageEl = document.getElementById('error-message');
        this.taxExplanationEl = document.getElementById('tax-explanation');
        this.explanationContentEl = document.getElementById('explanation-content');
        this.genieSectionEl = document.getElementById('genie-section');
        this.genieTipsEl = document.getElementById('genie-tips');
        this.genieTotalBox = document.getElementById('genie-total');
        this.genieTotalAmount = document.getElementById('genie-total-amount');
        
        // W-2 view result elements
        this.w2ResultsDiv = document.getElementById('w2-results');
        this.w2FederalTaxEl = document.getElementById('w2-federal-tax');
        this.w2StateTaxEl = document.getElementById('w2-state-tax');
        this.w2SocialSecurityTaxEl = document.getElementById('w2-social-security-tax');
        this.w2MedicareTaxEl = document.getElementById('w2-medicare-tax');
        this.w2TotalTaxEl = document.getElementById('w2-total-tax');
        this.w2TotalWithheldEl = document.getElementById('w2-total-withheld');
        this.w2RefundAmountEl = document.getElementById('w2-refund-amount');
        this.w2RefundLabelEl = document.getElementById('w2-refund-label');
        this.w2EffectiveRateEl = document.getElementById('w2-effective-rate');
        this.w2ErrorMessageEl = document.getElementById('w2-error-message');
        this.w2TaxExplanationEl = document.getElementById('w2-tax-explanation');
        this.w2ExplanationContentEl = document.getElementById('w2-explanation-content');
        this.w2GenieSectionEl = document.getElementById('w2-genie-section');
        this.w2GenieTipsEl = document.getElementById('w2-genie-tips');
        this.w2GenieTotalBox = document.getElementById('w2-genie-total');
        this.w2GenieTotalAmount = document.getElementById('w2-genie-total-amount');
        
        // View switcher (navbar)
        this.navTabs = document.querySelectorAll('.nav-tab');
        this.manualView = document.getElementById('manual-view');
        this.w2View = document.getElementById('w2-view');
        this.currentView = 'manual';
        
        // W-2 filing status selector
        this.w2FilingStatusSelect = document.getElementById('w2-filing-status');
        this.w2FilingStatus = 'single';
        this.w2StateSelect = document.getElementById('w2-state');
        this.w2CalculateBtn = document.getElementById('w2-calculate-btn');
        this.w2Loader = document.getElementById('w2-loader');
        this.w2BtnText = document.getElementById('w2-btn-text');
        
        // Button elements
        this.loader = document.getElementById('loader');
        this.btnText = document.getElementById('btn-text');
        this.resetBtn = document.getElementById('reset-btn');
        this.installBtn = document.getElementById('install-btn');
        
        // iOS modal elements
        this.iosModal = document.getElementById('ios-install-modal');
        this.modalClose = document.getElementById('modal-close');
        
        // W-2 modal elements
        this.w2ImportPerson1Btn = document.getElementById('w2-import-person1-btn');
        this.w2ImportPerson2Btn = document.getElementById('w2-import-person2-btn');
        this.w2StatusPerson1 = document.getElementById('w2-status-person1');
        this.w2StatusPerson2 = document.getElementById('w2-status-person2');
        this.w2Modal = document.getElementById('w2-modal');
        this.w2ModalClose = document.getElementById('w2-modal-close');
        this.w2CancelBtn = document.getElementById('w2-cancel-btn');
        this.w2SubmitBtn = document.getElementById('w2-import-submit-btn');
        this.w2ImportBtnText = document.getElementById('w2-import-btn-text');
        this.w2Box1 = document.getElementById('w2-box1');
        this.w2Box2 = document.getElementById('w2-box2');
        this.w2Box3 = document.getElementById('w2-box3');
        this.w2Box4 = document.getElementById('w2-box4');
        this.w2Box5 = document.getElementById('w2-box5');
        this.w2Box6 = document.getElementById('w2-box6');
        this.w2Box12Code = document.getElementById('w2-box12-code');
        this.w2Box12Amount = document.getElementById('w2-box12-amount');
        this.w2Box17 = document.getElementById('w2-box17');
        this.w2SelectedPerson = 1;
        
        // Store W-2 data for multiple people (completely separate from manual entry)
        this.w2Data = {
            person1: null,
            person2: null,
            // W-2 specific fields
            contribution401k: 0,
            contributionHsa: 0,
            capitalLoss: 0,
            dependents: 0,
            mortgageInterest: 0,
            propertyTaxes: 0,
            charitableDonations: 0,
            medicalExpenses: 0
        };
        
        // PWA install prompt
        this.deferredPrompt = null;
    }

    setupEventListeners() {
        this.calculateBtn.addEventListener('click', () => this.calculateTaxes());
        
        // Advanced deductions toggle
        this.advancedToggle.addEventListener('click', () => this.toggleAdvancedDeductions());
        
        // People selector buttons
        this.peopleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const numPeople = parseInt(e.target.getAttribute('data-people'));
                this.updatePeopleSelection(numPeople);
            });
        });
        
        // Deduction selector buttons
        this.deductionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const deductionType = e.target.getAttribute('data-deduction');
                this.updateDeductionSelection(deductionType);
            });
        });
        
        // Add keyboard support for Enter key
        [this.income1Input, this.income2Input, this.contribution401kInput, this.contributionHsaInput, 
         this.capitalLossInput, this.dependentsInput, this.mortgageInterestInput, 
         this.propertyTaxesInput, this.charitableDonationsInput, this.medicalExpensesInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.calculateTaxes();
                }
            });
        });

        // Add input validation and 401k calculation
        this.income1Input.addEventListener('input', this.validateNumericInput);
        this.income2Input.addEventListener('input', this.validateNumericInput);
        this.contribution401kInput.addEventListener('input', (e) => {
            this.validateNumericInput(e);
            this.update401kAmount();
        });
        this.contributionHsaInput.addEventListener('input', this.validateNumericInput);
        this.capitalLossInput.addEventListener('input', this.validateNumericInput);
        this.dependentsInput.addEventListener('input', this.validateNumericInput);
        this.mortgageInterestInput.addEventListener('input', this.validateNumericInput);
        this.propertyTaxesInput.addEventListener('input', this.validateNumericInput);
        this.charitableDonationsInput.addEventListener('input', this.validateNumericInput);
        this.medicalExpensesInput.addEventListener('input', this.validateNumericInput);
        
        // Update 401k amount when income changes
        this.income1Input.addEventListener('input', () => {
            this.update401kAmount();
            this.saveToStorage();
        });
        this.income2Input.addEventListener('input', () => {
            this.update401kAmount();
            this.saveToStorage();
        });
        
        // Save to storage on any input change
        [this.income1Input, this.income2Input, this.statusSelect, this.stateSelect, 
         this.contribution401kInput, this.contributionHsaInput, this.capitalLossInput, 
         this.dependentsInput, this.mortgageInterestInput, this.propertyTaxesInput,
         this.charitableDonationsInput, this.medicalExpensesInput].forEach(input => {
            input.addEventListener('change', () => this.saveToStorage());
        });
        
        // Reset button
        this.resetBtn.addEventListener('click', () => this.resetApp());
        
        // Install button
        this.installBtn.addEventListener('click', () => this.handleInstallClick());
        
        // Modal close
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.iosModal.addEventListener('click', (e) => {
            if (e.target === this.iosModal) {
                this.closeModal();
            }
        });
        
        // W-2 modal handlers
        this.w2ImportPerson1Btn.addEventListener('click', () => this.showW2Modal(1));
        this.w2ImportPerson2Btn.addEventListener('click', () => this.showW2Modal(2));
        this.w2ModalClose.addEventListener('click', () => this.closeW2Modal());
        this.w2CancelBtn.addEventListener('click', () => this.closeW2Modal());
        this.w2SubmitBtn.addEventListener('click', () => this.importW2Values());
        this.w2Modal.addEventListener('click', (e) => {
            if (e.target === this.w2Modal) {
                this.closeW2Modal();
            }
        });
        
        // Navigation tabs
        this.navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.currentTarget.getAttribute('data-view');
                this.switchView(view);
            });
        });
        
        // W-2 filing status selector
        this.w2FilingStatusSelect.addEventListener('change', (e) => {
            this.updateW2FilingStatus(e.target.value);
        });
        
        // W-2 calculate button
        this.w2CalculateBtn.addEventListener('click', () => this.calculateW2Taxes());
        
        // Manual entry input validation for calculate button
        this.income1Input.addEventListener('input', () => this.updateManualCalculateButton());
        this.income2Input.addEventListener('input', () => this.updateManualCalculateButton());
        
        // Listen for PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.installBtn.style.display = 'inline-flex';
        });
        
        // Check if iOS and not in standalone mode
        this.checkiOSInstall();
    }
    
    checkiOSInstall() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
        
        // Show install button on iOS if not already installed
        if (isIOS && !isInStandaloneMode) {
            this.installBtn.style.display = 'inline-flex';
        }
    }
    
    handleInstallClick() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isIOS) {
            // Show iOS instructions modal
            this.showModal();
        } else if (this.deferredPrompt) {
            // Show Android/Desktop install prompt
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('✅ User accepted the install prompt');
                    this.installBtn.style.display = 'none';
                } else {
                    console.log('❌ User dismissed the install prompt');
                }
                this.deferredPrompt = null;
            });
        }
    }
    
    showModal() {
        this.iosModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        this.iosModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    switchView(view) {
        this.currentView = view;
        
        // Update nav tab states
        this.navTabs.forEach(tab => {
            const tabView = tab.getAttribute('data-view');
            if (tabView === view) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Show/hide views
        if (view === 'manual') {
            this.manualView.classList.remove('hidden');
            this.w2View.classList.add('hidden');
        } else {
            this.manualView.classList.add('hidden');
            this.w2View.classList.remove('hidden');
        }
        
        // Save preference
        this.saveToStorage();
    }
    
    showW2Modal(person) {
        this.w2SelectedPerson = person;
        
        // Update modal title button text
        this.w2ImportBtnText.textContent = `Import Person ${person} W-2`;
        
        // Pre-fill form if data exists for selected person
        const personKey = `person${person}`;
        const personData = this.w2Data[personKey];
        
        if (personData) {
            this.w2Box1.value = personData.box1 || '';
            this.w2Box2.value = personData.box2 || '';
            this.w2Box3.value = personData.box3 || '';
            this.w2Box4.value = personData.box4 || '';
            this.w2Box5.value = personData.box5 || '';
            this.w2Box6.value = personData.box6 || '';
            this.w2Box12Code.value = personData.box12Code || '';
            this.w2Box12Amount.value = personData.box12Amount || '';
            this.w2Box17.value = personData.box17 || '';
        }
        
        this.w2Modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    closeW2Modal() {
        this.w2Modal.classList.add('hidden');
        document.body.style.overflow = '';
        // Reset form
        this.w2Box1.value = '';
        this.w2Box2.value = '';
        this.w2Box3.value = '';
        this.w2Box4.value = '';
        this.w2Box5.value = '';
        this.w2Box6.value = '';
        this.w2Box12Code.value = '';
        this.w2Box12Amount.value = '';
        this.w2Box17.value = '';
    }
    
    updateW2FilingStatus(filing) {
        this.w2FilingStatus = filing;
        
        // Update dropdown value
        this.w2FilingStatusSelect.value = filing;
        
        // Show/hide Person 2 button based on filing status
        const showPerson2 = filing === 'married_jointly' || filing === 'married_separately';
        this.w2ImportPerson2Btn.style.display = showPerson2 ? 'flex' : 'none';
        
        // For married filing statuses, default Person 2 to no income if not already set
        if (showPerson2 && !this.w2Data.person2) {
            this.w2Data.person2 = {
                box1: 0,
                box2: 0,
                box3: 0,
                box4: 0,
                box5: 0,
                box6: 0,
                box12Code: '',
                box12Amount: 0,
                box17: 0
            };
            
            // Ensure we have 2 people selected
            if (this.numPeople === 1) {
                this.updatePeopleSelection(2);
            }
            
            // Set Person 2 income to 0
            this.income2Input.value = '0';
            
            // Update status display
            this.updateW2ImportStatus();
        }
        
        // Update calculate button state
        this.updateW2CalculateButton();
        
        // Save to storage
        this.saveToStorage();
    }
    
    updateW2ImportStatus() {
        // Update Person 1 status
        if (this.w2Data.person1) {
            this.w2StatusPerson1.textContent = `✓ Imported ($${this.formatNumber(this.w2Data.person1.box1)})`;
            this.w2ImportPerson1Btn.classList.add('imported');
        } else {
            this.w2StatusPerson1.textContent = 'Not imported';
            this.w2ImportPerson1Btn.classList.remove('imported');
        }
        
        // Update Person 2 status
        if (this.w2Data.person2) {
            if (this.w2Data.person2.box1 === 0) {
                this.w2StatusPerson2.textContent = '✓ No income';
                this.w2ImportPerson2Btn.classList.add('imported');
            } else {
                this.w2StatusPerson2.textContent = `✓ Imported ($${this.formatNumber(this.w2Data.person2.box1)})`;
                this.w2ImportPerson2Btn.classList.add('imported');
            }
        } else {
            this.w2StatusPerson2.textContent = 'Not imported';
            this.w2ImportPerson2Btn.classList.remove('imported');
        }
        
        // Update calculate button state based on filing status and imports
        this.updateW2CalculateButton();
    }
    
    updateW2CalculateButton() {
        // Check if required W-2s are imported based on filing status
        const needsPerson2 = this.w2FilingStatus === 'married_jointly' || this.w2FilingStatus === 'married_separately';
        let isEnabled = false;
        
        if (needsPerson2) {
            // For married statuses, both W-2s are required
            isEnabled = this.w2Data.person1 && this.w2Data.person2;
        } else {
            // For single/head of household, only Person 1 is required
            isEnabled = this.w2Data.person1 !== null;
        }
        
        this.w2CalculateBtn.disabled = !isEnabled;
    }
    
    updateManualCalculateButton() {
        // Enable calculate button if at least Person 1 has income
        const income1 = parseFloat(this.income1Input.value) || 0;
        const isEnabled = income1 > 0;
        
        this.calculateBtn.disabled = !isEnabled;
    }
    
    importW2Values() {
        const box1 = parseFloat(this.w2Box1.value) || 0;
        const box2 = parseFloat(this.w2Box2.value) || 0;
        const box3 = parseFloat(this.w2Box3.value) || 0;
        const box4 = parseFloat(this.w2Box4.value) || 0;
        const box5 = parseFloat(this.w2Box5.value) || 0;
        const box6 = parseFloat(this.w2Box6.value) || 0;
        const box12Amount = parseFloat(this.w2Box12Amount.value) || 0;
        const box12Code = this.w2Box12Code.value;
        const box17 = parseFloat(this.w2Box17.value) || 0;
        
        // For Person 2, allow import with zero values (not working case)
        if (this.w2SelectedPerson !== 2 && box1 === 0) {
            alert('Please enter a value for Box 1 (Wages)');
            return;
        }
        
        // Store W-2 data for the selected person
        const personKey = `person${this.w2SelectedPerson}`;
        this.w2Data[personKey] = {
            box1,
            box2,
            box3,
            box4,
            box5,
            box6,
            box12Amount,
            box12Code,
            box17
        };
        
        // Calculate total 401k and HSA contributions from all imported W-2s
        // Store in w2Data, NOT in manual entry fields
        this.w2Data.contribution401k = 0;
        this.w2Data.contributionHsa = 0;
        
        if (this.w2Data.person1) {
            if (this.w2Data.person1.box12Amount > 0 && this.w2Data.person1.box12Code) {
                if (['D', 'E', 'F', 'G', 'S'].includes(this.w2Data.person1.box12Code)) {
                    this.w2Data.contribution401k += this.w2Data.person1.box12Amount;
                } else if (this.w2Data.person1.box12Code === 'W') {
                    this.w2Data.contributionHsa += this.w2Data.person1.box12Amount;
                }
            }
        }
        
        if (this.w2Data.person2) {
            if (this.w2Data.person2.box12Amount > 0 && this.w2Data.person2.box12Code) {
                if (['D', 'E', 'F', 'G', 'S'].includes(this.w2Data.person2.box12Code)) {
                    this.w2Data.contribution401k += this.w2Data.person2.box12Amount;
                } else if (this.w2Data.person2.box12Code === 'W') {
                    this.w2Data.contributionHsa += this.w2Data.person2.box12Amount;
                }
            }
        }
        
        // Calculate total withheld amounts from all imported W-2s
        this.federalWithheld = 0;
        this.stateWithheld = 0;
        this.socialSecurityWithheld = 0;
        this.medicareWithheld = 0;
        
        if (this.w2Data.person1) {
            this.federalWithheld += this.w2Data.person1.box2;
            this.stateWithheld += this.w2Data.person1.box17;
            this.socialSecurityWithheld += this.w2Data.person1.box4;
            this.medicareWithheld += this.w2Data.person1.box6;
        }
        
        if (this.w2Data.person2) {
            this.federalWithheld += this.w2Data.person2.box2;
            this.stateWithheld += this.w2Data.person2.box17;
            this.socialSecurityWithheld += this.w2Data.person2.box4;
            this.medicareWithheld += this.w2Data.person2.box6;
        }
        
        // Expand advanced deductions if we imported 401k, HSA, or withholding
        if ((box12Amount > 0 || box2 > 0 || box17 > 0) && !this.advancedExpanded) {
            this.toggleAdvancedDeductions();
        }
        
        // Update calculations and save
        this.update401kAmount();
        this.saveToStorage();
        
        // Update import status display
        this.updateW2ImportStatus();
        
        // Close modal
        this.closeW2Modal();
        
        // Switch to W-2 view if not already there
        if (this.currentView !== 'w2') {
            this.switchView('w2');
        }
    }
    
    saveToStorage() {
        const data = {
            // Manual entry data
            manual: {
                income1: this.income1Input.value,
                income2: this.income2Input.value,
                status: this.statusSelect.value,
                state: this.stateSelect.value,
                contribution401k: this.contribution401kInput.value,
                contributionHsa: this.contributionHsaInput.value,
                capitalLoss: this.capitalLossInput.value,
                dependents: this.dependentsInput.value,
                numPeople: this.numPeople,
                advancedExpanded: this.advancedExpanded,
                deductionType: this.deductionType,
                mortgageInterest: this.mortgageInterestInput.value,
                propertyTaxes: this.propertyTaxesInput.value,
                charitableDonations: this.charitableDonationsInput.value,
                medicalExpenses: this.medicalExpensesInput.value
            },
            // W-2 import data (completely separate)
            w2: {
                person1: this.w2Data.person1,
                person2: this.w2Data.person2,
                contribution401k: this.w2Data.contribution401k,
                contributionHsa: this.w2Data.contributionHsa,
                capitalLoss: this.w2Data.capitalLoss,
                dependents: this.w2Data.dependents,
                mortgageInterest: this.w2Data.mortgageInterest,
                propertyTaxes: this.w2Data.propertyTaxes,
                charitableDonations: this.w2Data.charitableDonations,
                medicalExpenses: this.w2Data.medicalExpenses,
                federalWithheld: this.federalWithheld,
                stateWithheld: this.stateWithheld,
                socialSecurityWithheld: this.socialSecurityWithheld,
                medicareWithheld: this.medicareWithheld,
                filingStatus: this.w2FilingStatus,
                state: this.w2StateSelect.value
            },
            // Global settings
            currentView: this.currentView
        };
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('Unable to save to localStorage:', e);
        }
    }
    
    loadFromStorage() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (!savedData) return;
            
            const data = JSON.parse(savedData);
            
            // Load manual entry data
            if (data.manual) {
                if (data.manual.income1) this.income1Input.value = data.manual.income1;
                if (data.manual.income2) this.income2Input.value = data.manual.income2;
                if (data.manual.status) this.statusSelect.value = data.manual.status;
                if (data.manual.state) this.stateSelect.value = data.manual.state;
                if (data.manual.contribution401k) this.contribution401kInput.value = data.manual.contribution401k;
                if (data.manual.contributionHsa) this.contributionHsaInput.value = data.manual.contributionHsa;
                if (data.manual.capitalLoss) this.capitalLossInput.value = data.manual.capitalLoss;
                if (data.manual.dependents) this.dependentsInput.value = data.manual.dependents;
                if (data.manual.mortgageInterest) this.mortgageInterestInput.value = data.manual.mortgageInterest;
                if (data.manual.propertyTaxes) this.propertyTaxesInput.value = data.manual.propertyTaxes;
                if (data.manual.charitableDonations) this.charitableDonationsInput.value = data.manual.charitableDonations;
                if (data.manual.medicalExpenses) this.medicalExpensesInput.value = data.manual.medicalExpenses;
                if (data.manual.numPeople) this.updatePeopleSelection(data.manual.numPeople);
                if (data.manual.advancedExpanded) this.toggleAdvancedDeductions();
                if (data.manual.deductionType) this.updateDeductionSelection(data.manual.deductionType);
            }
            
            // Load W-2 data (completely separate)
            if (data.w2) {
                if (data.w2.person1) this.w2Data.person1 = data.w2.person1;
                if (data.w2.person2) this.w2Data.person2 = data.w2.person2;
                if (data.w2.contribution401k !== undefined) this.w2Data.contribution401k = data.w2.contribution401k;
                if (data.w2.contributionHsa !== undefined) this.w2Data.contributionHsa = data.w2.contributionHsa;
                if (data.w2.capitalLoss !== undefined) this.w2Data.capitalLoss = data.w2.capitalLoss;
                if (data.w2.dependents !== undefined) this.w2Data.dependents = data.w2.dependents;
                if (data.w2.mortgageInterest !== undefined) this.w2Data.mortgageInterest = data.w2.mortgageInterest;
                if (data.w2.propertyTaxes !== undefined) this.w2Data.propertyTaxes = data.w2.propertyTaxes;
                if (data.w2.charitableDonations !== undefined) this.w2Data.charitableDonations = data.w2.charitableDonations;
                if (data.w2.medicalExpenses !== undefined) this.w2Data.medicalExpenses = data.w2.medicalExpenses;
                if (data.w2.federalWithheld !== undefined) this.federalWithheld = data.w2.federalWithheld;
                if (data.w2.stateWithheld !== undefined) this.stateWithheld = data.w2.stateWithheld;
                if (data.w2.socialSecurityWithheld !== undefined) this.socialSecurityWithheld = data.w2.socialSecurityWithheld;
                if (data.w2.medicareWithheld !== undefined) this.medicareWithheld = data.w2.medicareWithheld;
                if (data.w2.filingStatus) this.updateW2FilingStatus(data.w2.filingStatus);
                if (data.w2.state) this.w2StateSelect.value = data.w2.state;
            }
            
            // Handle legacy data format (for backwards compatibility)
            if (!data.manual && !data.w2) {
                // Old format - migrate to new format
                if (data.income1) this.income1Input.value = data.income1;
                if (data.income2) this.income2Input.value = data.income2;
                if (data.w2Data) {
                    this.w2Data.person1 = data.w2Data.person1;
                    this.w2Data.person2 = data.w2Data.person2;
                }
            }
            
            // Restore current view
            if (data.currentView) {
                this.switchView(data.currentView);
            }
            
            // Update 401k display
            this.update401kAmount();
            
            // Update W-2 import status
            this.updateW2ImportStatus();
        } catch (e) {
            console.warn('Unable to load from localStorage:', e);
        }
    }
    
    resetApp() {
        if (!confirm('Are you sure you want to reset all inputs and clear saved data?')) {
            return;
        }
        
        // Clear localStorage
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            console.warn('Unable to clear localStorage:', e);
        }
        
        // Reset all inputs
        this.income1Input.value = '';
        this.income2Input.value = '0';
        this.contribution401kInput.value = '0';
        this.contributionHsaInput.value = '0';
        this.capitalLossInput.value = '0';
        this.dependentsInput.value = '0';
        
        // Reset W-2 data
        this.federalWithheld = 0;
        this.stateWithheld = 0;
        this.socialSecurityWithheld = 0;
        this.medicareWithheld = 0;
        this.w2Data = {
            person1: null,
            person2: null
        };
        
        // Reset to 1 person
        this.updatePeopleSelection(1);
        
        // Collapse advanced deductions
        if (this.advancedExpanded) {
            this.toggleAdvancedDeductions();
        }
        
        // Hide results
        this.resultsDiv.classList.add('hidden');
        this.taxExplanationEl.classList.add('hidden');
        this.errorMessageEl.classList.add('hidden');
        
        // Update displays
        this.update401kAmount();
        this.updateW2ImportStatus();
        
        // Show confirmation
        alert('✅ App has been reset!');
    }
    
    updatePeopleSelection(numPeople) {
        this.numPeople = numPeople;
        
        // Update button states
        this.peopleBtns.forEach(btn => {
            const btnPeople = parseInt(btn.getAttribute('data-people'));
            if (btnPeople === numPeople) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Show/hide person 2 income
        if (numPeople === 2) {
            this.person2IncomeGroup.style.display = 'flex';
            // Update filing status options for 2 people
            this.statusSelect.innerHTML = `
                <option value="married_jointly">Married Filing Jointly</option>
                <option value="married_separately">Married Filing Separately</option>
            `;
        } else {
            this.person2IncomeGroup.style.display = 'none';
            this.income2Input.value = '0';
            // Update filing status options for 1 person
            this.statusSelect.innerHTML = `
                <option value="single">Single</option>
                <option value="head_of_household">Head of Household</option>
            `;
        }
        
        this.update401kAmount();
        this.saveToStorage();
    }
    
    updateDeductionSelection(deductionType) {
        this.deductionType = deductionType;
        
        // Update button states
        this.deductionBtns.forEach(btn => {
            const btnType = btn.getAttribute('data-deduction');
            if (btnType === deductionType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Show/hide itemized deductions
        if (deductionType === 'itemized') {
            this.itemizedDeductions.style.display = 'grid';
        } else {
            this.itemizedDeductions.style.display = 'none';
        }
        
        this.saveToStorage();
    }
    
    toggleAdvancedDeductions() {
        this.advancedExpanded = !this.advancedExpanded;
        
        if (this.advancedExpanded) {
            this.advancedDeductions.classList.remove('collapsed');
            this.advancedToggle.classList.add('expanded');
        } else {
            this.advancedDeductions.classList.add('collapsed');
            this.advancedToggle.classList.remove('expanded');
        }
        
        this.saveToStorage();
    }

    validateNumericInput(e) {
        const value = e.target.value;
        if (value && isNaN(value)) {
            e.target.classList.add('error');
        } else {
            e.target.classList.remove('error');
        }
    }

    populateStates() {
        const states = [
            "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", 
            "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", 
            "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", 
            "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", 
            "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", 
            "New Hampshire", "New Jersey", "New Mexico", "New York", 
            "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", 
            "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
            "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", 
            "West Virginia", "Wisconsin", "Wyoming"
        ];
        
        const stateAbbrs = [
            "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", 
            "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", 
            "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", 
            "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", 
            "VT", "VA", "WA", "WV", "WI", "WY"
        ];

        // Populate manual view state selector
        states.forEach((state, index) => {
            const option = document.createElement('option');
            option.value = stateAbbrs[index];
            option.textContent = state;
            this.stateSelect.appendChild(option);
        });
        
        this.stateSelect.value = 'CA'; // Default to California
        
        // Populate W-2 view state selector
        states.forEach((state, index) => {
            const option = document.createElement('option');
            option.value = stateAbbrs[index];
            option.textContent = state;
            this.w2StateSelect.appendChild(option);
        });
        
        this.w2StateSelect.value = 'CA'; // Default to California
    }

    update401kAmount() {
        // Calculate max limit based on each person's income
        const income1 = parseFloat(this.income1Input.value) || 0;
        const income2 = parseFloat(this.income2Input.value) || 0;
        
        // Person 1 can contribute up to min(income1, 23500)
        const person1Max = Math.min(income1, this.contributionLimits.contribution401k);
        
        // Person 2 can contribute up to min(income2, 23500) if they have income
        const person2Max = income2 > 0 ? Math.min(income2, this.contributionLimits.contribution401k) : 0;
        
        // Total max is the sum of both individual maxes
        const maxLimit = person1Max + person2Max;
        
        // Update display text similar to HSA format
        if (this.numPeople === 2 && income2 > 0) {
            this.contributionMaxEl.textContent = `${this.formatCurrency(person1Max)} + ${this.formatCurrency(person2Max)} = ${this.formatCurrency(maxLimit)}`;
        } else {
            this.contributionMaxEl.textContent = `${this.formatCurrency(maxLimit)} per person`;
        }
        
        // Update input max attribute
        this.contribution401kInput.setAttribute('max', maxLimit);
    }

    calculatePotentialSavings(results) {
        const currentStatus = this.statusSelect.value;
        const currentState = this.stateSelect.value;
        
        // Calculate potential 401k savings
        const remaining401k = this.contributionLimits.contribution401k - results.contribution401k;
        const potential401kSavings = remaining401k > 0 ? 
            this.calculateTaxSavings(results.grossIncome, remaining401k, 0, '2025', currentStatus, currentState) : 0;

        // Calculate potential HSA savings
        const remainingHsa = this.contributionLimits.hsaFamily - results.contributionHsa;
        const potentialHsaSavings = remainingHsa > 0 ? 
            this.calculateTaxSavings(results.grossIncome, 0, remainingHsa, '2025', currentStatus, currentState) : 0;

        return {
            contribution401k: potential401kSavings,
            contributionHsa: potentialHsaSavings,
            total: potential401kSavings + potentialHsaSavings
        };
    }

    calculateProgressiveTax(income, brackets) {
        let tax = 0;
        let remainingIncome = income;
        
        for (const bracket of brackets) {
            if (remainingIncome <= 0) break;
            
            const taxableInBracket = Math.min(
                remainingIncome, 
                bracket.max - (bracket.min > 0 ? bracket.min - 1 : 0)
            );
            
            tax += taxableInBracket * bracket.rate;
            remainingIncome -= taxableInBracket;
        }
        
        return tax;
    }

    calculateTaxSavings(grossIncome, contribution401k, contributionHsa, year, status, state) {
        const totalPreTaxContributions = contribution401k + contributionHsa;
        
        // Calculate tax without pre-tax contributions
        const standardDeduction = this.standardDeductions[year][status];
        const taxableIncomeWithout = Math.max(0, grossIncome - standardDeduction);
        const federalBrackets = this.federalTaxData[year][status];
        const federalTaxWithout = this.calculateProgressiveTax(taxableIncomeWithout, federalBrackets);
        
        // Calculate tax with pre-tax contributions
        const adjustedGrossIncome = Math.max(0, grossIncome - totalPreTaxContributions);
        const taxableIncomeWith = Math.max(0, adjustedGrossIncome - standardDeduction);
        const federalTaxWith = this.calculateProgressiveTax(taxableIncomeWith, federalBrackets);
        
        // Calculate state tax savings
        let stateTaxSavings = 0;
        const stateInfo = this.stateTaxData[state];
        if (stateInfo && stateInfo.type !== 'none') {
            if (stateInfo.type === 'progressive') {
                const stateTaxWithout = this.calculateProgressiveTax(grossIncome, stateInfo.brackets);
                const stateTaxWith = this.calculateProgressiveTax(adjustedGrossIncome, stateInfo.brackets);
                stateTaxSavings = stateTaxWithout - stateTaxWith;
            } else if (stateInfo.type === 'flat') {
                stateTaxSavings = totalPreTaxContributions * stateInfo.rate;
            }
        }
        
        const federalTaxSavings = federalTaxWithout - federalTaxWith;
        return federalTaxSavings + stateTaxSavings;
    }

    calculateTaxes() {
        // Clear previous errors
        this.errorMessageEl.textContent = '';
        this.errorMessageEl.classList.add('hidden');
        
        // Get input values
        const income1 = parseFloat(this.income1Input.value) || 0;
        const income2 = parseFloat(this.income2Input.value) || 0;
        const grossIncome = income1 + income2;
        const year = '2025'; // Fixed to 2025
        const status = this.statusSelect.value;
        const state = this.stateSelect.value;
        const contribution401k = parseFloat(this.contribution401kInput.value) || 0;
        
        // Calculate max 401k based on each person's income
        const person1Max = Math.min(income1, this.contributionLimits.contribution401k);
        const person2Max = income2 > 0 ? Math.min(income2, this.contributionLimits.contribution401k) : 0;
        const maxContribution401k = person1Max + person2Max;
        
        const contributionHsa = parseFloat(this.contributionHsaInput.value) || 0;
        const capitalLoss = parseFloat(this.capitalLossInput.value) || 0;
        const dependents = parseInt(this.dependentsInput.value) || 0;
        
        // Get itemized deductions if applicable
        const mortgageInterest = parseFloat(this.mortgageInterestInput.value) || 0;
        const propertyTaxes = parseFloat(this.propertyTaxesInput.value) || 0;
        const charitableDonations = parseFloat(this.charitableDonationsInput.value) || 0;
        const medicalExpenses = parseFloat(this.medicalExpensesInput.value) || 0;

        // Validate inputs
        if (grossIncome <= 0) {
            this.showError('Please enter a valid positive income.');
            return;
        }

        if (grossIncome > 10000000) {
            this.showError('Income amount is too large. Please enter a reasonable amount.');
            return;
        }

        if (dependents < 0) {
            this.showError('Number of dependents cannot be negative.');
            return;
        }

        if (contribution401k < 0) {
            this.showError('401(k) contribution cannot be negative.');
            return;
        }

        if (contribution401k > grossIncome) {
            this.showError('401(k) contribution cannot exceed your total income.');
            return;
        }

        if (contribution401k > maxContribution401k) {
            let errorMsg = `401(k) contribution cannot exceed ${this.formatCurrency(maxContribution401k)}. `;
            if (this.numPeople === 2 && income2 > 0) {
                errorMsg += `(Person 1: max ${this.formatCurrency(person1Max)}, Person 2: max ${this.formatCurrency(person2Max)})`;
            } else {
                errorMsg += `Each person can contribute up to the lesser of their income or $23,500.`;
            }
            this.showError(errorMsg);
            return;
        }

        if (contributionHsa < 0) {
            this.showError('HSA contribution cannot be negative.');
            return;
        }

        if (contributionHsa > this.contributionLimits.hsaFamily) {
            this.showError(`HSA contribution cannot exceed $${this.contributionLimits.hsaFamily.toLocaleString()} for family coverage.`);
            return;
        }

        if (capitalLoss < 0) {
            this.showError('Capital loss cannot be negative.');
            return;
        }

        // Show loading state
        this.showLoadingState();

        // Calculate taxes with a slight delay for better UX
        setTimeout(() => {
            try {
                const itemizedDeductions = {
                    mortgageInterest,
                    propertyTaxes,
                    charitableDonations,
                    medicalExpenses
                };
                // Manual view doesn't use withholding
                const results = this.performTaxCalculation(grossIncome, year, status, state, contribution401k, contributionHsa, capitalLoss, dependents, itemizedDeductions, 0, 0);
                this.displayResults(results);
            } catch (error) {
                this.showError('An error occurred during calculation. Please try again.');
                console.error('Tax calculation error:', error);
            }
        }, 800);
    }

    calculateW2Taxes() {
        // Use W-2 imported data ONLY (completely separate from manual entry)
        const income1 = (this.w2Data.person1 && this.w2Data.person1.box1) || 0;
        const income2 = (this.w2Data.person2 && this.w2Data.person2.box1) || 0;
        const grossIncome = income1 + income2;
        const year = '2025';
        const status = this.w2FilingStatus; // Use W-2 specific filing status
        const state = this.w2StateSelect.value; // Use W-2 specific state
        const contribution401k = this.w2Data.contribution401k || 0;
        const contributionHsa = this.w2Data.contributionHsa || 0;
        const capitalLoss = this.w2Data.capitalLoss || 0;
        const dependents = this.w2Data.dependents || 0;
        
        const mortgageInterest = this.w2Data.mortgageInterest || 0;
        const propertyTaxes = this.w2Data.propertyTaxes || 0;
        const charitableDonations = this.w2Data.charitableDonations || 0;
        const medicalExpenses = this.w2Data.medicalExpenses || 0;
        
        if (grossIncome <= 0) {
            this.showW2Error('Please import at least one W-2 form.');
            return;
        }
        
        try {
            const itemizedDeductions = {
                mortgageInterest,
                propertyTaxes,
                charitableDonations,
                medicalExpenses
            };
            const results = this.performTaxCalculation(grossIncome, year, status, state, contribution401k, contributionHsa, capitalLoss, dependents, itemizedDeductions, this.federalWithheld, this.stateWithheld);
            this.displayW2Results(results);
        } catch (error) {
            this.showW2Error('An error occurred during calculation. Please try again.');
            console.error('W-2 tax calculation error:', error);
        }
    }

    performTaxCalculation(grossIncome, year, status, state, contribution401k, contributionHsa, capitalLoss, dependents, itemizedDeductions, federalWithheld, stateWithheld) {
        // 1. Calculate FICA Taxes (Social Security & Medicare)
        // Note: FICA is calculated on gross wages BEFORE 401k/HSA deductions
        // Social Security: 6.2% up to wage base limit
        const socialSecurityWages = Math.min(grossIncome, this.ficaRates.socialSecurityWageBase);
        const socialSecurityTax = socialSecurityWages * this.ficaRates.socialSecurity;
        
        // Medicare: 1.45% on all wages
        const medicareTax = grossIncome * this.ficaRates.medicare;
        
        // Additional Medicare Tax: 0.9% on wages over threshold
        const additionalMedicareThreshold = this.ficaRates.additionalMedicareThreshold[status];
        const additionalMedicareTax = grossIncome > additionalMedicareThreshold ?
            (grossIncome - additionalMedicareThreshold) * this.ficaRates.additionalMedicare : 0;
        
        const totalFicaTax = socialSecurityTax + medicareTax + additionalMedicareTax;
        
        // 2. Calculate capital loss deduction (IRS Topic 409)
        const maxCapitalLossDeduction = (status === 'married_separately') ? 1500 : 3000;
        const capitalLossDeduction = Math.min(capitalLoss, maxCapitalLossDeduction);
        const capitalLossCarryforward = Math.max(0, capitalLoss - maxCapitalLossDeduction);

        // 2. Federal Tax Calculation
        const standardDeduction = this.standardDeductions[year][status];
        
        // Subtract 401k, HSA contributions, and capital loss from gross income
        const adjustedGrossIncome = Math.max(0, grossIncome - contribution401k - contributionHsa - capitalLossDeduction);
        
        // Calculate deduction to use (standard vs itemized)
        let deduction = standardDeduction;
        let deductionType = 'standard';
        let itemizedTotal = 0;
        
        if (this.deductionType === 'itemized') {
            // Calculate medical expenses deduction (only amount exceeding 7.5% of AGI)
            const medicalThreshold = adjustedGrossIncome * 0.075;
            const deductibleMedicalExpenses = Math.max(0, itemizedDeductions.medicalExpenses - medicalThreshold);
            
            // Sum up all itemized deductions
            itemizedTotal = itemizedDeductions.mortgageInterest + 
                           itemizedDeductions.propertyTaxes + 
                           itemizedDeductions.charitableDonations + 
                           deductibleMedicalExpenses;
            
            // Use itemized if greater than standard deduction
            if (itemizedTotal > standardDeduction) {
                deduction = itemizedTotal;
                deductionType = 'itemized';
            }
        }
        
        const taxableIncome = Math.max(0, adjustedGrossIncome - deduction);
        
        const federalBrackets = this.federalTaxData[year][status];
        let federalTax = this.calculateProgressiveTax(taxableIncome, federalBrackets);

        // Apply child tax credit
        const childCredit = this.childTaxCredits[year] * dependents;
        federalTax = Math.max(0, federalTax - childCredit);

        // 2. State Tax Calculation
        const stateInfo = this.stateTaxData[state];
        let stateTax = 0;
        
        if (stateInfo) {
            if (stateInfo.type === 'progressive') {
                // Most states also allow 401k deduction
                stateTax = this.calculateProgressiveTax(adjustedGrossIncome, stateInfo.brackets);
            } else if (stateInfo.type === 'flat') {
                stateTax = adjustedGrossIncome * stateInfo.rate;
            }
            // 'none' type results in 0 tax
        }

        // 3. Calculate totals and savings
        const totalTax = federalTax + stateTax;
        const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;
        
        // Calculate tax savings from 401k and HSA contributions
        const taxSavings = (contribution401k > 0 || contributionHsa > 0) ? 
            this.calculateTaxSavings(grossIncome, contribution401k, contributionHsa, year, status, state) : 0;

        // Calculate total tax owed including FICA
        const totalTaxOwed = totalTax + totalFicaTax;
        
        // Total withheld includes federal, state, Social Security, and Medicare
        const socialSecurityWithheld = this.socialSecurityWithheld || 0;
        const medicareWithheld = this.medicareWithheld || 0;
        const totalWithheld = federalWithheld + stateWithheld + socialSecurityWithheld + medicareWithheld;
        
        // Calculate refund or amount owed
        const refundOrOwed = totalWithheld - totalTaxOwed;
        const isRefund = refundOrOwed > 0;
        
        return {
            federal: federalTax,
            state: stateTax,
            total: totalTax,
            socialSecurityTax: socialSecurityTax,
            medicareTax: medicareTax,
            additionalMedicareTax: additionalMedicareTax,
            totalFicaTax: totalFicaTax,
            totalTaxOwed: totalTaxOwed,
            federalWithheld: federalWithheld,
            stateWithheld: stateWithheld,
            totalWithheld: totalWithheld,
            refundOrOwed: refundOrOwed,
            isRefund: isRefund,
            effectiveRate: effectiveRate,
            effectiveRateWithFica: grossIncome > 0 ? (totalTaxOwed / grossIncome) * 100 : 0,
            grossIncome: grossIncome,
            adjustedGrossIncome: adjustedGrossIncome,
            standardDeduction: standardDeduction,
            deduction: deduction,
            deductionType: deductionType,
            itemizedTotal: itemizedTotal,
            taxableIncome: taxableIncome,
            contribution401k: contribution401k,
            contributionHsa: contributionHsa,
            capitalLoss: capitalLoss,
            capitalLossDeduction: capitalLossDeduction,
            capitalLossCarryforward: capitalLossCarryforward,
            childCredit: childCredit,
            taxSavings: taxSavings,
            dependents: dependents,
            itemizedDeductions: itemizedDeductions
        };
    }

    showLoadingState() {
        this.btnText.classList.add('hidden');
        this.loader.classList.remove('hidden');
        this.calculateBtn.disabled = true;
        this.resultsDiv.classList.add('hidden');
        this.resultsDiv.classList.remove('fade-in');
        this.taxExplanationEl.classList.add('hidden');
    }

    displayResults(results) {
        // Update result values for manual view (includes FICA in total)
        this.federalTaxEl.textContent = this.formatCurrency(results.federal);
        this.stateTaxEl.textContent = this.formatCurrency(results.state);
        
        // Get FICA elements for manual view
        const socialSecurityTaxEl = document.getElementById('social-security-tax');
        const medicareTaxEl = document.getElementById('medicare-tax');
        
        if (socialSecurityTaxEl && medicareTaxEl) {
            socialSecurityTaxEl.textContent = this.formatCurrency(results.socialSecurityTax);
            medicareTaxEl.textContent = this.formatCurrency(results.medicareTax + results.additionalMedicareTax);
        }
        
        // Show total including FICA
        this.totalTaxEl.textContent = this.formatCurrency(results.totalTaxOwed);
        this.effectiveRateEl.textContent = `${results.effectiveRateWithFica.toFixed(2)}%`;

        // Generate and display explanation
        this.displayTaxExplanation(results);

        // Show results with animation
        this.resultsDiv.classList.remove('hidden');
        this.resultsDiv.classList.add('fade-in');

        // Reset button state
        this.btnText.classList.remove('hidden');
        this.loader.classList.add('hidden');
        this.calculateBtn.disabled = false;

        // Add a subtle success indication
        this.calculateBtn.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
        setTimeout(() => {
            this.calculateBtn.style.background = 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))';
        }, 2000);
    }

    displayTaxExplanation(results) {
        const explanationItems = [
            { label: 'Annual Gross Income', value: this.formatCurrency(results.grossIncome), type: 'base' }
        ];

        // Add pre-tax deductions in order
        if (results.contribution401k > 0) {
            explanationItems.push({
                label: '📊 401(k) Contribution (Pre-tax)',
                value: `- ${this.formatCurrency(results.contribution401k)}`,
                type: 'deduction'
            });
        }

        if (results.contributionHsa > 0) {
            explanationItems.push({
                label: '🏥 HSA Contribution (Pre-tax)',
                value: `- ${this.formatCurrency(results.contributionHsa)}`,
                type: 'deduction'
            });
        }

        if (results.capitalLossDeduction > 0) {
            explanationItems.push({
                label: '📉 Capital Loss Deduction',
                value: `- ${this.formatCurrency(results.capitalLossDeduction)}`,
                type: 'deduction'
            });
        }

        // Show adjusted gross income if there were pre-tax deductions
        if (results.contribution401k > 0 || results.contributionHsa > 0) {
            explanationItems.push({
                label: 'Adjusted Gross Income',
                value: this.formatCurrency(results.adjustedGrossIncome),
                type: 'base'
            });
        }

        // Add deduction (standard or itemized)
        if (results.deductionType === 'itemized') {
            explanationItems.push({
                label: '📋 Itemized Deductions',
                value: `- ${this.formatCurrency(results.itemizedTotal)}`,
                type: 'deduction'
            });
            
            // Show breakdown of itemized deductions
            if (results.itemizedDeductions.mortgageInterest > 0) {
                explanationItems.push({
                    label: '  • Mortgage Interest',
                    value: `${this.formatCurrency(results.itemizedDeductions.mortgageInterest)}`,
                    type: 'deduction-detail'
                });
            }
            if (results.itemizedDeductions.propertyTaxes > 0) {
                explanationItems.push({
                    label: '  • Property Taxes',
                    value: `${this.formatCurrency(results.itemizedDeductions.propertyTaxes)}`,
                    type: 'deduction-detail'
                });
            }
            if (results.itemizedDeductions.charitableDonations > 0) {
                explanationItems.push({
                    label: '  • Charitable Donations',
                    value: `${this.formatCurrency(results.itemizedDeductions.charitableDonations)}`,
                    type: 'deduction-detail'
                });
            }
            if (results.itemizedDeductions.medicalExpenses > 0) {
                const medicalThreshold = results.adjustedGrossIncome * 0.075;
                const deductibleMedical = Math.max(0, results.itemizedDeductions.medicalExpenses - medicalThreshold);
                if (deductibleMedical > 0) {
                    explanationItems.push({
                        label: '  • Medical Expenses (above 7.5% AGI)',
                        value: `${this.formatCurrency(deductibleMedical)}`,
                        type: 'deduction-detail'
                    });
                }
            }
        } else {
            explanationItems.push({
                label: 'Standard Deduction',
                value: `- ${this.formatCurrency(results.standardDeduction)}`,
                type: 'deduction'
            });
        }

        explanationItems.push({
            label: 'Taxable Income',
            value: this.formatCurrency(results.taxableIncome),
            type: 'base'
        });

        // Add tax credits after tax calculation
        if (results.childCredit > 0) {
            explanationItems.push({
                label: `👶 Child Tax Credit (${results.dependents} ${results.dependents === 1 ? 'child' : 'children'})`,
                value: `- ${this.formatCurrency(results.childCredit)}`,
                type: 'savings'
            });
        }

        // Add FICA taxes explanation
        explanationItems.push({
            label: '🏛️ FICA Taxes (Employee Share)',
            value: this.formatCurrency(results.totalFicaTax),
            type: 'info'
        });

        if (results.socialSecurityTax > 0) {
            explanationItems.push({
                label: '  • Social Security (6.2% up to $176,100)',
                value: this.formatCurrency(results.socialSecurityTax),
                type: 'deduction-detail'
            });
        }

        if (results.medicareTax > 0) {
            explanationItems.push({
                label: '  • Medicare (1.45% on all wages)',
                value: this.formatCurrency(results.medicareTax),
                type: 'deduction-detail'
            });
        }

        if (results.additionalMedicareTax > 0) {
            explanationItems.push({
                label: '  • Additional Medicare (0.9% over threshold)',
                value: this.formatCurrency(results.additionalMedicareTax),
                type: 'deduction-detail'
            });
        }

        // Add total tax savings at the end
        if ((results.contribution401k > 0 || results.contributionHsa > 0) && results.taxSavings > 0) {
            explanationItems.push({
                label: '💰 Total Tax Savings from Pre-tax Benefits',
                value: this.formatCurrency(results.taxSavings),
                type: 'savings'
            });
        }

        // Add capital loss carryforward info
        if (results.capitalLossCarryforward > 0) {
            explanationItems.push({
                label: '📊 Capital Loss Carryforward to Next Year',
                value: this.formatCurrency(results.capitalLossCarryforward),
                type: 'info'
            });
        }

        const explanationHTML = `
            <ul>
                ${explanationItems.map(item => `
                    <li>
                        <span class="explanation-label ${item.type}">${item.label}</span>
                        <span class="explanation-value ${item.type}">${item.value}</span>
                    </li>
                `).join('')}
            </ul>
        `;

        this.explanationContentEl.innerHTML = explanationHTML;
        this.taxExplanationEl.classList.remove('hidden');
        
        // Display Genie Suggestions in separate section
        const potentialSavings = this.calculatePotentialSavings(results);
        if (potentialSavings.total > 0) {
            const genieTips = [];
            
            if (potentialSavings.contribution401k > 0) {
                genieTips.push({
                    icon: '✨',
                    label: 'Max out your 401(k) contribution',
                    amount: this.formatCurrency(potentialSavings.contribution401k)
                });
            }

            if (potentialSavings.contributionHsa > 0) {
                genieTips.push({
                    icon: '✨',
                    label: 'Max out your HSA contribution',
                    amount: this.formatCurrency(potentialSavings.contributionHsa)
                });
            }

            const genieTipsHTML = genieTips.map(tip => `
                <div class="genie-tip-card">
                    <span class="genie-tip-icon">${tip.icon}</span>
                    <div class="genie-tip-content">
                        <div class="genie-tip-label">${tip.label}</div>
                        <div class="genie-tip-amount">Save an additional ${tip.amount} in taxes!</div>
                    </div>
                </div>
            `).join('');

            this.genieTipsEl.innerHTML = genieTipsHTML;
            this.genieTotalAmount.textContent = this.formatCurrency(potentialSavings.total);
            this.genieTotalBox.classList.remove('hidden');
            this.genieSectionEl.classList.remove('hidden');
        } else {
            this.genieSectionEl.classList.add('hidden');
        }
    }

    showError(message) {
        this.errorMessageEl.textContent = message;
        this.errorMessageEl.classList.remove('hidden');
        this.resultsDiv.classList.add('hidden');
        this.resultsDiv.classList.remove('fade-in');
        this.taxExplanationEl.classList.add('hidden');
        this.genieSectionEl.classList.add('hidden');
        
        // Reset button state
        this.btnText.classList.remove('hidden');
        this.loader.classList.add('hidden');
        this.calculateBtn.disabled = false;
    }

    showW2Error(message) {
        this.w2ErrorMessageEl.textContent = message;
        this.w2ErrorMessageEl.classList.remove('hidden');
    }

    displayW2Results(results) {
        // Update result values for W-2 view (includes FICA and refund)
        this.w2FederalTaxEl.textContent = this.formatCurrency(results.federal);
        this.w2StateTaxEl.textContent = this.formatCurrency(results.state);
        this.w2SocialSecurityTaxEl.textContent = this.formatCurrency(results.socialSecurityTax);
        this.w2MedicareTaxEl.textContent = this.formatCurrency(results.medicareTax + results.additionalMedicareTax);
        this.w2TotalTaxEl.textContent = this.formatCurrency(results.totalTaxOwed);
        this.w2TotalWithheldEl.textContent = this.formatCurrency(results.totalWithheld);
        
        // Display refund or amount owed
        if (results.isRefund) {
            this.w2RefundLabelEl.textContent = '💰 Estimated Refund';
            this.w2RefundAmountEl.textContent = this.formatCurrency(Math.abs(results.refundOrOwed));
            this.w2RefundAmountEl.classList.add('refund-positive');
            this.w2RefundAmountEl.classList.remove('refund-negative');
        } else {
            this.w2RefundLabelEl.textContent = '⚠️ Amount You Owe';
            this.w2RefundAmountEl.textContent = this.formatCurrency(Math.abs(results.refundOrOwed));
            this.w2RefundAmountEl.classList.add('refund-negative');
            this.w2RefundAmountEl.classList.remove('refund-positive');
        }
        
        this.w2EffectiveRateEl.textContent = `${results.effectiveRateWithFica.toFixed(2)}%`;

        // Generate and display explanation for W-2 view
        this.displayW2TaxExplanation(results);

        // Show results
        this.w2ResultsDiv.classList.remove('hidden');
        this.w2ResultsDiv.classList.add('fade-in');
        
        // Clear error
        this.w2ErrorMessageEl.classList.add('hidden');
    }

    displayW2TaxExplanation(results) {
        // Similar to displayTaxExplanation but for W-2 view
        const explanationItems = [
            { label: 'Annual Gross Income', value: this.formatCurrency(results.grossIncome), type: 'base' }
        ];

        // Add pre-tax deductions
        if (results.contribution401k > 0) {
            explanationItems.push({
                label: '📊 401(k) Contribution (Pre-tax)',
                value: `- ${this.formatCurrency(results.contribution401k)}`,
                type: 'deduction'
            });
        }

        if (results.contributionHsa > 0) {
            explanationItems.push({
                label: '🏥 HSA Contribution (Pre-tax)',
                value: `- ${this.formatCurrency(results.contributionHsa)}`,
                type: 'deduction'
            });
        }

        if (results.capitalLossDeduction > 0) {
            explanationItems.push({
                label: '📉 Capital Loss Deduction',
                value: `- ${this.formatCurrency(results.capitalLossDeduction)}`,
                type: 'deduction'
            });
        }

        if (results.contribution401k > 0 || results.contributionHsa > 0) {
            explanationItems.push({
                label: 'Adjusted Gross Income',
                value: this.formatCurrency(results.adjustedGrossIncome),
                type: 'base'
            });
        }

        // Add FICA explanation first
        explanationItems.push({
            label: '🏛️ FICA Taxes (Employee Share)',
            value: this.formatCurrency(results.totalFicaTax),
            type: 'info'
        });

        if (results.socialSecurityTax > 0) {
            explanationItems.push({
                label: '  • Social Security (6.2% up to $176,100)',
                value: this.formatCurrency(results.socialSecurityTax),
                type: 'deduction-detail'
            });
        }

        if (results.medicareTax > 0) {
            explanationItems.push({
                label: '  • Medicare (1.45% on all wages)',
                value: this.formatCurrency(results.medicareTax),
                type: 'deduction-detail'
            });
        }

        if (results.additionalMedicareTax > 0) {
            explanationItems.push({
                label: '  • Additional Medicare (0.9% over threshold)',
                value: this.formatCurrency(results.additionalMedicareTax),
                type: 'deduction-detail'
            });
        }

        const explanationHTML = `
            <ul>
                ${explanationItems.map(item => `
                    <li>
                        <span class="explanation-label ${item.type}">${item.label}</span>
                        <span class="explanation-value ${item.type}">${item.value}</span>
                    </li>
                `).join('')}
            </ul>
        `;

        this.w2ExplanationContentEl.innerHTML = explanationHTML;
        this.w2TaxExplanationEl.classList.remove('hidden');
        
        // Display Genie Suggestions for W-2 view
        const potentialSavings = this.calculatePotentialSavings(results);
        if (potentialSavings.total > 0) {
            this.displayW2GenieSection(potentialSavings);
        } else {
            this.w2GenieSectionEl.classList.add('hidden');
        }
    }

    displayW2GenieSection(potentialSavings) {
        const genieTips = [];
        
        if (potentialSavings.contribution401k > 0) {
            genieTips.push({
                icon: '✨',
                label: 'Max out your 401(k) contribution',
                amount: this.formatCurrency(potentialSavings.contribution401k)
            });
        }

        if (potentialSavings.contributionHsa > 0) {
            genieTips.push({
                icon: '✨',
                label: 'Max out your HSA contribution',
                amount: this.formatCurrency(potentialSavings.contributionHsa)
            });
        }

        const genieTipsHTML = genieTips.map(tip => `
            <div class="genie-tip-card">
                <span class="genie-tip-icon">${tip.icon}</span>
                <div class="genie-tip-content">
                    <div class="genie-tip-label">${tip.label}</div>
                    <div class="genie-tip-amount">Save an additional ${tip.amount} in taxes!</div>
                </div>
            </div>
        `).join('');

        this.w2GenieTipsEl.innerHTML = genieTipsHTML;
        this.w2GenieTotalAmount.textContent = this.formatCurrency(potentialSavings.total);
        this.w2GenieTotalBox.classList.remove('hidden');
        this.w2GenieSectionEl.classList.remove('hidden');
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
    
    formatNumber(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    updateYearDisplay() {
        const deadlineElement = document.getElementById('tax-deadline');
        if (deadlineElement && this.currentYear) {
            const nextYear = this.currentYear + 1;
            deadlineElement.textContent = `${this.currentYear} Tax Year • File by April 15, ${nextYear}`;
        }
    }
}

// Initialize the tax calculator when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TaxCalculator();
    
    // Add some fun easter eggs
    console.log('🎉 Tax Calculator loaded! Built with modern JavaScript and love for clean code.');
    
    // Add keyboard shortcut for quick calculation (Ctrl/Cmd + Enter)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            document.getElementById('calculateBtn').click();
        }
    });
    
    // PWA Install Prompt
    let deferredPrompt;
    const installBtn = document.getElementById('install-btn');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'inline-flex';
    });
    
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        
        deferredPrompt = null;
        installBtn.style.display = 'none';
    });
    
    window.addEventListener('appinstalled', () => {
        console.log('✅ PWA installed successfully!');
        installBtn.style.display = 'none';
    });
});