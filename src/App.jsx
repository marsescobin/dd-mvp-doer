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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewExperience({ ...newExperience, [name]: value })
  }

  const handleNameChange = (e) => {
    setName(e.target.value)
  }

  const handleHoursChange = (e) => {
    setHours(e.target.value)
  }

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
          name,
          hours: parseInt(hours),
          title: newExperience.title,
          company: newExperience.company,
          experience_description: fullExperience,
          experience_duration: parseInt(newExperience.duration),
          description_embedding: experienceEmbedding.data[0].embedding
        })
      });

    const supabaseResult = await supabaseWorkerResponse.json();
    setExperiences([...experiences, { ...newExperience, hours }])
    setNewExperience({ title: '', company: '', description: '', duration: '' })
    setShowForm(false)

  }

  const isFormFilled = newExperience.title && newExperience.company && newExperience.description && newExperience.duration

  return (
    <>
      <h1>Doer Side</h1>
      <form action="">
        <div>
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" name="name" value={name} onChange={handleNameChange} />
        </div>
        <div>
          <label htmlFor="hours">Hours per week:</label>
          <input type="number" id="hours" name="hours" value={hours} onChange={handleHoursChange} />
        </div>
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

