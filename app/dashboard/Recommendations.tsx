"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Person {
  id: string
  name: string
  industry: string
  location: string
  image: string
}

export function Recommendations() {
  const [people, setPeople] = useState<Person[]>([])

  useEffect(() => {
    // Mock API data
    const mockPeople: Person[] = Array.from({ length: 12 }, (_, i) => ({
      id: String(i + 1),
      name: "Ramesh S",
      industry: "Mobile Technology",
      location: "Chennai, India",
      image: "/image/Ellipse 72.png", // Replace with your image path
    }))
    setPeople(mockPeople)
  }, [])

  return (
    <div className="space-y-6">
      {/* Title */}
      {/* <h2 className="text-xl font-bold">Recommendation</h2>
      <hr /> */}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {people.map((person) => (
          <Card
            key={person.id}
            className="shadow-md hover:shadow-lg transition rounded-lg"
          >
            <CardContent className="flex flex-col items-center p-4">
              {/* Profile Image */}
              <img
                src={person.image}
                alt={person.name}
                className="w-24 h-24 object-cover rounded-full mb-3"
              />

              {/* Name & Details */}
              <h3 className="font-bold text-blue-600">{person.name}</h3>
              <p className="text-sm text-gray-600">{person.industry}</p>
              <p className="text-sm text-gray-600 mb-4">{person.location}</p>

              {/* Connect Button */}
              <Button
                variant="outline"
                className="w-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition"
              >
                Connect
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
