import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, onAuthStateChange } from '../firebase/authService';
import logo from '../assets/images/logo.png';

const Auth = () => {
    const navigate = useNavigate();
    
    // Redirect if already authenticated
    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            if (user) {
                navigate('/', { replace: true });
            }
        });

        return () => unsubscribe();
    }, [navigate]);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({
        email: '',
        password: '',
        general: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateForm = () => {
        const newErrors = {
            email: '',
            password: '',
            general: ''
        };

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return !newErrors.email && !newErrors.password;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
                general: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setErrors({ email: '', password: '', general: '' });

        try {
            const result = await signIn(formData.email, formData.password);
            
            if (result.success) {
                // Redirect to home page on successful login
                navigate('/');
            } else {
                console.error('Sign in failed:', result);
                setErrors(prev => ({
                    ...prev,
                    general: result.error || `Sign in failed. Error: ${result.errorCode || 'Unknown error'}. Please try again.`
                }));
            }
        } catch (error) {
            console.error('Unexpected error during sign in:', error);
            setErrors(prev => ({
                ...prev,
                general: `An unexpected error occurred: ${error.message || 'Unknown error'}. Please try again.`
            }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center px-4">
            <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md p-8">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <img 
                        src={logo} 
                        alt="PayTap Logo" 
                        className="w-32 h-32 mb-4 object-contain"
                    />
                    <h1 className="text-3xl font-bold text-white">PayTap</h1>
                    <p className="text-gray-400 text-sm mt-2">Sign in to continue</p>
                </div>

                {/* Error Message */}
                {errors.general && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
                        <p className="text-red-400 text-sm">{errors.general}</p>
                    </div>
                )}

                {/* Sign In Form */}
                <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                    {/* Hidden field to trick browsers into not autofilling */}
                    <input type="text" name="fake-username" autoComplete="username" style={{ display: 'none' }} tabIndex="-1" />
                    
                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            autoComplete="off"
                            inputMode="email"
                            className={`w-full p-3 bg-[#2a2a2a] border rounded-lg text-white focus:outline-none focus:ring-2 transition ${
                                errors.email 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-gray-600 focus:ring-blue-500'
                            }`}
                            placeholder="Enter your email"
                            disabled={loading}
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                autoComplete="new-password"
                                className={`w-full p-3 bg-[#2a2a2a] border rounded-lg text-white focus:outline-none focus:ring-2 transition pr-10 ${
                                    errors.password 
                                        ? 'border-red-500 focus:ring-red-500' 
                                        : 'border-gray-600 focus:ring-blue-500'
                                }`}
                                placeholder="Enter your password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.966 9.966 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-semibold transition ${
                            loading
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm">
                        Need help? Contact your administrator
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;