class CoronaAssistApp {
    constructor() {
        this.currentStep = 1;
        this.assessmentData = {
            symptoms: [],
            temperature: null,
            has_chronic_conditions: false,
            symptom_onset: null
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.showStep(1);
        this.loadTestingCenters();
    }

    bindEvents() {
        // Symptom selection
        document.querySelectorAll('.symptom-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.toggleSymptom(e.target));
        });

        // Navigation
        document.getElementById('next-btn').addEventListener('click', () => this.nextStep());
        document.getElementById('prev-btn').addEventListener('click', () => this.prevStep());
        document.getElementById('submit-assessment').addEventListener('click', () => this.submitAssessment());

        // Temperature input
        document.getElementById('temperature').addEventListener('input', (e) => {
            this.assessmentData.temperature = parseFloat(e.target.value);
            this.updateTemperatureDisplay();
        });
    }

    toggleSymptom(checkbox) {
        const symptom = checkbox.value;
        if (checkbox.checked) {
            this.assessmentData.symptoms.push(symptom);
        } else {
            this.assessmentData.symptoms = this.assessmentData.symptoms.filter(s => s !== symptom);
        }
        this.updateSymptomsSummary();
    }

    updateSymptomsSummary() {
        const summary = document.getElementById('symptoms-summary');
        if (this.assessmentData.symptoms.length > 0) {
            summary.textContent = `Selected symptoms: ${this.assessmentData.symptoms.join(', ')}`;
            summary.classList.remove('d-none');
        } else {
            summary.classList.add('d-none');
        }
    }

    updateTemperatureDisplay() {
        const display = document.getElementById('temp-display');
        if (this.assessmentData.temperature) {
            display.textContent = `${this.assessmentData.temperature}°C`;
            this.updateRiskIndicator();
        }
    }

    updateRiskIndicator() {
        // Simple client-side risk estimation
        let riskScore = 0;
        
        if (this.assessmentData.temperature > 38) riskScore += 2;
        if (this.assessmentData.symptoms.includes('fever')) riskScore += 3;
        if (this.assessmentData.symptoms.includes('shortness_of_breath')) riskScore += 3;
        
        const indicator = document.getElementById('risk-indicator');
        if (riskScore >= 5) {
            indicator.className = 'risk-high';
            indicator.textContent = 'High Risk - Seek Medical Attention';
        } else if (riskScore >= 2) {
            indicator.className = 'risk-medium';
            indicator.textContent = 'Medium Risk - Get Tested';
        } else {
            indicator.className = 'risk-low';
            indicator.textContent = 'Low Risk - Monitor Symptoms';
        }
    }

    async loadTestingCenters() {
        try {
            const response = await fetch('api/centers.php');
            const centers = await response.json();
            this.renderTestingCenters(centers);
        } catch (error) {
            console.error('Error loading testing centers:', error);
        }
    }

    renderTestingCenters(centers) {
        const container = document.getElementById('testing-centers-list');
        container.innerHTML = centers.map(center => `
            <div class="testing-center-card" data-lat="${center.latitude}" data-lng="${center.longitude}">
                <h4>${center.name}</h4>
                <p>${center.address}</p>
                <p>📞 ${center.phone}</p>
                <p>⏰ ${center.hours_operation}</p>
                <p>Available slots: ${center.available_slots}</p>
                <button class="btn btn-primary btn-sm" onclick="app.scheduleAppointment(${center.id})">
                    Schedule Test
                </button>
            </div>
        `).join('');
    }

    showStep(step) {
        // Hide all steps
        document.querySelectorAll('.assessment-step').forEach(s => s.classList.add('d-none'));
        
        // Show current step
        document.getElementById(`step-${step}`).classList.remove('d-none');
        
        // Update navigation
        document.getElementById('prev-btn').style.display = step > 1 ? 'block' : 'none';
        document.getElementById('next-btn').style.display = step < 4 ? 'block' : 'none';
        document.getElementById('submit-assessment').style.display = step === 4 ? 'block' : 'none';
        
        this.currentStep = step;
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            this.showStep(this.currentStep + 1);
        }
    }

    prevStep() {
        this.showStep(this.currentStep - 1);
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.assessmentData.symptoms.length > 0;
            case 2:
                return this.assessmentData.temperature !== null;
            case 3:
                return this.assessmentData.symptom_onset !== null;
            default:
                return true;
        }
    }

    async submitAssessment() {
        if (!this.validateCurrentStep()) {
            this.showError('Please complete all required fields');
            return;
        }

        try {
            const response = await fetch('api/assessment.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.assessmentData)
            });

            const result = await response.json();

            if (response.ok) {
                this.showResults(result);
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
        }
    }

    showResults(result) {
        document.getElementById('assessment-results').innerHTML = `
            <div class="alert alert-${result.risk_level === 'high' ? 'danger' : result.risk_level === 'medium' ? 'warning' : 'success'}">
                <h4>Risk Level: ${result.risk_level.toUpperCase()}</h4>
                <p>Based on your symptoms, here are our recommendations:</p>
                <ul>
                    ${JSON.parse(result.recommendations).map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            <div class="mt-3">
                <button class="btn btn-primary" onclick="app.scheduleTest()">Schedule COVID Test</button>
                <button class="btn btn-secondary" onclick="app.startNewAssessment()">New Assessment</button>
            </div>
        `;
        this.showStep(5);
    }

    scheduleTest() {
        this.showStep(3); // Show testing centers step
    }

    startNewAssessment() {
        this.assessmentData = {
            symptoms: [],
            temperature: null,
            has_chronic_conditions: false,
            symptom_onset: null
        };
        this.showStep(1);
        document.querySelectorAll('.symptom-checkbox').forEach(cb => cb.checked = false);
        document.getElementById('temperature').value = '';
    }

    showError(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.container').prepend(alertDiv);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CoronaAssistApp();
});
