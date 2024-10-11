import { useState, useEffect } from 'react'
import './App.css'
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid' // Import nanoid

// Initialize Supabase client

function App() {
  //basic info
  const [userId, setUserId] = useState(nanoid()) // Generate a nanoid for the user
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState(''); // New state for email
  const [professionalSummary, setProfessionalSummary] = useState('') // Updated state variable
  const [hoursAvailability, setHoursAvailability] = useState('')
  const [selectedTimezones, setSelectedTimezones] = useState([]); // New state for selected timezones
  const [isInfoSaved, setIsInfoSaved] = useState(false); // New state to track if user info is saved
  const [experiences, setExperiences] = useState([]);


  // Function to check if the last experience form is complete
  const isLastExperienceComplete = () => {
    if (experiences.length === 0) return true; // Allow adding the first experience
    const lastExperience = experiences[experiences.length - 1];
    // Check if all fields are filled, except endDate if currentlyEmployed is true
    return Object.entries(lastExperience).every(([key, value]) => {
      if (key === 'endDate' && lastExperience.currentlyEmployed) return true;
      return value !== '';
    });
  };

  const embedInfo = async (info) => {
    const formattedExperiences = experiences.map((exp, index) => {
      const endDate = exp.currentlyEmployed ? 'present' : exp.endDate;
      return `${index + 1}. ${exp.role} at ${exp.company} from ${exp.startDate} to ${endDate}. Their notable accomplishments include:\n- ${exp.accomplishments.split('. ').join('\n- ')}\n\nThey used the following software in that role:\n- ${exp.softwareUsed.split(', ').join('\n- ')}.`;
    }).join('\n\n');

    const formSummary = `${firstName} ${lastName} is available to work ${hoursAvailability} hours per week in the following timezones: ${selectedTimezones.join(", ")}.\n\n` +
      `Their professional summary says: ${professionalSummary}\n\n` +
      `Their work experiences are:\n${formattedExperiences}`;

    const openAIWorkerUrl = "https://openai-worker.marsescobin.workers.dev/";
    const workerResponse = await fetch(openAIWorkerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: info,
      }),
    });
    const workerResponseInJSON = await workerResponse.json();
    const embedding = workerResponseInJSON.data[0].embedding;
    return embedding;
  }

  // Function to add a new experience form
  const handleAddExperience = () => {
    if (isLastExperienceComplete()) {
      setExperiences([...experiences, { role: '', company: '', accomplishments: '', startDate: '', endDate: '', currentlyEmployed: false, softwareUsed: '' }]);
    } else {
      alert('Please fill out all fields in the last experience form before adding a new one.');
    }
  };

  // Function to handle input change for a specific experience
  const handleExperienceInputChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newExperiences = [...experiences];
    newExperiences[index][name] = type === 'checkbox' ? checked : value;
    setExperiences(newExperiences);
  };

  // New handlers for the new fields
  const handleFirstNameChange = (e) => {
    setFirstName(e.target.value)
  }

  const handleLastNameChange = (e) => {
    setLastName(e.target.value)
  }

  const handleProfessionalSummaryChange = (e) => { // Updated handler
    setProfessionalSummary(e.target.value)
  }

  const handleHoursAvailabilityChange = (e) => {
    setHoursAvailability(e.target.value)
  }

  // Function to handle timezone selection
  const handleTimezoneChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      // Add the selected timezone to the array
      setSelectedTimezones([...selectedTimezones, value]);
    } else {
      // Remove the unselected timezone from the array
      setSelectedTimezones(selectedTimezones.filter((timezone) => timezone !== value));
    }
  };

  // Update function name
  const handleSubmit = async (e) => {
    e.preventDefault();

    const missingFields = [];

    // Debugging: Check the contents of selectedTimezones
    console.log('Selected Timezones:', selectedTimezones);

    if (!firstName.trim()) missingFields.push('First Name');
    if (!lastName.trim()) missingFields.push('Last Name');
    if (!email.trim()) missingFields.push('Email');
    if (!professionalSummary.trim()) missingFields.push('Professional Summary');
    if (!hoursAvailability.trim()) missingFields.push('Hours Availability');
    if (selectedTimezones.length === 0) missingFields.push('Preferred Timezones');

    if (missingFields.length > 0) {
      alert(`Please fill out the following fields: ${missingFields.join(', ')}`);
      return;
    }

    const formattedExperiences = experiences.map((exp, index) => {
      const endDate = exp.currentlyEmployed ? 'present' : exp.endDate;
      return `${index + 1}. ${exp.role} at ${exp.company} from ${exp.startDate} to ${endDate}. Their notable accomplishments include:\n- ${exp.accomplishments.split('. ').join('\n- ')}\n\nThey used the following software in that role:\n- ${exp.softwareUsed.split(', ').join('\n- ')}`;
    }).join('\n\n');

    const formSummary = `${firstName} ${lastName} is available to work ${hoursAvailability} hours per week in the following timezones: ${selectedTimezones.join(", ")}\n\n` +
      `Their professional summary says: ${professionalSummary}\n\n` +
      `Their work experiences are:\n${formattedExperiences}`;

    console.log("form summary: ", formSummary)

    const profileSummaryEmbedding = await embedInfo(formSummary);

    const supabaseWorkerUrl = "https://supabase-worker.marsescobin.workers.dev/";

    const supabaseWorkerResponse = await fetch(supabaseWorkerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "basic_info",
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        professional_summary: professionalSummary, // Updated field name
        hours_availability: parseInt(hoursAvailability),
        selected_timezones: selectedTimezones,
        work_experiences: experiences,
        profile_summary: formSummary,
        profile_summary_embedding: profileSummaryEmbedding,
        // Include experiences in the payload
      }),
    });

    const supabaseResult = await supabaseWorkerResponse.json();
    setIsInfoSaved(true);
  };

  const handleEmailChange = (e) => { // New handler for email
    setEmail(e.target.value);
  };

  return (
    <>
      <h1>DoerDriven</h1>
      <p>Share your experience and availability to join our remote work network. We'll match you with clients looking for your exact qualification.</p>
      <div className='basicInfo'>
        <form onSubmit={handleSubmit}>
          <div>
            <div className='form-group'>
              <div className="name-container">
                <div className='form-group'>
                  <label htmlFor="firstName">First Name</label>
                  <input className="input-firstName" type="text" id="firstName" name="firstName" value={firstName} onChange={handleFirstNameChange} />
                </div>
                <div className='form-group'>

                  <label htmlFor="lastName">Last Name</label>
                  <input className="input-lastName" type="text" id="lastName" name="lastName" value={lastName} onChange={handleLastNameChange} />
                </div>
              </div>
            </div>
            <div className='form-group'>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={email} onChange={handleEmailChange} required />
            </div>
            <div className='form-group'>
              <label htmlFor="professionalSummary">Professional Summary</label>
              <textarea id="professionalSummary" name="professionalSummary" placeholder="Summarize your professional experience in 1-2 sentences" value={professionalSummary} onChange={handleProfessionalSummaryChange} />
            </div>
            <div className='form-group'>
              <label htmlFor="hoursAvailability">Hours Availability</label>
              <input type="number" id="hoursAvailability" name="hoursAvailability" placeholder="How many hours you're available to work per week" value={hoursAvailability} onChange={handleHoursAvailabilityChange} />
            </div>
            <div className='form-group'>
              <label>Preferred Timezones</label>
              <div className="timezone-container">
                <label>
                  <input type="checkbox" id="pst" value="PST" onChange={handleTimezoneChange} /><span>PST</span>
                </label>
                <label>
                  <input type="checkbox" id="cst" value="CST" onChange={handleTimezoneChange} /><span>CST</span>
                </label>
                <label>
                  <input type="checkbox" id="mst" value="MST" onChange={handleTimezoneChange} /><span>MST</span>
                </label>
                <label>
                  <input type="checkbox" id="est" value="EST" onChange={handleTimezoneChange} /><span>EST</span>
                </label>
              </div>
            </div>
          </div>
          {experiences.map((experience, index) => (
            <div key={index} className='workExperience'>
              <h2>Add Experience</h2>
              <div>
                <label htmlFor={`role-${index}`}>Role</label>
                <input type="text" id={`role-${index}`} name="role" value={experience.role} onChange={(e) => handleExperienceInputChange(index, e)} />
              </div>
              <div>
                <label htmlFor={`company-${index}`}>Company or client name</label>
                <input type="text" id={`company-${index}`} name="company" value={experience.company} onChange={(e) => handleExperienceInputChange(index, e)} />
              </div>
              <div>
                <label htmlFor={`accomplishments-${index}`}>Notable Accomplishments</label>
                <textarea type="text" id={`accomplishments-${index}`} name="accomplishments" value={experience.accomplishments} onChange={(e) => handleExperienceInputChange(index, e)} />
              </div>
              <div>
                <label htmlFor={`startDate-${index}`}>Start Date</label>
                <input type="date" id={`startDate-${index}`} name="startDate" value={experience.startDate} onChange={(e) => handleExperienceInputChange(index, e)} />
              </div>
              <div>
                <label htmlFor={`endDate-${index}`}>End Date</label>
                <input type="date" id={`endDate-${index}`} name="endDate" value={experience.endDate} onChange={(e) => handleExperienceInputChange(index, e)} disabled={experience.currentlyEmployed} />
              </div>
              <div>
                <label htmlFor={`currentlyEmployed-${index}`}>Currently employed</label>
                <input
                  type="checkbox"
                  id={`currentlyEmployed-${index}`}
                  name="currentlyEmployed"
                  checked={experience.currentlyEmployed} // Use checked instead of value
                  onChange={(e) => handleExperienceInputChange(index, e)}
                  disabled={experience.endDate !== ''} // Disable if any character is present in endDate
                />
              </div>
              <div>
                <label htmlFor={`softwareUsed-${index}`}>Software used</label>
                <input type="text" id={`softwareUsed-${index}`} name="softwareUsed" value={experience.softwareUsed} onChange={(e) => handleExperienceInputChange(index, e)} />
              </div>
            </div>
          ))}
          <button className="addExperience" onClick={handleAddExperience} disabled={!isLastExperienceComplete()}>
            Add {experiences.length === 0 ? '' : 'Another'} Experience
          </button>
          <button type="submit">Submit</button>
        </form>
      </div>

    </>
  )
}

export default App