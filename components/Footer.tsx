import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { FaInstagramSquare , FaTwitterSquare , FaYoutubeSquare , FaFacebookSquare, FaLinkedin  } from "react-icons/fa"
import { Facebook, Twitter, Youtube } from "lucide-react"
import { MessageCircle } from "lucide-react"

const Footer: React.FC = () => {
  return (
    <footer className="absulate bg-gray-100 py-12 px-4 md:px-8 lg:px-16 ">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Logo and Social Media Section */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo/logo.png"
                alt="BZ Trade Fairs Logo"
                width={150}
                height={60}
                className="object-contain"
              />
            </Link>

            <p className="text-gray-600 text-sm mb-4">Follow us on</p>

            <div className="flex space-x-3">
              <a
                href="https://www.facebook.com/biztradefair/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="rounded flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors duration-200"
              >
                <FaFacebookSquare className="w-8 h-8" />
              </a>
              <a
                href="https://www.instagram.com/biztradefairs/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className=" rounded flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors duration-200"
              >
                <FaInstagramSquare className="w-8 h-8" />
              </a>
              <a
                href="https://x.com/biztradefair"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="w-8 h-8  rounded flex items-center justify-center hover:bg-blue-400 hover:text-white transition-colors duration-200"
              >
                <FaTwitterSquare className="w-8 h-8" />
              </a>
              {/* <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="rounded flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors duration-200"
              >
                <FaYoutubeSquare className="w-8 h-8" />
              </a> */}

                            {/* LinkedIn Icon */}
              <a
                href="https://www.linkedin.com/company/biztradefairs/" // Replace with actual LinkedIn URL
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="rounded flex items-center justify-center hover:bg-blue-700 hover:text-white transition-colors duration-200"
              >
                <FaLinkedin className="w-8 h-8" />
              </a>


            </div>
          </div>

          {/* Services Column */}
          <div className="lg:col-span-1">
            <h4 className="text-gray-500 font-bold mb-4">Services</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/event"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Find Events
                </Link>
              </li>
              <li>
                <Link
                  href="/venues"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Book Venues
                </Link>
              </li>
              <li>
                <Link
                  href="/organizers"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Event Organizers
                </Link>
              </li>
              <li>
                <Link
                  href="/speakers"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Find Speakers
                </Link>
              </li>
              <li>
                <Link
                  href="/exhibitors"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Exhibitor Services
                </Link>
              </li>
              {/* <li>
                <Link
                  href="/marketing"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Event Marketing
                </Link>
              </li> */}
              {/* <li>
                <Link
                  href="/registration"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Event Registration
                </Link>
              </li> */}
              {/* <li>
                <Link
                  href="/analytics"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Event Analytics
                </Link>
              </li> */}
              {/* <li>
                <Link
                  href="/partnerships"
                  className="text-black  hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Partner With Us
                </Link>
              </li> */}
            </ul>
          </div>

          {/* Company Column */}
          <div className="lg:col-span-1">
            <h4 className="text-gray-500  font-bold mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about-us"
                  className="text-black  hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-black  hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-black  hover:text-blue-800 transition-colors duration-200 text-sm">
                  Articles
                </Link>
              </li>
              {/* <li>
                <Link
                  href="/press"
                  className="text-black  hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Press Releases
                </Link>
              </li> */}
              {/* <li>
                <Link
                  href="/partner-program"
                  className="text-black  hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Become Partner
                </Link>
              </li> */}
              <li>
                <Link
                  href="/organizer-program"
                  className="text-black  hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Become Organizer
                </Link>
              </li>
              {/* <li>
                <Link
                  href="/corporate"
                  className="text-black  hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Corporate Information
                </Link>
              </li> */}
            </ul>
          </div>

          {/* Event Categories Column */}
          <div className="lg:col-span-1">
            <h4 className="text-gray-500  font-bold mb-4">Event Categories</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/event?category=Education"
                  className="text-black  hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Education Training
                </Link>
              </li>
              <li>
                <Link
                  href="/event?category=Medical"
                  className="text-black  hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Medical & Pharma
                </Link>
              </li>
              <li>
                <Link
                  href="/event?category=Technology"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  IT & Technology
                </Link>
              </li>
              <li>
                <Link
                  href="/event?category=Finance"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Banking & Finance
                </Link>
              </li>
              <li>
                <Link
                  href="/event?category=Business"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Business Services
                </Link>
              </li>
              <li>
                <Link
                  href="/event?category=Industrial%20Engineering"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Industrial Engineering
                </Link>
              </li>
              <li>
                <Link
                  href="/event?category=Building%20%26%20Construction"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Building & Construction
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Support Column */}
          <div className="lg:col-span-1">
            <h4 className="text-gray-500 font-bold mb-4">Help & Support</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/faq" className="text-black hover:text-blue-800 transition-colors duration-200 text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact-us"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Support Center
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* More Info Column */}
          <div className="lg:col-span-1">
            <h4 className="text-gray-500 font-bold mb-4">More Info</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/terms-conditions"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/cookie-policy"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Cookie Policy
                </Link>
              </li>
              {/* <li>
                <Link href="/gdpr" className="text-black hover:text-blue-800 transition-colors duration-200 text-sm">
                  GDPR Compliance
                </Link>
              </li> */}
              {/* <li>
                <Link
                  href="/accessibility"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm"
                >
                  Accessibility
                </Link>
              </li> */}
              {/* <li>
                <Link
                  href="/safety"
                  className="text-black hover:text-blue-800 transition-colors duration-200 text-sm mb-10"
                >
                  Event Safety
                </Link>
              </li> */}
            </ul>
            <div className=" bottom-6 mt-10 z-50">
          <button className="bg-[#002c71] hover:bg-teal-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 transition-colors duration-200">
            <MessageCircle className="w-5 h-5" />
            <div className="text-left">
              <div className="text-sm font-semibold">Chat with Us</div>
              <div className="text-xs opacity-90">Got questions? Just ask.</div>
            </div>
          </button>
        </div>
          </div>
          
        </div>

        {/* Chat with Us Button */}
        

   {/* Registered Office Section */}
<div className="border-t-1 border-gray-500 pt-8">
  <div className="mb-6">
    <h5 className="text-gray-900 font-semibold mb-2">
      Registered Office:
    </h5>
    <p className="text-gray-600 text-sm leading-relaxed">
      Maxx Business Media Pvt Ltd | # T9, 3rd Floor, Swastik Manandi Arcade,
      SC Road, Seshadripuram, Bengaluru – 560020, India,
      Support-+91-9148319993 | CIN: U74999KA2019PTC123194
    </p>
  </div>

  <div className="mb-6">
    <p className="text-gray-600 text-xs leading-relaxed">
      ** All event names, logos, and brands are property of their respective
      owners. All company, event and service names used in this website are
      for identification purposes only. Use of these names, logos, and brands
      does not imply endorsement.
    </p>
  </div>

  <div className="border-t-1 border-gray-500 pt-10"></div>

  <div className="text-gray-600 text-sm">
    Copyright © 2025 Maxx Business Media Pvt Ltd All rights reserved
  </div>
</div>

      </div>
    </footer>
  )
}

export default Footer
