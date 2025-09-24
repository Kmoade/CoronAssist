-- Corona Assist Database Schema
CREATE DATABASE coronassist;
USE coronassist;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    user_type ENUM('patient', 'healthcare_worker', 'admin') DEFAULT 'patient',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Patient profiles
CREATE TABLE patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    address TEXT,
    emergency_contact VARCHAR(255),
    medical_history TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- COVID-19 assessments
CREATE TABLE covid_assessments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    symptoms TEXT,
    symptom_onset DATE,
    temperature DECIMAL(3,1),
    has_chronic_conditions BOOLEAN DEFAULT FALSE,
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    risk_level ENUM('low', 'medium', 'high'),
    recommendations TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Testing centers
CREATE TABLE testing_centers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    hours_operation VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    available_slots INT DEFAULT 0
);

-- Appointments
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    center_id INT,
    appointment_date DATETIME,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    test_type ENUM('PCR', 'Antigen', 'Antibody'),
    results TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES testing_centers(id)
);
