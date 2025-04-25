import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from './components/Header';
import FilterPanel from './components/FilterPanel';
import DoctorList from './components/DoctorList';
import './App.css'; // We'll add some basic styles later

const API_URL = 'https://srijandubey.github.io/campus-api-mock/SRM-C1-25.json';

// Define available specialties based on data-testid requirements
const AVAILABLE_SPECIALTIES = [
    "General Physician", "Dentist", "Dermatologist", "Paediatrician",
    "Gynaecologist", "ENT", "Diabetologist", "Cardiologist",
    "Physiotherapist", "Endocrinologist", "Orthopaedic", "Ophthalmologist",
    "Gastroenterologist", "Pulmonologist", "Psychiatrist", "Urologist",
    "Dietitian-Nutritionist", "Psychologist", "Sexologist", "Nephrologist",
    "Neurologist", "Oncologist", "Ayurveda", "Homeopath"
];

// Helper function to safely parse numbers from strings (like fees, experience)
const safeParseInt = (value, defaultValue = 0) => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return defaultValue;
    // Extract numbers, handle potential non-numeric chars like ₹, ,, years
    const match = value.match(/\d+/);
    return match ? parseInt(match[0], 10) : defaultValue;
};

function App() {
  const [allDoctors, setAllDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // State derived from search params
  const searchTerm = useMemo(() => searchParams.get('search') || '', [searchParams]);
  const consultationType = useMemo(() => searchParams.get('consultation') || '', [searchParams]);
  const selectedSpecialties = useMemo(() => searchParams.getAll('specialty') || [], [searchParams]);
  const sortOption = useMemo(() => searchParams.get('sort') || '', [searchParams]);

  // Fetch data on initial mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setAllDoctors([]); // Clear previous data
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          // Throw error with status text for better debugging
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();

        // Determine the doctors array robustly
        const potentialDoctors = Array.isArray(data) ? data : data?.doctors;

        // **Explicitly check if it's an array before setting state**
        if (Array.isArray(potentialDoctors)) {
          setAllDoctors(potentialDoctors);
        } else {
          // Log a warning if the structure is unexpected but contains data
          if (data) {
             console.warn("Fetched data did not contain a 'doctors' array or was not an array itself:", data);
          }
          // Set to empty array if not found or not an array
          setAllDoctors([]);
          // Optionally, you could set an error state here as well if data is expected
          // setError("Received invalid data format from API.");
        }

      } catch (e) {
        console.error("Failed to fetch or process doctors:", e);
        // Ensure error state reflects the fetch/process failure
        setError(`Failed to load doctor data. ${e instanceof Error ? e.message : String(e)}`);
        setAllDoctors([]); // Ensure doctors list is empty on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Filter and sort doctors whenever dependencies change
  useEffect(() => {
    // Start with a fresh copy of all doctors for each filter run
    let doctors = [...allDoctors];

    // 1. Filter by Search Term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      doctors = doctors.filter(doc =>
        doc.name?.toLowerCase().includes(lowerSearchTerm) // Use optional chaining
      );
    }

    // 2. Filter by Consultation Type
    if (consultationType) {
      const lowerConsultationType = consultationType.toLowerCase();
      doctors = doctors.filter(doc => {
        // Check multiple possible fields based on API structure ambiguity
        const docConsultation = doc.consultation?.toLowerCase();
        if (docConsultation === lowerConsultationType) return true;
        if (lowerConsultationType === 'video consult' && doc.video_consult === true) return true;
        if (lowerConsultationType === 'in clinic' && doc.in_clinic === true) return true;
        // Add more checks if the API uses different keys/values
        return false;
      });
    }

    // 3. Filter by Specialties (OR logic)
    if (selectedSpecialties.length > 0) {
      doctors = doctors.filter(doc => {
        const docSpecsLower = (Array.isArray(doc.specialties) ? doc.specialties : [doc.speciality])
                              .filter(Boolean) // Remove null/undefined entries
                              .map(s => s.toLowerCase()); // Normalize doctor's specialties

        return selectedSpecialties.some(selSpec =>
          docSpecsLower.includes(selSpec.toLowerCase())
        );
      });
    }

    // 4. Sort
    if (sortOption === 'fees') {
      doctors.sort((a, b) => {
          const feeA = safeParseInt(a.fees);
          const feeB = safeParseInt(b.fees);
          return feeA - feeB; // Ascending
      });
    } else if (sortOption === 'experience') {
       doctors.sort((a, b) => {
           const expA = safeParseInt(a.experience);
           const expB = safeParseInt(b.experience);
           return expB - expA; // Descending
       });
    }
    // If no sort option or an unknown one, retain the current order (usually API order or post-filter order)

    setFilteredDoctors(doctors);

  }, [allDoctors, searchTerm, consultationType, selectedSpecialties, sortOption]); // Dependencies that trigger re-filtering

  // --- Callback handlers to update search params ---

  const handleSearchChange = useCallback((newSearchTerm) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev); // Create mutable copy
      if (newSearchTerm) {
        newParams.set('search', newSearchTerm);
      } else {
        newParams.delete('search');
      }
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  const handleConsultationChange = useCallback((newConsultationType) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (newConsultationType) {
        newParams.set('consultation', newConsultationType);
      } else {
        newParams.delete('consultation');
      }
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  const handleSpecialtyChange = useCallback((specialty, isChecked) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev); // Work with a mutable copy
      const currentSpecialties = newParams.getAll('specialty');

      if (isChecked) {
        if (!currentSpecialties.includes(specialty)) {
          newParams.append('specialty', specialty);
        }
      } else {
        // Filter out the specific specialty
        const filteredSpecialties = currentSpecialties.filter(s => s !== specialty);
        newParams.delete('specialty'); // Remove all existing specialty params
        filteredSpecialties.forEach(s => newParams.append('specialty', s)); // Add back the remaining ones
      }
      return newParams; // Return the modified params
    }, { replace: true });
  }, [setSearchParams]);

   const handleSortChange = useCallback((newSortOption) => {
     setSearchParams(prev => {
       const newParams = new URLSearchParams(prev);
       if (newSortOption) {
         newParams.set('sort', newSortOption);
       } else {
         newParams.delete('sort');
       }
       return newParams;
     }, { replace: true });
   }, [setSearchParams]);

  // --- Render Logic ---

  return (
    <div className="App">
      <Header
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        allDoctors={allDoctors} // Pass all doctors for autocomplete suggestions
      />
      <main className="content">
        <FilterPanel
          availableSpecialties={AVAILABLE_SPECIALTIES} // Pass the defined list
          selectedConsultation={consultationType}
          selectedSpecialties={selectedSpecialties}
          selectedSort={sortOption}
          onConsultationChange={handleConsultationChange}
          onSpecialtyChange={handleSpecialtyChange}
          onSortChange={handleSortChange}
        />
        <div className="doctor-list-container">
          {isLoading && <div className="status-message">Loading doctors...</div>}
          {error && <div className="status-message error-message">Error: {error}</div>}
          {!isLoading && !error && (
            <DoctorList doctors={filteredDoctors} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App; 