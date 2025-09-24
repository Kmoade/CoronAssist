<?php
class Assessment {
    private $conn;
    private $table = "covid_assessments";

    public $id;
    public $patient_id;
    public $symptoms;
    public $symptom_onset;
    public $temperature;
    public $has_chronic_conditions;
    public $risk_level;
    public $recommendations;
    public $assessment_date;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table . "
                SET patient_id=:patient_id, symptoms=:symptoms, 
                    symptom_onset=:symptom_onset, temperature=:temperature,
                    has_chronic_conditions=:has_chronic_conditions,
                    risk_level=:risk_level, recommendations=:recommendations";

        $stmt = $this->conn->prepare($query);

        // Sanitize data
        $this->symptoms = htmlspecialchars(strip_tags($this->symptoms));
        $this->recommendations = htmlspecialchars(strip_tags($this->recommendations));

        $stmt->bindParam(":patient_id", $this->patient_id);
        $stmt->bindParam(":symptoms", $this->symptoms);
        $stmt->bindParam(":symptom_onset", $this->symptom_onset);
        $stmt->bindParam(":temperature", $this->temperature);
        $stmt->bindParam(":has_chronic_conditions", $this->has_chronic_conditions);
        $stmt->bindParam(":risk_level", $this->risk_level);
        $stmt->bindParam(":recommendations", $this->recommendations);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function calculateRiskLevel() {
        $symptoms = json_decode($this->symptoms, true);
        $score = 0;
        
        // High-risk symptoms
        $highRiskSymptoms = ['fever', 'shortness_of_breath', 'chest_pain'];
        foreach ($highRiskSymptoms as $symptom) {
            if (in_array($symptom, $symptoms)) $score += 3;
        }
        
        // Medium-risk symptoms
        $mediumRiskSymptoms = ['cough', 'fatigue', 'body_aches'];
        foreach ($mediumRiskSymptoms as $symptom) {
            if (in_array($symptom, $symptoms)) $score += 2;
        }
        
        // Low-risk symptoms
        $lowRiskSymptoms = ['headache', 'sore_throat', 'loss_of_taste'];
        foreach ($lowRiskSymptoms as $symptom) {
            if (in_array($symptom, $symptoms)) $score += 1;
        }
        
        // Temperature factor
        if ($this->temperature > 38.0) $score += 2;
        
        // Chronic conditions
        if ($this->has_chronic_conditions) $score += 3;

        if ($score >= 8) return 'high';
        if ($score >= 4) return 'medium';
        return 'low';
    }

    public function generateRecommendations($risk_level) {
        $recommendations = [
            'low' => [
                "Monitor symptoms at home",
                "Practice social distancing",
                "Get tested if symptoms worsen"
            ],
            'medium' => [
                "Schedule a COVID-19 test",
                "Self-isolate until results",
                "Consult healthcare provider"
            ],
            'high' => [
                "Seek immediate medical attention",
                "Visit nearest testing center",
                "Isolate immediately"
            ]
        ];
        
        return json_encode($recommendations[$risk_level]);
    }
}
?>
