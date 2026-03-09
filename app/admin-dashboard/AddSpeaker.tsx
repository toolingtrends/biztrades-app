"use client";

import Image from "next/image";
import { Facebook, Linkedin, Twitter, Instagram, Upload, X } from "lucide-react";
import { useState } from "react";

export default function AddSpeaker() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    company: "",
    jobTitle: "",
    location: "",
    website: "",
    linkedin: "",
    twitter: "",
    instagram: "",
    specialties: [] as string[],
    achievements: [] as string[],
    certifications: [] as string[],
    speakingExperience: "",
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'speakers/avatars');

      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Upload failed');
      }

      if (result.success) {
        setProfileImage(result.secure_url);
        console.log('Upload successful:', result.public_id);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      // Reset the file input
      event.target.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setUploadError(null);
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()];
      setCategories(updatedCategories);
      setFormData(prev => ({
        ...prev,
        specialties: updatedCategories
      }));
      setNewCategory("");
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    const updatedCategories = categories.filter(category => category !== categoryToRemove);
    setCategories(updatedCategories);
    setFormData(prev => ({
      ...prev,
      specialties: updatedCategories
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSpeaker = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill in all required fields: First Name, Last Name, and Email');
      return;
    }

    try {
      const speakerData = {
        ...formData,
        avatar: profileImage,
        // Ensure arrays are properly set
        specialties: categories,
        achievements: formData.achievements,
        certifications: formData.certifications,
      };

      const response = await fetch('/api/admin/speakers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(speakerData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Speaker created successfully!');
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          bio: "",
          company: "",
          jobTitle: "",
          location: "",
          website: "",
          linkedin: "",
          twitter: "",
          instagram: "",
          specialties: [],
          achievements: [],
          certifications: [],
          speakingExperience: "",
        });
        setProfileImage(null);
        setCategories([]);
      } else {
        throw new Error(result.error || 'Failed to create speaker');
      }
    } catch (error) {
      console.error('Error saving speaker:', error);
      alert(`Error saving speaker: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="w-full p-8 border border-[#00AEEF] rounded-lg bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Add Speaker</h1>
        <button 
          onClick={handleSaveSpeaker}
          disabled={uploading}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          {uploading ? "Uploading..." : "Save Speaker"}
        </button>
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Upload Error:</strong> {uploadError}
        </div>
      )}

      {/* TOP SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card with Logo Upload */}
        <div className="flex flex-col items-center border rounded-xl p-6 bg-white shadow-sm">
          <div className="relative w-32 h-32 mb-4 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
            {profileImage ? (
              <>
                <Image 
                  src={profileImage} 
                  alt="Profile" 
                  width={128} 
                  height={128}
                  className="object-cover w-full h-full"
                />
                <button
                  onClick={handleRemoveImage}
                  disabled={uploading}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:bg-gray-400"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <div className="text-center p-4">
                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                <span className="text-xs text-gray-500 block">
                  {uploading ? "Uploading..." : "Click to upload"}
                </span>
                <span className="text-xs text-gray-400 block mt-1">
                  PNG, JPG, WEBP (max 5MB)
                </span>
              </div>
            )}
            
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>

          <input 
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="text-lg font-semibold text-center border-b border-transparent hover:border-gray-300 focus:border-gray-300 focus:outline-none mb-1 w-full" 
            placeholder="First Name *"
            required
          />
          <input 
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="text-lg font-semibold text-center border-b border-transparent hover:border-gray-300 focus:border-gray-300 focus:outline-none mb-1 w-full" 
            placeholder="Last Name *"
            required
          />
          <input 
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleInputChange}
            className="text-sm text-gray-600 text-center border-b border-transparent hover:border-gray-300 focus:border-gray-300 focus:outline-none mb-1 w-full" 
            placeholder="Designation"
          />
          <input 
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            className="text-xs text-gray-500 text-center border-b border-transparent hover:border-gray-300 focus:border-gray-300 focus:outline-none w-full" 
            placeholder="Company"
          />
        </div>

        {/* Contact Information */}
        <div className="lg:col-span-2 border rounded-xl p-6 shadow-sm bg-white">
          <h2 className="font-semibold mb-4 text-[16px]">Contact Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input 
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="input" 
              placeholder="Company Name" 
            />
            <input 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              type="email" 
              className="input" 
              placeholder="Email *" 
              required
            />
            <input 
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleInputChange}
              className="input" 
              placeholder="Designation" 
            />
            <input 
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              type="tel" 
              className="input" 
              placeholder="Mobile" 
            />
            <input 
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="input" 
              placeholder="Location" 
            />
            <input 
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              type="url" 
              className="input" 
              placeholder="Website" 
            />
          </div>
        </div>

        {/* Social Media */}
        <div className="border rounded-xl p-6 shadow-sm bg-white">
          <h2 className="font-semibold mb-4 text-[16px]">Social Media Links</h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Linkedin size={16} className="text-gray-500" />
              <input 
                name="linkedin"
                value={formData.linkedin}
                onChange={handleInputChange}
                className="input flex-1" 
                placeholder="LinkedIn profile URL" 
              />
            </div>
            <div className="flex items-center gap-2">
              <Twitter size={16} className="text-gray-500" />
              <input 
                name="twitter"
                value={formData.twitter}
                onChange={handleInputChange}
                className="input flex-1" 
                placeholder="Twitter profile URL" 
              />
            </div>
            <div className="flex items-center gap-2">
              <Facebook size={16} className="text-gray-500" />
              <input 
                name="facebook"
                className="input flex-1" 
                placeholder="Facebook profile URL" 
              />
            </div>
            <div className="flex items-center gap-2">
              <Instagram size={16} className="text-gray-500" />
              <input 
                name="instagram"
                value={formData.instagram}
                onChange={handleInputChange}
                className="input flex-1" 
                placeholder="Instagram profile URL" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rest of your form remains the same... */}
      {/* BIO + SPEAKING EXPERIENCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="border rounded-xl p-6 shadow-sm bg-white">
          <h2 className="font-semibold mb-3">Professional Bio</h2>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            className="input h-[120px]"
            placeholder="Enter professional bio"
          />
        </div>

        <div className="border rounded-xl p-6 shadow-sm bg-white">
          <h2 className="font-semibold mb-3">Speaking Experience</h2>
          <textarea
            name="speakingExperience"
            value={formData.speakingExperience}
            onChange={handleInputChange}
            className="input h-[120px]"
            placeholder="Enter speaking experience"
          />
        </div>
      </div>

      {/* SPECIALTIES/CATEGORIES */}
      <div className="border rounded-xl p-6 shadow-sm bg-white mt-8">
        <h2 className="font-semibold mb-3">Speaker Specialties</h2>

        <div className="flex flex-wrap gap-3 mb-4">
          {categories.map((tag) => (
            <span
              key={tag}
              className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm border flex items-center gap-2"
            >
              {tag}
              <button
                onClick={() => handleRemoveCategory(tag)}
                className="hover:text-red-500"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        
        <div className="flex gap-2">
          <input 
            className="input flex-1" 
            placeholder="Add new specialty"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={handleAddCategory}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Add
          </button>
        </div>
      </div>

      {/* ADDITIONAL FIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="border rounded-xl p-6 shadow-sm bg-white">
          <h2 className="font-semibold mb-3">Achievements</h2>
          <textarea
            name="achievements"
            value={formData.achievements.join(', ')}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              achievements: e.target.value.split(',').map(item => item.trim()).filter(item => item)
            }))}
            className="input h-[120px]"
            placeholder="Enter achievements (comma separated)"
          />
        </div>

        <div className="border rounded-xl p-6 shadow-sm bg-white">
          <h2 className="font-semibold mb-3">Certifications</h2>
          <textarea
            name="certifications"
            value={formData.certifications.join(', ')}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              certifications: e.target.value.split(',').map(item => item.trim()).filter(item => item)
            }))}
            className="input h-[120px]"
            placeholder="Enter certifications (comma separated)"
          />
        </div>
      </div>
    </div>
  );
}