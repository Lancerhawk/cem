import Link from 'next/link'
import { 
  Users, 
  Target, 
  Award, 
  TrendingUp, 
  Shield, 
  Zap,
  CheckCircle,
  Star
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar currentPage="about" />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About CEM
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            We're revolutionizing how teams work together by creating intelligent, 
            role-based workflow management systems that drive productivity and performance.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                At CEM, we believe that every team has the potential to achieve extraordinary results. 
                Our mission is to provide organizations with the tools they need to create structured, 
                efficient workflows that empower team members to perform at their best.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We understand that modern teams need more than just task management – they need a 
                comprehensive system that handles role assignments, permissions, performance tracking, 
                and rewards in one unified platform.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Streamlined workflows</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Role-based access</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">10K+</h3>
                  <p className="text-gray-600">Active Users</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">500+</h3>
                  <p className="text-gray-600">Organizations</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">95%</h3>
                  <p className="text-gray-600">Satisfaction Rate</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">40%</h3>
                  <p className="text-gray-600">Productivity Boost</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Team First</h3>
              <p className="text-gray-600">
                We believe that great teams achieve great results. Our platform is designed to 
                bring out the best in every team member.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Excellence</h3>
              <p className="text-gray-600">
                We strive for excellence in everything we do, from our product design to 
                customer support and user experience.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Trust & Security</h3>
              <p className="text-gray-600">
                Your data security and privacy are our top priorities. We build with 
                enterprise-grade security standards.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600">
                We continuously innovate and improve our platform based on user feedback 
                and emerging technologies.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Recognition</h3>
              <p className="text-gray-600">
                We believe in recognizing and rewarding great performance. Our credit system 
                motivates teams to excel.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Success</h3>
              <p className="text-gray-600">
                Your success is our success. We're committed to helping you achieve your 
                goals and maximize your team's potential.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How CEM Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A comprehensive solution for modern team management
            </p>
          </div>

          <div className="space-y-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Workflow Creation & Department Setup</h3>
                <p className="text-lg text-gray-600 mb-4">
                  Create structured workflows and departments that match your organization's needs. 
                  Define processes, set up hierarchies, and establish clear communication channels.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Custom workflow templates</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Department hierarchy management</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Process automation</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 p-8 rounded-xl">
                <div className="text-center">
                  <Users className="w-24 h-24 text-blue-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900">Workflow Builder</h4>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="lg:order-2">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">User Invitation & Role Assignment</h3>
                <p className="text-lg text-gray-600 mb-4">
                  Invite team members and assign them specific roles with appropriate permissions. 
                  Control who can access what and who can give orders to whom.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Role-based access control</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Hierarchical permissions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Secure invitation system</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 p-8 rounded-xl lg:order-1">
                <div className="text-center">
                  <Shield className="w-24 h-24 text-green-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900">Role Management</h4>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Task Management & Performance Tracking</h3>
                <p className="text-lg text-gray-600 mb-4">
                  Assign tasks with deadlines, track progress, and monitor performance. 
                  Our credit system rewards excellence and motivates continuous improvement.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Task assignment with deadlines</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Real-time progress tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Credit-based reward system</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 p-8 rounded-xl">
                <div className="text-center">
                  <Target className="w-24 h-24 text-purple-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900">Task Dashboard</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Team?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the thousands of organizations already using CEM to streamline their workflows 
            and boost team productivity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign_up" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              Start Free Trial
            </Link>
            <Link href="/contact" className="border border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
