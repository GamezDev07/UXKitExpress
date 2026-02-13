'use client'

import { useState, useEffect } from 'react'
import { User, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function SettingsPage() {
    const { user, supabase } = useAuth()
    const [activeTab, setActiveTab] = useState('profile')

    // Profile form
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')

    // Password form
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // UI states
    const [profileMessage, setProfileMessage] = useState(null)
    const [passwordMessage, setPasswordMessage] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (user) {
            setFullName(user.user_metadata?.full_name || '')
            setEmail(user.email || '')
        }
    }, [user])

    const handleProfileUpdate = async (e) => {
        e.preventDefault()
        setLoading(true)
        setProfileMessage(null)

        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            })

            if (error) throw error

            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' })
        } catch (error) {
            console.error('Error updating profile:', error)
            setProfileMessage({ type: 'error', text: error.message || 'Failed to update profile' })
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordUpdate = async (e) => {
        e.preventDefault()
        setLoading(true)
        setPasswordMessage(null)

        // Validation
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Passwords do not match' })
            setLoading(false)
            return
        }

        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' })
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) throw error

            setPasswordMessage({ type: 'success', text: 'Password updated successfully!' })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error) {
            console.error('Error updating password:', error)
            setPasswordMessage({ type: 'error', text: error.message || 'Failed to update password' })
        } finally {
            setLoading(false)
        }
    }

    const MessageAlert = ({ message }) => {
        if (!message) return null

        return (
            <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                ) : (
                    <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{message.text}</span>
            </div>
        )
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Settings
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage your account settings and preferences
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-8">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'profile'
                                    ? 'text-red-600 dark:text-blue-500'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <User className="w-4 h-4 inline-block mr-2" />
                            Profile
                            {activeTab === 'profile' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500"></div>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('security')}
                            className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'security'
                                    ? 'text-red-600 dark:text-blue-500'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Lock className="w-4 h-4 inline-block mr-2" />
                            Security
                            {activeTab === 'security' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500"></div>
                            )}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        {activeTab === 'profile' ? (
                            /* Profile Tab */
                            <form onSubmit={handleProfileUpdate}>
                                <MessageAlert message={profileMessage} />

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900/50 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                            Email cannot be changed
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* Security Tab */
                            <form onSubmit={handlePasswordUpdate}>
                                <MessageAlert message={passwordMessage} />

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            placeholder="Enter new password"
                                            minLength={6}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            placeholder="Confirm new password"
                                            minLength={6}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}
