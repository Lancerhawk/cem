'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, Users, ArrowRight, Check, AlertCircle } from 'lucide-react'
import { sendSignUpOTP, verifySignUpOTP, createUserAccount, resendSignUpOTP } from '../../lib/actions/auth_action'

export default function SignUpPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
    acceptTerms: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (currentStep === 1) {
        // Step 1: Send OTP for verification (don't create account yet)
        const result = await sendSignUpOTP({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        })

        if (result.success) {
          setOtpSent(true)
          setOtpTimer(60)
          const interval = setInterval(() => {
            setOtpTimer((prev) => {
              if (prev <= 1) {
                clearInterval(interval)
                return 0
              }
              return prev - 1
            })
          }, 1000)
          setCurrentStep(currentStep + 1)
        } else {
          setError(result.message)
        }
      } else if (currentStep === 2) {
        // Step 2: Verify OTP
        const result = await verifySignUpOTP({
          email: formData.email,
          otp: formData.otp
        })

        if (result.success) {
          setCurrentStep(currentStep + 1)
        } else {
          setError(result.message)
        }
      } else if (currentStep === 3) {
        // Step 3: Create account and complete signup
        if (formData.acceptTerms) {
          const result = await createUserAccount({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password
          })
          
          if (result.success && result.user) {
            // Navigate to dashboard
            router.push('/dashboard')
          } else {
            setError(result.message)
          }
        } else {
          setError('Please accept the terms and conditions')
        }
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.firstName && formData.lastName && formData.email && formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
    }
    if (currentStep === 2) {
      return formData.otp && formData.otp.length === 6
    }
    return formData.acceptTerms
  }

  const handleResendOTP = async () => {
    if (otpTimer === 0) {
      setLoading(true)
      setError('')
      
      try {
        const result = await resendSignUpOTP(formData.email, formData.firstName)
        if (result.success) {
          setOtpTimer(60)
          const interval = setInterval(() => {
            setOtpTimer((prev) => {
              if (prev <= 1) {
                clearInterval(interval)
                return 0
              }
              return prev - 1
            })
          }, 1000)
        } else {
          setError(result.message)
        }
      } catch (error) {
        setError('Failed to resend verification code')
      } finally {
        setLoading(false)
      }
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            First Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
                         <input
               id="firstName"
               name="firstName"
               type="text"
               autoComplete="given-name"
               required
               value={formData.firstName}
               onChange={handleChange}
               className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
               placeholder="Enter your first name"
             />
          </div>
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
                         <input
               id="lastName"
               name="lastName"
               type="text"
               autoComplete="family-name"
               required
               value={formData.lastName}
               onChange={handleChange}
               className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
               placeholder="Enter your last name"
             />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
                     <input
             id="email"
             name="email"
             type="email"
             autoComplete="email"
             required
             value={formData.email}
             onChange={handleChange}
             className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
             placeholder="Enter your email address"
           />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
                         <input
               id="password"
               name="password"
               type={showPassword ? 'text' : 'password'}
               autoComplete="new-password"
               required
               value={formData.password}
               onChange={handleChange}
               className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
               placeholder="Create a password"
             />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
                         <input
               id="confirmPassword"
               name="confirmPassword"
               type={showConfirmPassword ? 'text' : 'password'}
               autoComplete="new-password"
               required
               value={formData.confirmPassword}
               onChange={handleChange}
               className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
               placeholder="Confirm your password"
             />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
        <p className="text-red-600 text-sm">Passwords do not match</p>
      )}
    </div>
  )

    const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify Your Email</h3>
        <p className="text-gray-600">
          We've sent a 6-digit verification code to <span className="font-medium text-gray-900">{formData.email}</span>
        </p>
      </div>

      <div>
        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
          Enter Verification Code
        </label>
        <div className="relative">
          <input
            id="otp"
            name="otp"
            type="text"
            maxLength={6}
            required
            value={formData.otp}
            onChange={handleChange}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 text-center text-lg tracking-widest"
            placeholder="000000"
          />
        </div>
      </div>

      <div className="text-center">
        {otpTimer > 0 ? (
          <p className="text-sm text-gray-600">
            Resend code in <span className="font-medium text-blue-600">{otpTimer}s</span>
          </p>
        ) : (
                     <button
             type="button"
             onClick={handleResendOTP}
             className="text-sm text-blue-600 hover:text-blue-700 font-medium"
           >
             Didn't receive the code? Resend
           </button>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Next Steps</h4>
            <p className="text-sm text-blue-700 mt-1">
              After verification, you'll be able to create unlimited workflows, invite team members, 
              and start assigning roles and tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Almost Done!</h3>
                 <p className="text-gray-600">
           Review your information and accept our terms to complete your account setup.
         </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Registration Summary</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <p><span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}</p>
          <p><span className="font-medium">Email:</span> {formData.email}</p>
          <p><span className="font-medium">Email Verified:</span> ✅ Yes</p>
        </div>
      </div>

      <div className="flex items-start space-x-3">
        <input
          id="acceptTerms"
          name="acceptTerms"
          type="checkbox"
          checked={formData.acceptTerms}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
        />
        <label htmlFor="acceptTerms" className="text-sm text-gray-700">
          I agree to the{' '}
          <Link href="/terms" className="text-blue-600 hover:text-blue-500">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
            Privacy Policy
          </Link>
        </label>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">CEM</h1>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create your account
          </h2>
                     <p className="text-gray-600">
             Create your account and start building unlimited workflows
           </p>
        </div>

                 {/* Progress Steps */}
         <div className="flex items-center justify-center space-x-4">
           {[
             { step: 1, label: 'Account' },
             { step: 2, label: 'Verify' },
             { step: 3, label: 'Complete' }
           ].map(({ step, label }) => (
             <div key={step} className="flex flex-col items-center">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                 step <= currentStep 
                   ? 'bg-blue-600 text-white' 
                   : 'bg-gray-200 text-gray-600'
               }`}>
                 {step < currentStep ? <Check className="w-4 h-4" /> : step}
               </div>
               <span className="text-xs text-gray-500 mt-1">{label}</span>
               {step < 3 && (
                 <div className={`w-12 h-1 mx-2 ${
                   step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                 }`} />
               )}
             </div>
           ))}
         </div>

                 {/* Error Display */}
         {error && (
           <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
             <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
             <p className="text-red-700 text-sm">{error}</p>
           </div>
         )}

         {/* Sign Up Form */}
         <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-200">
           <form className="space-y-6" onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            <div className="flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
                             <button
                 type="submit"
                 disabled={!canProceed() || loading}
                 className="ml-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
               >
                 {loading ? (
                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                 ) : (
                   <>
                     <span>{currentStep === 3 ? 'Create Account' : 'Continue'}</span>
                     <ArrowRight className="w-4 h-4" />
                   </>
                 )}
               </button>
            </div>
          </form>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/sign_in" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
