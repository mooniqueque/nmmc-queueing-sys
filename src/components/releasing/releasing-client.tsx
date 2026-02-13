"use client"

import { useState } from 'react'
import {
  MdSearch,
  MdSort,
  MdFilterList,
  MdOpenInNew,
} from 'react-icons/md'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const departments = [
  'Animal Bite',
  'Cardiology',
  'Dental',
  'EC',
  'ENT',
  'Eye Care',
  'Fam Med',
  'Geriatric Med',
  'IM Nephrology',
  'Internal Med',
  'Laboratory',
  'LC Adult',
]

// Mock user role - in real app, fetch from auth context/session
const userRole = 'admin' // 'admin' | 'user'

export default function ReleasingClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [ticketsToRelease, setTicketsToRelease] = useState('')

  const isAdmin = userRole === 'admin'

  return (
    <>
      {/* Admin UI */}
      {isAdmin && (
        <div className="p-6 flex flex-col gap-6">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-emerald-800">Ticket Releasing</h2>
              <p className="text-sm text-muted-foreground">Manage and release tickets by department</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-[300px]">
                <Input
                  placeholder="Search departments....."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border-slate-200"
                />
                <Button variant="outline" size="sm">
                  <MdSearch />
                </Button>
              </div>

              <Button variant="outline" size="sm">
                <MdSort />
                <span className="ml-1">Sort</span>
              </Button>

              <Button variant="outline" size="sm">
                <MdFilterList />
                <span className="ml-1">Filter</span>
              </Button>

              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src="/avatar.png" alt="user" />
                  <AvatarFallback>AS</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          {/* TWO COLUMN LAYOUT */}
          <div className="flex gap-6 flex-1 items-start min-h-0">
            {/* LEFT SIDE - DEPARTMENT CARDS */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-4">
                <h3 className="font-medium text-sm text-emerald-700">All Departments</h3>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 pb-24">
                <div className="grid grid-cols-2 gap-3 items-stretch">
                  {Array.from({ length: 20 }).map((_, idx) => {
                    const name = departments[idx % departments.length]
                    return (
                      <div key={idx} className="w-full min-w-0">
                        <Card 
                          className={`w-full min-w-0 overflow-hidden shadow-sm border cursor-pointer transition-all ${
                            selectedDepartment === name 
                              ? 'ring-2 ring-emerald-600 border-emerald-600' 
                              : 'border-slate-200 hover:border-emerald-300'
                          }`}
                          onClick={() => setSelectedDepartment(name)}
                        >
                          <div className="flex items-center gap-3 p-3">
                            <div className="w-1.5 h-10 rounded-full bg-emerald-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-emerald-900 truncate">{name}</div>
                              <div className="text-xs text-slate-500">Tickets Released: 01</div>
                            </div>

                            <div className="flex-shrink-0">
                              <Button variant="ghost" size="icon" className="bg-emerald-50 hover:bg-emerald-100 h-8 w-8">
                                <MdOpenInNew className="text-emerald-700" size={16} />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - INPUT CARD */}
            <div className="w-80 flex-shrink-0 self-start">
              <Card className="shadow-sm border-slate-200 sticky top-6">
                <CardHeader className="border-b border-slate-200">
                  <CardTitle className="text-lg text-emerald-900">Release Tickets</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* SELECTED DEPARTMENT DISPLAY */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Selected Department</label>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                      <p className="text-sm font-medium text-emerald-900">
                        {selectedDepartment || 'No department selected'}
                      </p>
                    </div>
                  </div>

                  {/* NUMBER INPUT */}
                  <div>
                    <label htmlFor="tickets" className="text-sm font-semibold text-slate-700 block mb-2">
                      Number of Tickets to Release
                    </label>
                    <Input
                      id="tickets"
                      type="number"
                      placeholder="Enter number..."
                      value={ticketsToRelease}
                      onChange={(e) => setTicketsToRelease(e.target.value)}
                      className="bg-white border-slate-200"
                      min="0"
                    />
                    <p className="text-xs text-slate-500 mt-1">Enter the number of tickets to release for this department</p>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
                    disabled={!selectedDepartment || !ticketsToRelease}
                  >
                    Release Tickets
                  </Button>

                  {/* RESET BUTTON */}
                  <Button 
                    variant="outline"
                    className="w-full border-slate-200"
                    onClick={() => {
                      setSelectedDepartment('')
                      setTicketsToRelease('')
                    }}
                  >
                    Clear
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Regular User UI */}
      {!isAdmin && (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-center text-emerald-800">Ticket Request</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground text-center">Select a department to request a ticket</p>

              <div className="flex flex-col gap-2">
                {departments.map((dept) => (
                  <Button
                    key={dept}
                    variant="outline"
                    className="w-full justify-start text-left hover:bg-emerald-50"
                  >
                    {dept}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
