import { useState, useEffect } from 'react'
import './App.css'
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid' // Import nanoid

// Initialize Supabase client

function App() {
  //basic info
  const savedData = JSON.parse(localStorage.getItem('formData'));
  const [applicationId, setApplicationId] = useState(nanoid()) // Generate a nanoid for the application
  const [firstName, setFirstName] = useState(() => {
    return savedData?.firstName || '';
  });
  const [lastName, setLastName] = useState(() => {
    return savedData?.lastName || '';
  });
  const [email, setEmail] = useState(() => {
    return savedData?.email || '';
  });
  const [professionalSummary, setProfessionalSummary] = useState(() => {
    return savedData?.professionalSummary || '';
  });
  const [hoursAvailability, setHoursAvailability] = useState(() => {
    return savedData?.hoursAvailability || '';
  });
  const [selectedTimezones, setSelectedTimezones] = useState(() => {
    return savedData?.selectedTimezones || [];
  });
  const [isSubmitted, setIsSubmitted] = useState(false); // New state to track form submission
  const [experiences, setExperiences] = useState(() => {
    return savedData?.experiences || [];
  });
  const [training, setTraining] = useState(() => {
    return savedData?.training || [];
  });
  const [selectedPronouns, setSelectedPronouns] = useState(() => {
    return savedData?.selectedPronouns || '';
  }); // Initialize state for pronouns

  // Save form data to local storage whenever it changes
  useEffect(() => {
    const formData = {
      firstName,
      lastName,
      email,
      professionalSummary,
      hoursAvailability,
      selectedTimezones,
      experiences,
      selectedPronouns
    };
    localStorage.setItem('formData', JSON.stringify(formData));
  }, [firstName, lastName, email, professionalSummary, hoursAvailability, selectedTimezones, experiences]);
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

  const handleAddTraining = () => {
    setTraining([...training, { certification: '', institution: '', yearCompleted: '' }]);
  }

  // Function to handle input change for a specific experience
  const handleExperienceInputChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newExperiences = [...experiences];

    // Update the field value
    newExperiences[index][name] = type === 'checkbox' ? checked : value;

    // Validate end date is not before start date


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
    const value = Number(e.target.value);
    if (value >= 0) { // Ensure the value is not negative
      setHoursAvailability(value);
    } else {
      alert("Hours availability cannot be negative.");
    }
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

  // Handler function for pronoun selection
  const handlePronounsChange = (e) => {
    const newPronoun = e.target.value;
    setSelectedPronouns(newPronoun); // Update state with selected pronoun

  }
  // Update function name
  const handleSubmit = async (e) => {
    e.preventDefault();

    const missingFields = [];

    // Debugging: Check the contents of selectedTimezones

    if (!firstName.trim()) missingFields.push('First Name');
    if (!lastName.trim()) missingFields.push('Last Name');
    if (!email.trim()) missingFields.push('Email');
    if (!professionalSummary.trim()) missingFields.push('Professional Summary');
    if (isNaN(hoursAvailability) || hoursAvailability <= 0) missingFields.push('Hours Availability'); // Updated check
    if (selectedTimezones.length === 0) missingFields.push('Preferred Timezones');
    if (experiences.length === 0) missingFields.push('At least one Experience'); // New check for experiences

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


    const profileSummaryEmbedding = await embedInfo(formSummary);

    const supabaseWorkerUrl = "https://supabase-worker.marsescobin.workers.dev/";

    try {
      const supabaseWorkerResponse = await fetch(supabaseWorkerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "basic_info",
          application_id: applicationId,
          first_name: firstName,
          last_name: lastName,
          email: email,
          professional_summary: professionalSummary,
          hours_availability: parseInt(hoursAvailability),
          selected_timezones: selectedTimezones,
          work_experiences: experiences,
          profile_summary: formSummary,
          profile_summary_embedding: profileSummaryEmbedding,
        }),
      });

      if (!supabaseWorkerResponse.ok) {
        throw new Error(`HTTP error! status: ${supabaseWorkerResponse.status}`);
      }

      const supabaseResult = await supabaseWorkerResponse.json();

      if (supabaseResult && supabaseResult.success) {
        setIsSubmitted(true); // Set form as submitted

        // Clear local storage after successful submission
        localStorage.removeItem('formData');

        // Reset form state
        setFirstName('');
        setLastName('');
        setEmail('');
        setProfessionalSummary('');
        setHoursAvailability('');
        setSelectedTimezones([]);
        setExperiences([]);
        setApplicationId(nanoid());
      } else {
        console.error('Submission failed:', supabaseResult);
        alert('Submission failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during submission:', error);
      alert('An error occurred during submission. Please try again.');
    }
  };

  const handleEmailChange = (e) => { // New handler for email
    setEmail(e.target.value);
  };

  return (
    <>
      <h1>DoerDriven</h1>
      <p>Apply as a Doer and join our world-wide network of remote workers. </p>
      {isSubmitted ? (
        <div className="confirmation-message">Thank you for your submission! We will get back to you soon.</div>
      ) : (
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
              <div className='form-group'>
                <label>Preferred Pronouns</label>
                <div className="pronouns-container">
                  <label>
                    <input type="radio" name="pronouns" value="he/him" onChange={handlePronounsChange} checked={selectedPronouns === "he/him"} />
                    <span>He/Him</span>
                  </label>
                  <label>
                    <input type="radio" name="pronouns" value="she/her" onChange={handlePronounsChange} checked={selectedPronouns === "she/her"} />
                    <span>She/Her</span>
                  </label>
                  <label>
                    <input type="radio" name="pronouns" value="they/them" onChange={handlePronounsChange} checked={selectedPronouns === "they/them"} />
                    <span>They/Them</span>
                  </label>
                </div>
              </div>
            </div>
            {experiences.map((experience, index) => (
              <div key={index} className='workExperience'>
                <h2>Work Experience {index + 1}</h2>
                <div className="form-group">
                  <label htmlFor={`role-${index}`}>Role</label>
                  <input type="text" id={`role-${index}`} placeholder="Add your role or job title" name="role" value={experience.role} onChange={(e) => handleExperienceInputChange(index, e)} />
                </div>
                <div className="form-group">
                  <label htmlFor={`company-${index}`}>Company or Client Name</label>
                  <input type="text" id={`company-${index}`} placeholder="Add the company or client name" name="company" value={experience.company} onChange={(e) => handleExperienceInputChange(index, e)} />
                </div>
                <div className="form-group">
                  <label htmlFor={`accomplishments-${index}`}>Notable Accomplishments</label>
                  <textarea type="text" id={`accomplishments-${index}`} name="accomplishments" placeholder="List things that you are proud to have accomplished in this role" value={experience.accomplishments} onChange={(e) => handleExperienceInputChange(index, e)} />
                </div>
                <div className="form-group">
                  <label htmlFor={`softwareUsed-${index}`}>Software used</label>
                  <input type="text" id={`softwareUsed-${index}`} placeholder="Add the software/s you mainly used in this role" name="softwareUsed" value={experience.softwareUsed} onChange={(e) => handleExperienceInputChange(index, e)} />
                </div>
                <div className="form-group date-container">
                  <div>
                    <label htmlFor={`startDate-${index}`}>Start Date</label>
                    <input type="date" id={`startDate-${index}`} name="startDate" value={experience.startDate} onChange={(e) => handleExperienceInputChange(index, e)} />
                  </div>
                  <div>
                    <label htmlFor={`endDate-${index}`}>End Date</label>
                    <input type="date" id={`endDate-${index}`} name="endDate" value={experience.endDate} onChange={(e) => handleExperienceInputChange(index, e)} disabled={experience.currentlyEmployed} />
                  </div>
                </div>
                <div className="form-group currently-employed-container">
                  <input
                    type="checkbox"
                    id={`currentlyEmployed-${index}`}
                    name="currentlyEmployed"
                    checked={experience.currentlyEmployed}
                    onChange={(e) => handleExperienceInputChange(index, e)}
                    disabled={experience.endDate !== ''}
                  />
                  <label htmlFor={`currentlyEmployed-${index}`}>Currently employed here</label>

                </div>
              </div>
            ))}
            <button className="addExperience" onClick={handleAddExperience} disabled={!isLastExperienceComplete()}>
              Add {experiences.length === 0 ? '' : 'Another'} Experience
            </button>
            <button className="addTraining" onClick={handleAddTraining}>Add Education and Certifications</button>
            <button type="submit">Submit</button>
          </form>
        </div>
      )}
    </>
  )
}

export default App