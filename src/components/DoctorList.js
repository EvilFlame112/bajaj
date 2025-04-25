import React from 'react';
import DoctorCard from './DoctorCard';

function DoctorList({ doctors }) {
  if (!doctors || doctors.length === 0) {
    return <div className="doctor-list-empty">No doctors found matching your criteria.</div>;
  }

  return (
    <section className="doctor-list">
      {doctors.map((doctor, index) => (
        // Use a unique ID from the doctor data if available, otherwise fallback to index
        <DoctorCard key={doctor.id || index} doctor={doctor} />
      ))}
    </section>
  );
}

export default DoctorList; 