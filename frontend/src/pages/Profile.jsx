

import { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/auth';
import Sidebar from '../components/SideBar';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef(null);

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        bio: user?.bio || '',
        profile_picture: user?.profile_picture || ''
    });
    const [previewImage, setPreviewImage] = useState(user?.profile_picture || '');

    // Generate initials for default avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        const names = name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Handle input changes
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Handle profile picture selection
    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            setPreviewImage(base64String);
            setFormData(prev => ({
                ...prev,
                profile_picture: base64String
            }));
        };
        reader.readAsDataURL(file);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await updateProfile({
                name: formData.name,
                bio: formData.bio,
                profile_picture: formData.profile_picture
            });

            // Update context with new user data
            updateUser(response.user);

            toast.success('Profile updated successfully!');
            setIsEditing(false);
        } catch (err) {
            const message = err.response?.data?.detail || 'Failed to update profile';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // Cancel editing
    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            bio: user?.bio || '',
            profile_picture: user?.profile_picture || ''
        });
        setPreviewImage(user?.profile_picture || '');
        setIsEditing(false);
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 p-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
                        <p className="text-gray-400">Manage your personal information</p>
                    </div>

                    {/* Profile Card */}
                    <div className="max-w-2xl mx-auto">
                        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"></div>

                            {/* Profile Picture Section */}
                            <div className="flex flex-col items-center mb-8 relative z-10">
                                <div className="relative group">
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Profile"
                                            className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-4xl font-bold text-white border-4 border-white/20 shadow-2xl transition-transform group-hover:scale-105">
                                            {getInitials(user?.name)}
                                        </div>
                                    )}

                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </button>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                </div>

                                {/* User Info Display (when not editing) */}
                                {!isEditing && (
                                    <div className="text-center mt-4">
                                        <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                                        <p className="text-gray-400">{user?.email}</p>
                                        {user?.bio && (
                                            <p className="text-gray-300 mt-4 max-w-md">{user.bio}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Edit Form */}
                            {isEditing ? (
                                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                    {/* Name Input */}
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                minLength={2}
                                                maxLength={100}
                                                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>

                                    {/* Email (Read-only) */}
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="email"
                                                id="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 cursor-not-allowed"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                    </div>

                                    {/* Bio Input */}
                                    <div>
                                        <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                                            Bio
                                            <span className="text-gray-500 text-xs ml-2">({formData.bio.length}/500)</span>
                                        </label>
                                        <textarea
                                            id="bio"
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            maxLength={500}
                                            rows={4}
                                            className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 resize-none"
                                            placeholder="Tell us about yourself..."
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-white border-2 border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300 group-hover:scale-105"></div>
                                            <span className="relative flex items-center justify-center gap-2">
                                                {loading ? (
                                                    <>
                                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    'Save Changes'
                                                )}
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                /* View Mode - Edit Button */
                                <div className="flex justify-center relative z-10">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="py-3.5 px-8 rounded-xl font-semibold text-white transition-all duration-300 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300 group-hover:scale-105"></div>
                                        <span className="relative flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit Profile
                                        </span>
                                    </button>
                                </div>
                            )}

                            {/* Account Info */}
                            <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                                <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Member since</span>
                                        <p className="text-white">
                                            {user?.created_at
                                                ? new Date(user.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Account Status</span>
                                        <p className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${user?.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                            <span className="text-white">{user?.is_verified ? 'Verified' : 'Unverified'}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
