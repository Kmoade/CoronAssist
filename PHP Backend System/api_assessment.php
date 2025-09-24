<?php
header("Access-Control-Allow-Origin: https://www.coronassist.online");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Assessment.php';

$database = new Database();
$db = $database->getConnection();
$assessment = new Assessment($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->symptoms) && !empty($data->patient_id)) {
    $assessment->patient_id = $data->patient_id;
    $assessment->symptoms = $data->symptoms;
    $assessment->temperature = $data->temperature ?? null;
    $assessment->has_chronic_conditions = $data->has_chronic_conditions ?? false;
    $assessment->symptom_onset = $data->symptom_onset ?? date('Y-m-d');
    
    // Calculate risk level
    $risk_level = $assessment->calculateRiskLevel();
    $assessment->risk_level = $risk_level;
    $assessment->recommendations = $assessment->generateRecommendations($risk_level);
    
    if ($assessment->create()) {
        http_response_code(201);
        echo json_encode([
            "message" => "Assessment completed successfully",
            "risk_level" => $risk_level,
            "recommendations" => $assessment->recommendations,
            "assessment_id" => $assessment->id
        ]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to complete assessment"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data"]);
}
?>
