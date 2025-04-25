import React from 'react';

function FilterPanel({
  availableSpecialties,
  selectedConsultation,
  selectedSpecialties,
  selectedSort,
  onConsultationChange,
  onSpecialtyChange,
  onSortChange
}) {

  const handleConsultRadioChange = (event) => {
    onConsultationChange(event.target.value);
  };

  const handleSpecialtyCheckboxChange = (event) => {
    onSpecialtyChange(event.target.value, event.target.checked);
  };

  const handleSortRadioChange = (event) => {
    onSortChange(event.target.value);
  };

  // Helper to generate data-testid for specialties safely
  const generateSpecialtyTestId = (specialty) => {
      // Replace slashes, spaces, and other non-alphanumeric characters with hyphens
      const sanitized = specialty.replace(/[^a-zA-Z0-9]+/g, '-');
      // Remove leading/trailing hyphens that might result from replacement
      return `filter-specialty-${sanitized.replace(/^-+|-+$/g, '')}`;
  }

  return (
    <aside className="filter-panel">
      <h2>Filters</h2>

      {/* Consultation Mode Filter */}
      <div className="filter-group">
        <h3 data-testid="filter-header-moc">Consultation Mode</h3>
        {/* Add "Any" option first */}
        <label className="filter-option">
          <input
            type="radio"
            name="consultation"
            value="" // Empty value represents "Any" or no filter
            checked={!selectedConsultation} // Checked if no specific type is selected
            onChange={handleConsultRadioChange}
          />
          Any
        </label>
        <label className="filter-option">
          <input
            type="radio"
            name="consultation"
            value="Video Consult"
            checked={selectedConsultation === 'Video Consult'}
            onChange={handleConsultRadioChange}
            data-testid="filter-video-consult"
          />
          Video Consult
        </label>
        <label className="filter-option">
          <input
            type="radio"
            name="consultation"
            value="In Clinic"
            checked={selectedConsultation === 'In Clinic'}
            onChange={handleConsultRadioChange}
            data-testid="filter-in-clinic"
          />
          In Clinic
        </label>
      </div>

      {/* Speciality Filter */}
      <div className="filter-group">
        <h3 data-testid="filter-header-speciality">Speciality</h3>
        {availableSpecialties.map(specialty => (
          <label key={specialty} className="filter-option checkbox">
            <input
              type="checkbox"
              value={specialty}
              checked={selectedSpecialties.includes(specialty)}
              onChange={handleSpecialtyCheckboxChange}
              data-testid={generateSpecialtyTestId(specialty)} // Use helper for testid
            />
            {specialty}
          </label>
        ))}
      </div>

      {/* Sort Filter */}
      <div className="filter-group">
        <h3 data-testid="filter-header-sort">Sort By</h3>
         {/* Add "Default" option first */}
        <label className="filter-option">
          <input
            type="radio"
            name="sort"
            value="" // Empty value represents default sort
            checked={!selectedSort} // Checked if no specific sort is selected
            onChange={handleSortRadioChange}
          />
          Default
        </label>
        <label className="filter-option">
          <input
            type="radio"
            name="sort"
            value="fees"
            checked={selectedSort === 'fees'}
            onChange={handleSortRadioChange}
            data-testid="sort-fees"
          />
          Fees (Lowest First)
        </label>
        <label className="filter-option">
          <input
            type="radio"
            name="sort"
            value="experience"
            checked={selectedSort === 'experience'}
            onChange={handleSortRadioChange}
            data-testid="sort-experience"
          />
          Experience (Highest First)
        </label>
      </div>
    </aside>
  );
}

export default FilterPanel; 