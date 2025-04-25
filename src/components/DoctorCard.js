import React from 'react';

function DoctorCard({ doctor }) {
  // Helper to safely access potentially missing data or format it
  const getDisplayValue = (value, prefix = '', suffix = '', fallback = 'N/A') => {
    // Check for null, undefined, or empty string
    if (value === null || typeof value === 'undefined' || value === '') {
        return fallback;
    }
    return `${prefix}${value}${suffix}`;
  };

  // Handle specialties which might be an array or a single string
  const displaySpecialties = () => {
      let specialties = doctor.specialties || doctor.speciality; // Prioritize 'specialties' array
      if (Array.isArray(specialties)) {
          // Filter out any empty/null values and join
          const validSpecialties = specialties.filter(s => s && typeof s === 'string');
          return validSpecialties.length > 0 ? validSpecialties.join(', ') : 'N/A';
      } else if (typeof specialties === 'string' && specialties.trim() !== '') {
          return specialties;
      }
      return 'N/A'; // Fallback if no valid specialty found
  };

  return (
    <article className="doctor-card" data-testid="doctor-card">
      {/* Use optional chaining for safety */}
      <h3 data-testid="doctor-name">{doctor?.name || 'Unnamed Doctor'}</h3>
      <p data-testid="doctor-specialty">
        <span className="label">Specialty:</span> {displaySpecialties()}
      </p>
      <p data-testid="doctor-experience">
         <span className="label">Experience:</span> {getDisplayValue(doctor?.experience)}
      </p>
      <p data-testid="doctor-fee">
         <span className="label">Fees:</span> {getDisplayValue(doctor?.fees, '', '', 'Not available')}
      </p>
      {/* Example: Display consultation type if available and meaningful */}
      {doctor?.consultation && (
         <p><span className="label">Mode:</span> {doctor.consultation}</p>
      )}
    </article>
  );
}

export default DoctorCard; 