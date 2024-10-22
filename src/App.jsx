import { useState, useEffect, useRef } from 'react'
import './App.css'
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid' // Import nanoid
import ResumePreview from './ResumePreview'
import html2pdf from 'html2pdf.js';


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
  const [education, setEducation] = useState(() => {
    return savedData?.education || [];
  });
  const [errorMessages, setErrorMessages] = useState([]); // State for error messages
  const [city, setCity] = useState(() => {
    return savedData?.city || '';
  });
  const [country, setCountry] = useState(() => {
    return savedData?.country || '';
  });
  const [services, setServices] = useState(() => {
    return savedData?.services || [];
  });

  const errorRef = useRef(null); // Create a ref for the error message container

  // Scroll to error messages when they are updated
  useEffect(() => {
    if (errorMessages.length > 0 && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [errorMessages]);

  // Save form data to local storage whenever it changes
  useEffect(() => {
    // Filter out incomplete experiences
    const completeExperiences = experiences.filter(exp => {
      return exp.role && exp.company && exp.accomplishments && exp.startDate && (exp.currentlyEmployed || exp.endDate);
    });

    // Filter out incomplete education entries
    const completeEducation = education.filter(edu => {
      return edu.institution && edu.certification && edu.yearCompleted;
    });

    // Filter out incomplete services
    const completeServices = services.filter(service => {
      return service.service && service.hourlyRate;
    });

    const formData = {
      firstName,
      lastName,
      email,
      professionalSummary,
      hoursAvailability,
      selectedTimezones,
      experiences: completeExperiences, // Save only complete experiences
      education: completeEducation, // Save only complete education entries
      selectedPronouns,
      city, // Save city
      country, // Save country
      services: completeServices // Save only complete services
    };

    localStorage.setItem('formData', JSON.stringify(formData));
  }, [firstName, lastName, email, professionalSummary, hoursAvailability, selectedTimezones, experiences, education, city, country, services]);

  // Function to check if the last experience form is complete
  const isLastExperienceComplete = () => {
    if (experiences.length === 0) return true; // Allow adding the first experience
    const lastExperience = experiences[experiences.length - 1];
    // Check if all fields are filled, except endDate if currentlyEmployed is true and excluding softwareUsed
    return Object.entries(lastExperience).every(([key, value]) => {
      if (key === 'endDate' && lastExperience.currentlyEmployed) return true;
      if (key === 'softwareUsed') return true; // Do not require softwareUsed to be filled
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
  const handleAddExperience = (e) => {
    e.preventDefault(); // Prevent form submission
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

    // Replace '- ' with a newline in accomplishments
    if (name === 'accomplishments') {
      newExperiences[index][name] = value.replace(/(^|\n)-\s(?!\w)/g, '$1• ');
    }




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


  const generatePDF = async () => {
    const element = document.querySelector('.resume-preview');
    const options = {
      margin: 0,
      filename: `${firstName}_${lastName}_resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    const pdfBlob = await html2pdf().from(element).set(options).outputPdf('blob');

    // Return both pdfBlob and pdfUrl
    return { pdfBlob };
  };



  // Update function name
  const handleSubmit = async (e) => {
    e.preventDefault();

    const missingFields = [];
    const newErrorMessages = [];

    // Check for missing fields in the basic info
    if (!firstName.trim()) missingFields.push('First Name');
    if (!lastName.trim()) missingFields.push('Last Name');
    if (!email.trim()) missingFields.push('Email');
    if (!professionalSummary.trim()) missingFields.push('Professional Summary');
    if (isNaN(hoursAvailability) || hoursAvailability <= 0) missingFields.push('Hours Availability');
    if (selectedTimezones.length === 0) missingFields.push('Preferred Timezones');

    // Check for at least one complete experience
    const completeExperiences = experiences.filter(exp => {
      return exp.role && exp.company && exp.accomplishments && exp.startDate && (exp.currentlyEmployed || exp.endDate);
    });

    if (completeExperiences.length === 0) {
      missingFields.push('At least one complete Experience');
    }

    // Check for at least one complete education entry
    const completeEducation = education.filter(edu => {
      return edu.institution && edu.certification && edu.yearCompleted;
    });

    if (missingFields.length > 0) {
      newErrorMessages.push(`Please fill out the following fields: ${missingFields.join(', ')}`);
      setErrorMessages(newErrorMessages);
      return;
    }

    const formattedExperiences = completeExperiences.map((exp, index) => {
      const endDate = exp.currentlyEmployed ? 'present' : exp.endDate;
      return `${index + 1}. ${exp.role} at ${exp.company} from ${exp.startDate} to ${endDate}. Their notable accomplishments include:\n- ${exp.accomplishments.split('. ').join('\n- ')}\n\nThey used the following software in that role:\n- ${exp.softwareUsed.split(', ').join('\n- ')}`;
    }).join('\n\n');

    const formSummary = `${firstName} ${lastName} is available to work ${hoursAvailability} hours per week in the following timezones: ${selectedTimezones.join(", ")}\n\n` +
      `Their professional summary says: ${professionalSummary}\n\n` +
      `Their work experiences are:\n${formattedExperiences}`;

    const profileSummaryEmbedding = await embedInfo(formSummary);

    const { pdfBlob } = await generatePDF();
    console.log('PDF Blob:', pdfBlob); // Check if this is a valid Blob

    const supabaseWorkerUrl = "https://supabase-worker.marsescobin.workers.dev/";

    const formData = new FormData();
    formData.append('application_id', applicationId);
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('email', email);
    formData.append('professional_summary', professionalSummary);
    formData.append('hours_availability', hoursAvailability);
    formData.append('selected_timezones', JSON.stringify(selectedTimezones)); // Convert arrays to JSON strings
    formData.append('work_experiences', JSON.stringify(completeExperiences));
    formData.append('education', JSON.stringify(completeEducation));
    formData.append('services', JSON.stringify(services));
    formData.append('profile_summary', formSummary);
    formData.append('profile_summary_embedding', JSON.stringify(profileSummaryEmbedding));
    formData.append('City', city);
    formData.append('Country', country);
    formData.append('resume_pdf', pdfBlob); // Append the file
    formData.append('selected_pronouns', selectedPronouns); // Add this line to include pronouns

    try {
      const response = await fetch(supabaseWorkerUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const supabaseResult = await response.json();

      if (supabaseResult && supabaseResult.success) {

        // Set isSubmitted to true after successful upload
        setIsSubmitted(true);
        setErrorMessages([]);

        // Clear local storage and reset form state
        localStorage.removeItem('formData');
        setFirstName('');
        setLastName('');
        setEmail('');
        setSelectedPronouns('');
        setProfessionalSummary('');
        setHoursAvailability('');
        setSelectedTimezones([]);
        setExperiences([]);
        setEducation([]);
        setApplicationId(nanoid());
        setCity('');
        setCountry('');
        setServices([]);
      } else {
        console.error('Submission failed:', supabaseResult);
        newErrorMessages.push('Submission failed. Please try again.');
        setErrorMessages(newErrorMessages);
      }
    } catch (error) {
      console.error('Error during submission:', error);
      newErrorMessages.push('An error occurred during submission. Please try again.');
      setErrorMessages(newErrorMessages);
    }
  };

  const handleEmailChange = (e) => { // New handler for email
    setEmail(e.target.value);
  };

  // Function to check if the last education form is complete
  const isLastEducationComplete = () => {
    if (education.length === 0) return true; // Allow adding the first education entry
    const lastEducation = education[education.length - 1];
    // Check if all fields are filled
    return Object.values(lastEducation).every(value => value.trim() !== '');
  };

  // Function to add a new education form
  const handleAddEducation = (e) => {
    e.preventDefault(); // Prevent form submission
    if (isLastEducationComplete()) {
      setEducation([...education, { institution: '', certification: '', yearCompleted: '' }]);
    } else {
      alert('Please fill out all fields in the last education form before adding a new one.');
    }
  };

  // Function to handle input change for a specific education entry
  const handleEducationInputChange = (index, e) => {
    const { name, value } = e.target;
    const newEducation = [...education];
    newEducation[index][name] = value;
    setEducation(newEducation);
  };

  const handleCityChange = (e) => {
    setCity(e.target.value);
  };

  const handleCountryChange = (e) => {
    setCountry(e.target.value);
  };

  const softwareTools = Array.from(new Set(
    experiences.flatMap(exp => exp.softwareUsed.split(',').map(tool => tool.trim()))
  ));

  // Function to check if the last service form is complete
  const isLastServiceComplete = () => {
    if (services.length === 0) return true; // Allow adding the first service
    const lastService = services[services.length - 1];
    // Check if all required fields are filled
    return lastService.service.trim() !== '' && lastService.hourlyRate !== '';
  };

  // Function to add a new service form
  const handleAddService = () => {
    if (isLastServiceComplete()) {
      setServices([...services, { service: '', hourlyRate: '', description: '' }]);
    } else {
      alert('Please fill out all fields in the last service form before adding a new one.');
    }
  };

  // Function to handle input change for a specific service
  const handleServiceInputChange = (index, e) => {
    const { name, value } = e.target;
    const newServices = [...services];
    newServices[index][name] = value;
    setServices(newServices);
  };

  return (
    <>
      <h1>DoerDriven</h1>
      <div className="app-container">
        {isSubmitted ? "" :
          <div className='basicInfo-text'>
            <p>Apply as a Doer and join our network of remote workers.
              We'll match you with the right clients and projects based on your skills and availability.
            </p>
          </div>
        }
        {isSubmitted ? (
          <div className="confirmation-message">
            Thank you for your submission!
          </div>
        ) : (
          <div className="form-and-preview">
            <div className='basicInfo'>
              <form onSubmit={handleSubmit}>
                {/* Display error messages */}
                {errorMessages.length > 0 && (
                  <div className="error-messages" ref={errorRef}>
                    {errorMessages.map((msg, index) => (
                      <p key={index} className="error">{msg}</p>
                    ))}
                  </div>
                )}
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
                    <input type="email" id="email" name="email" value={email} onChange={handleEmailChange}
                      placeholder='An active email address we cant contact you from' required />
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
                  <div className='location-container'>
                    <div className='form-group'>
                      <label htmlFor="city">City</label>
                      <input className="input-city" type="text" id="city" name="city" value={city} onChange={handleCityChange} />
                    </div>
                    <div className='form-group'>
                      <label htmlFor="country">Country</label>
                      <input className="input-country" type="text" id="country" name="country" value={country} onChange={handleCountryChange} />
                    </div>
                  </div>
                </div>
                <div className='form-group'>
                  <label htmlFor="professionalSummary">Professional Summary</label>
                  <textarea id="professionalSummary" name="professionalSummary" placeholder="What's a good way to summarize your professional experience? Keep it straight to the point. 1-2 sentences is best." value={professionalSummary} onChange={handleProfessionalSummaryChange} />
                </div>
                <div className='form-group'>
                  <label htmlFor="hoursAvailability">Hours Availability</label>
                  <input type="number" id="hoursAvailability" name="hoursAvailability" placeholder="How many hours can you work per week?" value={hoursAvailability} onChange={handleHoursAvailabilityChange} />
                </div>
                <div className='form-group'>
                  <label>Preferred Timezones</label>
                  <div className="timezone-container">
                    <label>
                      <input type="checkbox" id="pst" value="PST" onChange={handleTimezoneChange} checked={selectedTimezones.includes('PST')} /><span>PST</span>
                    </label>
                    <label>
                      <input type="checkbox" id="cst" value="CST" onChange={handleTimezoneChange} checked={selectedTimezones.includes('CST')} /><span>CST</span>
                    </label>
                    <label>
                      <input type="checkbox" id="mst" value="MST" onChange={handleTimezoneChange} checked={selectedTimezones.includes('MST')} /><span>MST</span>
                    </label>
                    <label>
                      <input type="checkbox" id="est" value="EST" onChange={handleTimezoneChange} checked={selectedTimezones.includes('EST')} /><span>EST</span>
                    </label>
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
                      <textarea type="text" id={`accomplishments-${index}`} name="accomplishments" placeholder="List things that you are proud to have accomplished in this role. Use dash (-) to separate each accomplishment." value={experience.accomplishments} onChange={(e) => handleExperienceInputChange(index, e)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`softwareUsed-${index}`}>Software used</label>
                      <input type="text" id={`softwareUsed-${index}`} placeholder="Add the software/s you used to be successful in this role" name="softwareUsed" value={experience.softwareUsed} onChange={(e) => handleExperienceInputChange(index, e)} />
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
                {education.map((edu, index) => (
                  <div key={index} className='education'>
                    <h2>Training/Education {index + 1}</h2>
                    <div className="form-group">
                      <label htmlFor={`institution-${index}`}>Institution</label>
                      <input type="text" id={`institution-${index}`} placeholder="University, Bootcamp, or Training Institution" name="institution" value={edu.institution} onChange={(e) => handleEducationInputChange(index, e)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`certification-${index}`}>Specialization</label>
                      <input type="text" id={`certification-${index}`} name="certification" placeholder="Your focus of study or training specialization" value={edu.certification} onChange={(e) => handleEducationInputChange(index, e)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`yearCompleted-${index}`}>Year Completed</label>
                      <input type="text" id={`yearCompleted-${index}`} name="yearCompleted" placeholder="You may add 'ongoing' if you are still taking classes" value={edu.yearCompleted} onChange={(e) => handleEducationInputChange(index, e)} />
                    </div>
                  </div>
                ))}
                <button className="addEducation" onClick={handleAddEducation} disabled={!isLastEducationComplete()}>
                  Add Training or Education
                </button>
                {services.map((service, index) => (
                  <div key={index} className='service'>
                    <h2>Service {index + 1}</h2>
                    <div className="form-group">
                      <label htmlFor={`service-${index}`}>Service</label>
                      <input type="text" id={`service-${index}`} placeholder="E.g., Executive Assistance, Social Media Management, Graphic Design, Web Development, etc" name="service" value={service.service} onChange={(e) => handleServiceInputChange(index, e)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`hourlyRate-${index}`}>Hourly Rate (USD)</label>
                      <input type="number" id={`hourlyRate-${index}`} placeholder="How much do you charge per hour?" name="hourlyRate" value={service.hourlyRate} onChange={(e) => handleServiceInputChange(index, e)} />
                    </div>
                  </div>
                ))}
                <button className="addService" onClick={handleAddService} disabled={!isLastServiceComplete()}>
                  Add Service
                </button>
                <button type="submit">Submit</button>
              </form>
            </div>
            <ResumePreview
              firstName={firstName}
              lastName={lastName}
              email={email}
              professionalSummary={professionalSummary}
              hoursAvailability={hoursAvailability}
              selectedTimezones={selectedTimezones}
              experiences={experiences}
              education={education}
              selectedPronouns={selectedPronouns}
              softwareTools={softwareTools}
              services={services}
              city={city}
              country={country}
            // Pass the deduplicated software tools
            />
          </div >
        )
        }
      </div >
    </>
  )
}

export default App
