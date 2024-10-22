// src/ResumePreview.jsx
import React from 'react';

const ResumePreview = ({
    firstName,
    lastName,
    email,
    professionalSummary,
    hoursAvailability,
    selectedTimezones,
    experiences,
    education,
    selectedPronouns,
    softwareTools,
    services,
    city,
    country
}) => {
    // Helper function to format date to "Month Year"
    const formatDate = (dateString) => {
        // Append 'T12:00:00Z' to the date string to ensure it's interpreted in UTC
        const date = new Date(`${dateString}T12:00:00Z`);

        // Define options for displaying the date as "Month Year"
        const options = { year: 'numeric', month: 'long', timeZone: 'UTC' };

        // Return the formatted date string
        return date.toLocaleDateString(undefined, options);
    };

    // Helper function to capitalize the first letter of a string
    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    return (
        <div className="resume-preview">
            <div className="rp-header">
                <h3>
                    {firstName ? `${firstName} ` : 'First Name '}
                </h3>
                <h3 >
                    {lastName || 'Last Name'}
                </h3>
                <span className='rp-email'>{email.toUpperCase() || 'Email'}</span>
                <div className="rp-professional-summary">
                    <p><strong>
                        {professionalSummary || 'Professional Summary'}
                    </strong>
                    </p>
                </div>
            </div>
            <div className="rp-columns">
                <div className="rp-column1">
                    {services && services.length > 0 && <div className="rp-services">
                        <h4>Services Offered</h4>
                        <ul>
                            {services && services.length > 0 ? (
                                services.map((service, index) => (
                                    <li key={index}>
                                        <p>{service.service} - ${service.hourlyRate}/hour</p>
                                        <span className='rp-service-description'>{service.description}</span>
                                    </li>
                                ))
                            ) : (
                                <li>No services listed</li>
                            )}
                        </ul>
                    </div>}
                    <div className="rp-work-experience">
                        <h4>Work Experience</h4>
                        {experiences.map((exp, index) => (
                            <div className='rp-work-experience-item' key={index}>
                                <h4>
                                    <strong className='rp-work-experience-role'>{exp.role.trim().toUpperCase()}</strong>, {exp.company.trim()}
                                </h4>

                                <span className='rp-work-experience-dates'>
                                    {formatDate(exp.startDate).toUpperCase()} to {exp.currentlyEmployed ? 'Present' : formatDate(exp.endDate).toUpperCase()}
                                </span>
                                {exp.accomplishments && exp.accomplishments.trim() !== '' && (
                                    <ul>
                                        {exp.accomplishments.split(/(?<=^|[\n•])-\s+|•\s+/)
                                            .filter(accomplishment => accomplishment.trim() !== '')
                                            .map((accomplishment, i) => (
                                                <li key={i}>{accomplishment.trim()}</li>
                                            ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="rp-education">
                        <h4>Training and Education</h4>
                        {education.map((edu, index) => (
                            <div className='rp-education-item' key={index}>
                                <p><strong>{edu.institution.trim()}</strong></p>
                                <span className='rp-education-year'>{edu.certification},{edu.yearCompleted}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rp-column2">
                    <div className="rp-overview">
                        <h4>Overview</h4>
                        <ul>
                            {selectedPronouns && <li>{capitalizeFirstLetter(selectedPronouns)}</li>}
                            {(city || country) && <li>Based in {city}, {country} </li>}
                            {hoursAvailability && <li>Available for {hoursAvailability} hours/week in {selectedTimezones.join(', ')}</li>}

                        </ul>
                    </div>
                    <div className="rp-tools">
                        <h4>Tools</h4>
                        <ul>

                            {softwareTools.sort()
                                .filter(software => software.trim() !== '')
                                .map((tool, index) => (
                                    <li key={index}>{tool}</li>
                                ))}
                        </ul>
                    </div>
                </div>

            </div >

        </div >
    );
};

export default ResumePreview;
