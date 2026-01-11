import fs from 'fs';
import path from 'path';

// Create sample CSV files for import

// Sample Students CSV
const studentsCSV = `studentId,firstName,lastName,dateOfBirth,gender,nationality,bloodType,parentName,parentPhone,parentEmail,emergencyContact,emergencyPhone,address,allergies,chronicConditions,medications
STU001,Ahmed,Mohammed,2010-05-15,MALE,UAE,A_POSITIVE,Parent Name 1,+971501234567,parent1@example.com,Emergency Contact 1,+971501234568,Abu Dhabi,None,None,None
STU002,Fatima,Ali,2011-08-20,FEMALE,UAE,B_POSITIVE,Parent Name 2,+971501234569,parent2@example.com,Emergency Contact 2,+971501234570,Abu Dhabi,Peanuts,None,None
STU003,Khalid,Hassan,2010-12-10,MALE,Egypt,O_POSITIVE,Parent Name 3,+971501234571,parent3@example.com,Emergency Contact 3,+971501234572,Abu Dhabi,None,Asthma,Inhaler`;

// Sample Users CSV
const usersCSV = `email,password,firstName,lastName,role,schoolCode,isActive
nurse1@school1.local,password123,Nurse,One,NURSE,SCH001,true
doctor1@school1.local,password123,Doctor,One,DOCTOR,SCH001,true
staff1@school1.local,password123,Staff,One,STAFF,SCH001,true`;

// Write files
const studentsPath = path.join(process.cwd(), 'sample-students.csv');
const usersPath = path.join(process.cwd(), 'sample-users.csv');

fs.writeFileSync(studentsPath, studentsCSV);
fs.writeFileSync(usersPath, usersCSV);

console.log('Sample CSV files created:');
console.log(`- ${studentsPath}`);
console.log(`- ${usersPath}`);

