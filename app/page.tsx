"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, ChevronDown, ChevronUp, MapPin, Building } from "lucide-react"
import Image from "next/image"

// Define doctor data type to match API structure
interface Doctor {
  id: string;
  name: string;
  name_initials: string;
  photo: string;
  doctor_introduction: string;
  specialities: Array<{name: string}>;
  specialties?: string[]; // Frontend processed specialties
  specialty?: string; // Frontend primary specialty
  fees: string;
  experience: string;
  languages: string[];
  clinic: {
    name: string;
    address: {
      locality: string;
      city: string;
      address_line1: string;
      location: string;
      logo_url: string;
    };
    location?: string; // Frontend processed location
  };
  video_consult: boolean;
  in_clinic: boolean;
  consultation?: string; // Frontend processed consultation type
}

export default function DoctorListingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State for doctors data (using the updated interface)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for filters
  const [searchTerm, setSearchTerm] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [consultationType, setConsultationType] = useState("")
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [sortOption, setSortOption] = useState("")
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [specialties, setSpecialties] = useState<string[]>([])

  const searchRef = useRef<HTMLDivElement>(null)

  // Fetch doctors data from API
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true)
      setError(null)
      // Clear state related to previous fetches
      setDoctors([])
      setFilteredDoctors([])
      setSpecialties([]) // Also clear specialties

      try {
        const response = await fetch("https://srijandubey.github.io/campus-api-mock/SRM-C1-25.json")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
        }
        const data: unknown = await response.json()

        // Determine the doctors array robustly
        let potentialDoctors: Doctor[] = [];
        // Assuming the API returns an array directly based on the URL structure
        if (Array.isArray(data)) {
            // Basic validation: check if items look like doctor objects (e.g., have an id)
            potentialDoctors = data.filter(item => typeof item === 'object' && item !== null && 'id' in item) as Doctor[];
        } else {
             console.warn("Fetched data was not an array as expected:", data);
        }

        if (potentialDoctors.length > 0) {
          const formattedDoctors = potentialDoctors.map(doc => {
            // Extract specialties from the specialities array
            const docSpecialties: string[] = doc.specialities
              ?.map(s => s.name)
              .filter((s): s is string => typeof s === 'string' && s.trim() !== '')
              .map(s => s.trim())
              .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()) || [];

            // Clean up fees - remove existing currency symbol if present
            const cleanFees = String(doc.fees || '').replace(/[₹,\s]/g, '');

            return {
              ...doc,
              // Ensure all required fields are present
              specialties: docSpecialties.length > 0 ? docSpecialties : ['General Physician'],
              specialty: docSpecialties[0] || 'General Physician',
              fees: cleanFees,
              consultation: doc.video_consult ? 'Video Consult' : (doc.in_clinic ? 'In Clinic' : 'In Clinic'),
              // Map clinic location from the address
              clinic: {
                ...doc.clinic,
                location: doc.clinic.address.locality || doc.clinic.address.city
              }
            } as Doctor;
          });

          setDoctors(formattedDoctors);
          setFilteredDoctors(formattedDoctors);

          // Extract unique specialties from all doctors
          const allSpecialties = new Set<string>();
          
          // First add specialties from the actual data
          formattedDoctors.forEach(doctor => {
            if (doctor.specialties) {
              doctor.specialties.forEach(spec => {
                if (spec && typeof spec === 'string' && spec.trim() !== '') {
                  // Capitalize first letter for consistency
                  const formattedSpec = spec.charAt(0).toUpperCase() + spec.slice(1).toLowerCase();
                  allSpecialties.add(formattedSpec);
                }
              });
            }
          });

          // Add common specialties that exist in the data
          COMMON_SPECIALTIES.forEach(spec => {
            const formattedSpec = spec.charAt(0).toUpperCase() + spec.slice(1).toLowerCase();
            if (formattedDoctors.some(doc => 
              doc.specialties?.some(s => 
                s.toLowerCase() === formattedSpec.toLowerCase()
              )
            )) {
              allSpecialties.add(formattedSpec);
            }
          });

          // Sort specialties alphabetically and set state
          const sortedSpecialties = Array.from(allSpecialties).sort();
          setSpecialties(sortedSpecialties);

          // Log the counts for debugging
          console.log('Total Doctors:', formattedDoctors.length);
          console.log('Specialties:', sortedSpecialties);
          console.log('Doctors by Specialty:', sortedSpecialties.map(spec => ({
            specialty: spec,
            count: formattedDoctors.filter(d => 
              d.specialties?.some(s => s.toLowerCase() === spec.toLowerCase())
            ).length
          })));
        } else {
          // Handle case where data was fetched but no valid doctors array found
          if (data) {
            console.warn("Fetched data did not contain a valid 'doctors' array:", data)
          }
          // Ensure state is empty
          setDoctors([])
          setFilteredDoctors([])
          setSpecialties([])
        }
      } catch (e) {
        console.error("Failed to fetch or process doctors:", e)
        setError(`Failed to load doctor data. ${e instanceof Error ? e.message : String(e)}`)
        // Ensure state is empty on error
        setDoctors([])
        setFilteredDoctors([])
        setSpecialties([])
      } finally {
        setLoading(false)
      }
    }

    fetchDoctors()
  }, []) // Keep dependency array empty for fetch-on-mount

  // Initialize filters from URL params
  useEffect(() => {
    const search = searchParams.get("search") || ""
    const consult = searchParams.get("consult") || ""
    const specs = searchParams.get("specialties")?.split(",").filter(Boolean) || []
    const sort = searchParams.get("sort") || ""

    setSearchTerm(search)
    setConsultationType(consult)
    setSelectedSpecialties(specs)
    setSortOption(sort)
  }, [searchParams])

  // Update URL with current filters
  const updateUrlParams = () => {
    const params = new URLSearchParams(searchParams.toString()) // Start with existing params

    // Update search param
    if (searchTerm) {
      params.set("search", searchTerm)
    } else {
      params.delete("search")
    }

    // Update consultation param
    if (consultationType) {
      params.set("consult", consultationType)
    } else {
      params.delete("consult")
    }

    // Update specialties param
    if (selectedSpecialties.length > 0) {
      params.set("specialties", selectedSpecialties.join(","))
    } else {
      params.delete("specialties")
    }

    // Update sort param
    if (sortOption) {
      params.set("sort", sortOption)
    } else {
      params.delete("sort")
    }

    router.push(`?${params.toString()}`, { scroll: false })
  }

  // Apply filters and update URL
  useEffect(() => {
    if (loading) return;

    let result = [...doctors];

    // 1. Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter((doctor) =>
        doctor.name?.toLowerCase().includes(searchLower) ||
        doctor.specialty?.toLowerCase().includes(searchLower) ||
        doctor.specialties?.some(s => s.toLowerCase().includes(searchLower))
      );
    }

    // 2. Apply consultation type filter
    if (consultationType) {
      result = result.filter((doctor) =>
        doctor.consultation === consultationType
      );
    }

    // 3. Apply specialties filter
    if (selectedSpecialties.length > 0) {
      result = result.filter((doctor) =>
        selectedSpecialties.some(selected =>
          doctor.specialties?.some(docSpec =>
            docSpec.toLowerCase() === selected.toLowerCase()
          )
        )
      );
    }

    // 4. Apply sorting
    if (sortOption) {
      const parseValue = (value: string | number | undefined): number => {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return 0;
        const match = value.match(/\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : 0;
      };

      result = [...result].sort((a, b) => {
        if (sortOption === 'fees') {
          return parseValue(a.fees) - parseValue(b.fees); // Ascending
        } else if (sortOption === 'experience') {
          return parseValue(b.experience) - parseValue(a.experience); // Descending
        }
        return 0;
      });
    }

    setFilteredDoctors(result);
    updateUrlParams();
  }, [searchTerm, consultationType, selectedSpecialties, sortOption, doctors, loading]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setShowSuggestions(e.target.value.length > 0)
  }

  // Handle suggestion click
  const handleSuggestionClick = (name: string) => {
    setSearchTerm(name)
    setShowSuggestions(false)
  }

  // Handle specialty checkbox change
  const handleSpecialtyChange = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty],
    )
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Get filtered suggestions
  const getSuggestions = () => {
    // Add safety checks here too
    return doctors
      .filter((doctor) => doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 3)
      .map((doctor) => ({
        ...doctor,
        // Ensure specialty is always an array for formatting, even if originally a string or missing
        specialty: Array.isArray(doctor.specialty) ? doctor.specialty : (typeof doctor.specialty === 'string' ? [doctor.specialty] : []),
      }));
  };

  // Format specialty list for display (handles array or string)
  const formatSpecialties = (specialties: string[] | string | undefined): string => {
    if (Array.isArray(specialties)) {
        return specialties.filter(Boolean).join(", ") || "N/A";
    } else if (typeof specialties === 'string' && specialties.trim() !== '') {
        return specialties.trim();
    }
    return "N/A";
  };

  // Add a predefined list of common specialties to ensure we have a baseline
  const COMMON_SPECIALTIES = [
    "General Physician",
    "Dentist",
    "Dermatologist",
    "Paediatrician",
    "Gynaecologist",
    "ENT",
    "Diabetologist",
    "Cardiologist",
    "Physiotherapist",
    "Endocrinologist",
    "Orthopaedic",
    "Ophthalmologist",
    "Gastroenterologist",
    "Pulmonologist",
    "Psychiatrist",
    "Urologist",
    "Dietitian-Nutritionist",
    "Psychologist",
    "Sexologist",
    "Nephrologist",
    "Neurologist",
    "Oncologist",
    "Ayurveda",
    "Homeopath"
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-[Inter]">
      {/* Blue Header */}
      <div className="bg-[#2962A5] py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative" ref={searchRef}>
            <input
              type="text"
              placeholder="Search Symptoms, Doctors, Specialists, Clinics"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowSuggestions(searchTerm.length > 0)}
              data-testid="autocomplete-input"
              className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 border-0 shadow-sm"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            
            {/* Suggestions dropdown */}
            {showSuggestions && searchTerm.trim() !== "" && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {getSuggestions().length > 0 ? (
                  getSuggestions().map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => handleSuggestionClick(doctor.name)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      data-testid="suggestion-item"
                    >
                      <div className="flex-shrink-0">
                        <Image
                          src={doctor.photo || "/default-doctor.png"}
                          alt={doctor.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                          unoptimized={true}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{doctor.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatSpecialties(doctor.specialties)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500">
                    No doctors found matching "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Mobile filter toggle */}
          <div className="md:hidden">
            <button
              className="w-full flex items-center justify-between p-3 bg-white rounded-xl shadow-sm mb-4"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <span className="font-medium">Filters</span>
              {showMobileFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {/* Filter panel */}
          <div className={`${showMobileFilters ? "block" : "hidden"} md:block md:w-1/4 space-y-4`}>
            {/* Sort By Section - Separate Card */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-lg" data-testid="filter-header-sort">Sort by</h3>
                  <ChevronUp size={20} className="text-gray-400" />
                </div>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="sortOption"
                      value="fees"
                      checked={sortOption === "fees"}
                      onChange={() => setSortOption("fees")}
                      data-testid="sort-fees"
                      className="form-radio text-blue-600 w-4 h-4"
                    />
                    <span className="text-gray-700">Price: Low-High</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="sortOption"
                      value="experience"
                      checked={sortOption === "experience"}
                      onChange={() => setSortOption("experience")}
                      data-testid="sort-experience"
                      className="form-radio text-blue-600 w-4 h-4"
                    />
                    <span className="text-gray-700">Experience - Most Experience first</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Filters Section - Separate Card */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-lg">Filters</h3>
                  <button 
                    onClick={() => {
                      setConsultationType("")
                      setSelectedSpecialties([])
                      setSortOption("")
                      setSearchTerm("")
                    }}
                    className="text-blue-600 text-sm hover:text-blue-800"
                  >
                    Clear All
                  </button>
                </div>

                {/* Specialties */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium" data-testid="filter-header-speciality">
                      Specialities
                    </h4>
                    {selectedSpecialties.length > 0 && (
                      <button
                        onClick={() => setSelectedSpecialties([])}
                        className="text-blue-600 text-xs hover:text-blue-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {specialties.length > 0 ? (
                      specialties.map((specialty) => {
                        const doctorCount = doctors.filter(d => 
                          d.specialties?.some(s => s.toLowerCase() === specialty.toLowerCase())
                        ).length;
                        
                        // Only show specialties that have doctors
                        if (doctorCount === 0) return null;

                        // Generate the data-testid based on the specialty name
                        const testId = `filter-specialty-${specialty.replace(/[^a-zA-Z0-9]+/g, '-')}`;

                        return (
                          <label
                            key={specialty}
                            className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSpecialties.includes(specialty)}
                              onChange={() => handleSpecialtyChange(specialty)}
                              data-testid={testId}
                              className="form-checkbox text-blue-600 w-4 h-4 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-gray-700 text-sm">{specialty}</span>
                            <span className="text-gray-400 text-xs ml-auto">
                              ({doctorCount})
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="text-gray-500 text-sm text-center py-2">
                        Loading specialties...
                      </div>
                    )}
                  </div>
                </div>

                {/* Mode of consultation */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium" data-testid="filter-header-moc">
                      Mode of consultation
                    </h4>
                    {consultationType && (
                      <button
                        onClick={() => setConsultationType("")}
                        className="text-blue-600 text-xs hover:text-blue-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="consultationType"
                        value="Video Consult"
                        checked={consultationType === "Video Consult"}
                        onChange={(e) => setConsultationType(e.target.value)}
                        data-testid="filter-video-consult"
                        className="form-radio text-blue-600 w-4 h-4"
                      />
                      <span className="text-gray-700 text-sm">Video Consultation</span>
                      <span className="text-gray-400 text-xs ml-auto">
                        ({doctors.filter(d => d.consultation === "Video Consult").length})
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="consultationType"
                        value="In Clinic"
                        checked={consultationType === "In Clinic"}
                        onChange={(e) => setConsultationType(e.target.value)}
                        data-testid="filter-in-clinic"
                        className="form-radio text-blue-600 w-4 h-4"
                      />
                      <span className="text-gray-700 text-sm">In-clinic Consultation</span>
                      <span className="text-gray-400 text-xs ml-auto">
                        ({doctors.filter(d => d.consultation === "In Clinic").length})
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="consultationType"
                        value=""
                        checked={consultationType === ""}
                        onChange={(e) => setConsultationType(e.target.value)}
                        className="form-radio text-blue-600 w-4 h-4"
                      />
                      <span className="text-gray-700 text-sm">All</span>
                      <span className="text-gray-400 text-xs ml-auto">
                        ({doctors.length})
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor listing */}
          <div className="flex-1">
            {loading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
            {!loading && error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}
            {!loading && !error && (
              <div className="space-y-4">
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow border border-gray-100"
                      data-testid="doctor-card"
                    >
                      <div className="flex gap-4">
                        {/* Doctor Image */}
                        <div className="flex-shrink-0">
                          <Image
                            src={doctor.photo || "/default-doctor.png"}
                            alt={`Dr. ${doctor.name}`}
                            width={72}
                            height={72}
                            className="rounded-full object-cover"
                            priority
                            unoptimized={true}
                          />
                        </div>

                        {/* Doctor Info */}
                        <div className="flex-1">
                          {/* Top Row: Name and Fees */}
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-lg font-medium text-gray-900" data-testid="doctor-name">
                              {doctor.name}
                            </h3>
                            {doctor.fees && (
                              <div className="text-base font-medium text-gray-900" data-testid="doctor-fee">
                                ₹{typeof doctor.fees === 'string' ? doctor.fees.replace(/[₹,\s]/g, '').trim() : doctor.fees}
                              </div>
                            )}
                          </div>

                          {/* Specialties */}
                          {doctor.specialties && doctor.specialties.length > 0 && (
                            <p className="text-sm text-gray-600" data-testid="doctor-specialty">
                              {doctor.specialties.join(', ')}
                            </p>
                          )}

                          {/* Experience */}
                          {doctor.experience && (
                            <p className="text-sm text-gray-500 mt-1" data-testid="doctor-experience">
                              {doctor.experience}
                            </p>
                          )}

                          {/* Clinic Info */}
                          {(doctor.clinic.name || doctor.clinic.location) && (
                            <div className="mt-2 space-y-1">
                              {doctor.clinic.name && (
                                <div className="flex items-center gap-1.5 text-gray-600">
                                  <Building className="w-4 h-4" />
                                  <span className="text-sm">{doctor.clinic.name}</span>
                                </div>
                              )}
                              {doctor.clinic.location && (
                                <div className="flex items-center gap-1.5 text-gray-600">
                                  <MapPin className="w-4 h-4" />
                                  <span className="text-sm">{doctor.clinic.location}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Book Button - Positioned at bottom right */}
                      <div className="mt-4 flex justify-end">
                        <button className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded-xl hover:bg-blue-50 transition-colors text-sm font-medium">
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
                    <p className="text-gray-600">No doctors match your current filters.</p>
                    <button
                      className="mt-4 text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        setSearchTerm("")
                        setConsultationType("")
                        setSelectedSpecialties([])
                        setSortOption("")
                      }}
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
