import { useState, useEffect } from 'react'
import './App.css'
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid' // Import nanoid

// Initialize Supabase client

function App() {
  const [name, setName] = useState('')
  const [hours, setHours] = useState('')
  const [experiences, setExperiences] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [newExperience, setNewExperience] = useState({
    title: '',
    company: '',
    description: '',
    duration: ''
  })
  const [userId, setUserId] = useState(nanoid()) // Generate a nanoid for the user

  // New state for the form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [summary, setSummary] = useState('')
  const [hoursAvailability, setHoursAvailability] = useState('')
  const [timezone, setTimezone] = useState('')

  const [selectedTimezones, setSelectedTimezones] = useState([]); // New state for selected timezones

  const [isInfoSaved, setIsInfoSaved] = useState(false); // New state to track if user info is saved

  const [email, setEmail] = useState(''); // New state for email

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewExperience({ ...newExperience, [name]: value })
  }

  // New handlers for the new fields
  const handleFirstNameChange = (e) => {
    setFirstName(e.target.value)
  }

  const handleLastNameChange = (e) => {
    setLastName(e.target.value)
  }

  const handleSummaryChange = (e) => {
    setSummary(e.target.value)
  }

  const handleHoursAvailabilityChange = (e) => {
    setHoursAvailability(e.target.value)
  }

  const handleTimezoneChange = (e) => {
    const { value } = e.target;
    setSelectedTimezones((prev) => {
      if (prev.includes(value)) {
        // If already selected, remove it
        return prev.filter((tz) => tz !== value);
      } else {
        // If not selected, add it
        return [...prev, value];
      }
    });
  };

  const handleAddExperience = () => {
    if (showForm && (!newExperience.title || !newExperience.company || !newExperience.description || !newExperience.duration)) {
      alert('You have to fill out the last form')
      return
    }
    setShowForm(true)
  }

  const handleSaveExperience = async (e) => {
    e.preventDefault()
    if (!newExperience.title || !newExperience.company || !newExperience.description || !newExperience.duration) {
      alert('All fields are required')
      return
    }
    const fullExperience = newExperience.title
      + " at " + newExperience.company + " for " +
      newExperience.duration + " months."
      + "\n" + newExperience.description

    // Create embedding for experience description
    const openAIWorkerUrl = "https://openai-worker.marsescobin.workers.dev/"
    const openAIWorkerResponse = await fetch(openAIWorkerUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: fullExperience })
      });

    const experienceEmbedding = await openAIWorkerResponse.json()
    // Save to Supabase
    const supabaseWorkerUrl = "https://supabase-worker.marsescobin.workers.dev/"

    const supabaseWorkerResponse = await fetch(supabaseWorkerUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          first_name: firstName, // New field
          last_name: lastName,   // New field
          summary: summary,      // New field
          hours: parseInt(hoursAvailability), // Updated to use new state
          timezones: selectedTimezones, // Updated to save multiple timezones
          title: newExperience.title,
          company: newExperience.company,
          experience_description: fullExperience,
          experience_duration: parseInt(newExperience.duration),
          description_embedding: experienceEmbedding.data[0].embedding
        })
      });

    const supabaseResult = await supabaseWorkerResponse.json();
    setExperiences([...experiences, { ...newExperience, hours: hoursAvailability }]) // Updated to use new state
    setNewExperience({ title: '', company: '', description: '', duration: '' })
    setShowForm(false)

  }

  const isFormFilled = newExperience.title && newExperience.company && newExperience.description && newExperience.duration

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !summary || !hoursAvailability || selectedTimezones.length === 0 || !email) { // Check for email
      alert('All fields are required');
      return;
    }

    // Save user info to Supabase
    const supabaseWorkerUrl = "https://supabase-worker.marsescobin.workers.dev/";

    const supabaseWorkerResponse = await fetch(supabaseWorkerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        summary: summary,
        hours: parseInt(hoursAvailability),
        timezones: selectedTimezones,
        email: email, // New field for email
      }),
    });

    const supabaseResult = await supabaseWorkerResponse.json();
    // Optionally handle the response here
    setIsInfoSaved(true); // Mark info as saved
    setShowForm(true); // Show the experience form after saving info
  };

  const handleEmailChange = (e) => { // New handler for email
    setEmail(e.target.value);
  };

  return (
    <>
      <h1>DoerDriven</h1>
      <p>Share your experience and availability to join our remote work network. We'll match you with clients looking for your exact qualification.</p>
      <form onSubmit={handleSaveInfo}>
        <div>
          <label htmlFor="firstName">First Name:</label>
          <input type="text" id="firstName" name="firstName" value={firstName} onChange={handleFirstNameChange} />
        </div>
        <div>
          <label htmlFor="lastName">Last Name:</label>
          <input type="text" id="lastName" name="lastName" value={lastName} onChange={handleLastNameChange} />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={email} onChange={handleEmailChange} required /> {/* New email input */}
        </div>
        <div>
          <label htmlFor="summary">Summary:</label>
          <input type="text" id="summary" name="summary" placeholder="Summarize your professional experience in 1-2 sentences." value={summary} onChange={handleSummaryChange} />
        </div>
        <div>
          <label htmlFor="hoursAvailability">Hours Availability:</label>
          <input type="number" id="hoursAvailability" name="hoursAvailability" placeholder="How many hours you're available to work per week" value={hoursAvailability} onChange={handleHoursAvailabilityChange} />
        </div>
        <div>
          <label>Preferred Timezones:</label>
          <div>
            <input type="checkbox" id="pst" value="PST" checked={selectedTimezones.includes("PST")} onChange={handleTimezoneChange} />
            <label htmlFor="pst">PST</label>
            <input type="checkbox" id="cst" value="CST" checked={selectedTimezones.includes("CST")} onChange={handleTimezoneChange} />
            <label htmlFor="cst">CST</label>
            <input type="checkbox" id="mst" value="MST" checked={selectedTimezones.includes("MST")} onChange={handleTimezoneChange} />
            <label htmlFor="mst">MST</label>
            <input type="checkbox" id="est" value="EST" checked={selectedTimezones.includes("EST")} onChange={handleTimezoneChange} />
            <label htmlFor="est">EST</label>
            <input type="checkbox" id="all" value="all" checked={selectedTimezones.includes("all")} onChange={handleTimezoneChange} />
            <label htmlFor="all">All</label>

          </div>
        </div>
        {!isInfoSaved && ( // Only show the button if info is not saved
          <button type="submit">Save Info</button>
        )}
      </form>
      <button onClick={handleAddExperience} disabled={showForm && !isFormFilled}>Add Experience</button>
      {showForm && (
        <form onSubmit={handleSaveExperience} className="experience-form">
          <h2>Add Experience</h2>
          <div>
            <label htmlFor="title">Title:</label>
            <input type="text" id="title" name="title" value={newExperience.title} onChange={handleInputChange} />
          </div>
          <div>
            <label htmlFor="company">Client/Company:</label>
            <input type="text" id="company" name="company" value={newExperience.company} onChange={handleInputChange} />
          </div>
          <div>
            <label htmlFor="description">Notable accomplishments:</label>
            <textarea id="description" name="description" value={newExperience.description} onChange={handleInputChange}></textarea>
          </div>
          <div>
            <label htmlFor="duration">Duration (in months):</label>
            <input type="number" id="duration" name="duration" value={newExperience.duration} onChange={handleInputChange} />
          </div>
          <button type="submit">Save Experience</button>
        </form>
      )}
      {name && <h2>Name: {name}</h2>}
      {hours && <h2>Hours: {hours}</h2>}

      <ul>
        {experiences.map((exp, index) => (
          <li key={index}>
            <h3>{exp.title}</h3>
            <p>{exp.company}</p>
            <p>{exp.description}</p>
            <p>{exp.duration} months</p>
          </li>
        ))}
      </ul>
    </>
  )
}

export default App